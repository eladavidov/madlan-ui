/**
 * Schools Extractor
 * Extracts nearby schools data from "בתי ספר" (Schools) section
 */

import type { Page } from "playwright";
import type { NearbySchoolInput } from "../models/Property.js";
import { expandPanelByText, waitForPanelContent } from "../utils/panelExpander.js";

/**
 * Extract nearby schools from property page
 * Returns array of schools (first page only, no pagination)
 */
export async function extractNearbySchools(
  page: Page,
  propertyId: string
): Promise<NearbySchoolInput[]> {
  try {
    // Try to expand the schools panel if it's collapsed
    const panelExpanded = await expandPanelByText(page, "בתי ספר");

    if (panelExpanded) {
      // Wait for schools list to load
      await waitForPanelContent(page, '[class*="school"], ul, li', 3000);
    }

    // Extract schools data
    const schools = await page.evaluate((propId) => {
      const results: any[] = [];

      // Strategy 1: Look for list of schools (ul/li structure)
      const schoolLists = document.querySelectorAll('ul, ol, [class*="list"]');

      for (const list of schoolLists) {
        // Check if this list contains school data
        const listText = list.textContent || '';
        if (listText.includes('בית ספר') || listText.includes('ילדים') || listText.includes('תיכון')) {
          const items = Array.from(list.querySelectorAll('li, [class*="item"]'));

          for (const item of items) {
            const text = item.textContent?.trim() || '';

            if (text.length < 5) continue; // Skip empty items

            const schoolData: any = {
              property_id: propId,
              school_name: ''
            };

            // Extract school name (usually the main text)
            // Remove common patterns like distances, types
            let name = text;

            // Extract distance if present (e.g., "500 מטר", "1 ק״מ")
            const distanceMatch = text.match(/(\d+\.?\d*)\s*(מטר|מ\'|ק״מ|קילומטר)/);
            if (distanceMatch) {
              const value = parseFloat(distanceMatch[1]);
              const unit = distanceMatch[2];

              // Convert to meters
              if (unit.includes('ק״מ') || unit.includes('קילומטר')) {
                schoolData.distance_meters = Math.round(value * 1000);
              } else {
                schoolData.distance_meters = Math.round(value);
              }

              // Remove distance from name
              name = name.replace(distanceMatch[0], '').trim();
            }

            // Extract school type (יסודי, תיכון, גן ילדים, etc.)
            const types = ['בית ספר יסודי', 'בית ספר תיכון', 'תיכון', 'יסודי', 'גן ילדים', 'חטיבת ביניים', 'ממלכתי', 'ממלכתי דתי'];
            for (const type of types) {
              if (text.includes(type)) {
                schoolData.school_type = type;
                // Remove type from name
                name = name.replace(type, '').trim();
                break;
              }
            }

            // Extract grades (א-ו, ז-יב, etc.)
            const gradesMatch = text.match(/([א-ת])-([א-ת])|כיתות ([א-ת])-([א-ת])/);
            if (gradesMatch) {
              schoolData.grades_offered = gradesMatch[0];
              // Remove grades from name
              name = name.replace(gradesMatch[0], '').trim();
            }

            // Clean up name (remove extra whitespace, punctuation)
            name = name
              .replace(/\s+/g, ' ')
              .replace(/^[,.-]\s*/, '')
              .replace(/\s*[,.-]$/, '')
              .trim();

            schoolData.school_name = name;

            // Only add if we have a name
            if (schoolData.school_name && schoolData.school_name.length > 2) {
              results.push(schoolData);
            }
          }

          // If we found schools in this list, stop looking
          if (results.length > 0) {
            break;
          }
        }
      }

      // Strategy 2: Look for school cards or divs
      if (results.length === 0) {
        const schoolElements = document.querySelectorAll('[class*="school"], [data-type*="school"]');

        for (const element of schoolElements) {
          const text = element.textContent?.trim() || '';

          if (text.length < 5) continue;

          // Apply similar parsing logic as above
          const schoolData: any = {
            property_id: propId,
            school_name: text.substring(0, 100) // Limit name length
          };

          // Extract additional data if structured differently
          const nameEl = element.querySelector('[class*="name"], [class*="title"], h3, h4');
          if (nameEl) {
            schoolData.school_name = nameEl.textContent?.trim() || text.substring(0, 100);
          }

          const distanceEl = element.querySelector('[class*="distance"]');
          if (distanceEl) {
            const distText = distanceEl.textContent || '';
            const distMatch = distText.match(/(\d+\.?\d*)\s*(מטר|ק״מ)/);
            if (distMatch) {
              const value = parseFloat(distMatch[1]);
              const unit = distMatch[2];
              schoolData.distance_meters = unit.includes('ק״מ')
                ? Math.round(value * 1000)
                : Math.round(value);
            }
          }

          if (schoolData.school_name && schoolData.school_name.length > 2) {
            results.push(schoolData);
          }
        }
      }

      // Limit to first page (e.g., first 10-20 schools)
      return results.slice(0, 20);
    }, propertyId);

    return schools as NearbySchoolInput[];
  } catch (error) {
    console.error('Error extracting schools:', error);
    return [];
  }
}
