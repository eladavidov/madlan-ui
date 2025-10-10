/**
 * Construction Projects Extractor
 * Extracts new construction projects from "בניה חדשה" (New Construction) section
 */

import type { Page } from "playwright";
import type { ConstructionProjectInput } from "../models/Property.js";
import { expandPanelByText, waitForPanelContent } from "../utils/panelExpander.js";

/**
 * Extract new construction projects from property page
 * Returns array of construction projects (first page only, no pagination)
 */
export async function extractConstructionProjects(
  page: Page,
  propertyId: string
): Promise<ConstructionProjectInput[]> {
  try {
    // Try to expand the construction panel if it's collapsed
    const panelExpanded = await expandPanelByText(page, "בניה חדשה");

    if (panelExpanded) {
      // Wait for projects list to load
      await waitForPanelContent(page, '[class*="project"], [class*="construction"], ul, li', 3000);
    }

    // Extract construction projects data
    const projects = await page.evaluate((propId) => {
      const results: any[] = [];

      // Strategy 1: Look for list of projects (ul/li structure)
      const projectLists = document.querySelectorAll('ul, ol, [class*="list"]');

      for (const list of projectLists) {
        // Check if this list contains construction project data
        const listText = list.textContent || '';
        if (listText.includes('פרויקט') || listText.includes('בניה') || listText.includes('תוכנית')) {
          const items = Array.from(list.querySelectorAll('li, [class*="item"]'));

          for (const item of items) {
            const text = item.textContent?.trim() || '';

            if (text.length < 5) continue; // Skip empty items

            const projectData: any = {
              property_id: propId,
              project_name: ''
            };

            // Extract project name (usually the main text)
            let name = text;

            // Extract distance if present (e.g., "500 מטר", "1 ק״מ")
            const distanceMatch = text.match(/(\d+\.?\d*)\s*(מטר|מ\'|ק״מ|קילומטר)/);
            if (distanceMatch) {
              const value = parseFloat(distanceMatch[1]);
              const unit = distanceMatch[2];

              // Convert to meters
              if (unit.includes('ק״מ') || unit.includes('קילומטר')) {
                projectData.distance_meters = Math.round(value * 1000);
              } else {
                projectData.distance_meters = Math.round(value);
              }

              // Remove distance from name
              name = name.replace(distanceMatch[0], '').trim();
            }

            // Extract project status (תוכנית, בבניה, הושלם, etc.)
            const statuses = [
              'תוכנית',
              'בתכנון',
              'בבניה',
              'בשלבי בניה',
              'הושלם',
              'נבנה',
              'לקראת סיום',
              'חדש',
              'מתוכנן'
            ];

            for (const status of statuses) {
              if (text.includes(status)) {
                projectData.project_status = status;
                // Remove status from name
                name = name.replace(status, '').trim();
                break;
              }
            }

            // Extract completion date if present (year or date)
            const yearMatch = text.match(/\b(20[2-3]\d)\b/); // 2020-2039
            if (yearMatch) {
              projectData.completion_date = yearMatch[1];
              // Remove year from name
              name = name.replace(yearMatch[0], '').trim();
            }

            // Extract location/address if it looks like one
            const locationMatch = text.match(/([א-ת\s]+\d+|[א-ת\s]{10,})/);
            if (locationMatch && locationMatch[1].length < 100) {
              const potentialLocation = locationMatch[1].trim();
              // Check if it's not part of the project name
              if (potentialLocation.length < name.length * 0.5) {
                projectData.project_location = potentialLocation;
                name = name.replace(potentialLocation, '').trim();
              }
            }

            // Clean up name (remove extra whitespace, punctuation)
            name = name
              .replace(/\s+/g, ' ')
              .replace(/^[,.-]\s*/, '')
              .replace(/\s*[,.-]$/, '')
              .trim();

            projectData.project_name = name;

            // Only add if we have a name
            if (projectData.project_name && projectData.project_name.length > 2) {
              results.push(projectData);
            }
          }

          // If we found projects in this list, stop looking
          if (results.length > 0) {
            break;
          }
        }
      }

      // Strategy 2: Look for project cards or structured divs
      if (results.length === 0) {
        const projectElements = document.querySelectorAll(
          '[class*="project"], [class*="construction"], [data-type*="project"]'
        );

        for (const element of projectElements) {
          const text = element.textContent?.trim() || '';

          if (text.length < 5) continue;

          const projectData: any = {
            property_id: propId,
            project_name: ''
          };

          // Extract name from heading or title element
          const nameEl = element.querySelector('[class*="name"], [class*="title"], h3, h4, h5');
          if (nameEl) {
            projectData.project_name = nameEl.textContent?.trim() || text.substring(0, 100);
          } else {
            projectData.project_name = text.substring(0, 100);
          }

          // Extract location
          const locationEl = element.querySelector('[class*="location"], [class*="address"]');
          if (locationEl) {
            projectData.project_location = locationEl.textContent?.trim();
          }

          // Extract distance
          const distanceEl = element.querySelector('[class*="distance"]');
          if (distanceEl) {
            const distText = distanceEl.textContent || '';
            const distMatch = distText.match(/(\d+\.?\d*)\s*(מטר|ק״מ)/);
            if (distMatch) {
              const value = parseFloat(distMatch[1]);
              const unit = distMatch[2];
              projectData.distance_meters = unit.includes('ק״מ')
                ? Math.round(value * 1000)
                : Math.round(value);
            }
          }

          // Extract status
          const statusEl = element.querySelector('[class*="status"], [class*="stage"]');
          if (statusEl) {
            projectData.project_status = statusEl.textContent?.trim();
          }

          // Extract completion date
          const dateEl = element.querySelector('[class*="date"], [class*="completion"]');
          if (dateEl) {
            projectData.completion_date = dateEl.textContent?.trim();
          }

          if (projectData.project_name && projectData.project_name.length > 2) {
            results.push(projectData);
          }
        }
      }

      // Limit to first page (e.g., first 10-20 projects)
      return results.slice(0, 20);
    }, propertyId);

    return projects as ConstructionProjectInput[];
  } catch (error) {
    console.error('Error extracting construction projects:', error);
    return [];
  }
}
