/**
 * Schools Extractor
 * Extracts nearby schools data from "בתי ספר" (Schools) section
 */

import type { Page } from "playwright";
import type { NearbySchoolInput } from "../models/Property.js";

/**
 * Extract nearby schools from property page
 * Returns array of schools (first page only, no pagination)
 */
export async function extractNearbySchools(
  page: Page,
  propertyId: string
): Promise<NearbySchoolInput[]> {
  try {
    // First, expand the schools section
    console.log('[schoolsExtractor] Expanding schools section...');

    try {
      const schoolsHeading = page.locator('h3').filter({ hasText: 'בתי ספר' }).first();
      if (await schoolsHeading.count() > 0) {
        // Click parent to expand
        const parent = schoolsHeading.locator('..').first();
        await parent.click({ timeout: 3000 });
        // Wait for content to load
        await page.waitForTimeout(2000);
        console.log('[schoolsExtractor] Section expanded');
      } else {
        console.log('[schoolsExtractor] Schools heading not found');
        return [];
      }
    } catch (error: any) {
      console.log('[schoolsExtractor] Failed to expand section:', error.message);
      // Continue anyway - section might already be expanded
    }

    // Extract schools data using proper HTML structure parsing
    const schools = await page.evaluate((propId) => {
      const results: any[] = [];

      // Find all links that contain school cards
      const allLinks = Array.from(document.querySelectorAll('a'));

      for (const link of allLinks) {
        const linkText = link.textContent?.trim() || '';

        // School links contain "בית ספר" but not "בתי ספר" (plural heading)
        if (!linkText.includes('בית ספר') || linkText.includes('בתי ספר')) {
          continue;
        }

        // Parse school data from HTML structure using CSS classes
        const schoolData: any = {
          property_id: propId
        };

        // Extract school name (css-1wi4udx or similar pattern)
        const nameEl = link.querySelector('.css-1wi4udx, [class*="elbmory1"]');
        if (nameEl) {
          schoolData.school_name = nameEl.textContent?.trim().replace('בית ספר ', '').trim();
        }

        // Extract address (css-pewcrd or similar pattern)
        const addressEl = link.querySelector('.css-pewcrd, [class*="elbmory2"]');
        if (addressEl) {
          schoolData.school_address = addressEl.textContent?.trim();
        }

        // Extract type and grades (css-1vf85xs elements)
        const detailEls = link.querySelectorAll('.css-1vf85xs, [class*="elbmory4"]');
        if (detailEls.length >= 1) {
          schoolData.school_type = detailEls[0].textContent?.trim();
        }
        if (detailEls.length >= 2) {
          schoolData.grades_offered = detailEls[1].textContent?.trim();
        }

        // Extract rating if present (מדד מדלן XX/100)
        const ratingText = linkText;
        if (ratingText.includes('מדד מדלן')) {
          const ratingMatch = ratingText.match(/מדד מדלן\s*(\d+)\/100/);
          if (ratingMatch) {
            schoolData.school_rating = parseInt(ratingMatch[1]);
          }
        }

        // Only add if we have at least a name
        if (schoolData.school_name && schoolData.school_name.length > 2) {
          console.log(`[schoolsExtractor] Adding school: ${schoolData.school_name}`);
          results.push(schoolData);
        }
      }

      console.log(`[schoolsExtractor] Extracted ${results.length} schools`);
      return results.slice(0, 20); // Limit to first 20
    }, propertyId);

    console.log(`[schoolsExtractor] Final result: ${schools.length} schools`);
    if (schools.length > 0) {
      console.log(`[schoolsExtractor] Sample:`, JSON.stringify(schools[0]));
    }
    return schools as NearbySchoolInput[];
  } catch (error) {
    console.error('Error extracting schools:', error);
    return [];
  }
}
