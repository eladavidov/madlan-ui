/**
 * Construction Projects Extractor
 * Extracts new construction projects from "פרויקטים חדשים בסביבה" (New Projects in the Area) section
 */

import type { Page } from "playwright";
import type { ConstructionProjectInput } from "../models/Property.js";

/**
 * Extract new construction projects from property page
 * Returns array of construction projects from the "New Projects in the Area" section
 */
export async function extractConstructionProjects(
  page: Page,
  propertyId: string
): Promise<ConstructionProjectInput[]> {
  try {
    console.log('[constructionExtractor] Extracting construction projects...');

    const projects = await page.evaluate((propId) => {
      const results: any[] = [];

      // Find all links that contain construction project data
      // Projects have both "חד׳" (rooms) and "קומות" (floors) and a city name
      const allLinks = Array.from(document.querySelectorAll('a'));

      const projectLinks = allLinks.filter(link => {
        const text = link.textContent?.trim() || '';
        return text.includes('חד׳') && text.includes('קומות') &&
               (text.includes('חיפה') || text.includes('נשר') || text.includes('נהריה') ||
                text.includes('קרית') || text.includes('עכו'));
      });

      console.log(`[constructionExtractor] Found ${projectLinks.length} project links`);

      for (const link of projectLinks) {
        const text = link.textContent?.trim() || '';

        if (text.length < 10) {
          continue;
        }

        const projectData: any = {
          property_id: propId
        };

        // Extract project name (text before "דירות")
        const nameMatch = text.match(/^(.+?)דירות/);
        if (nameMatch) {
          projectData.project_name = nameMatch[1].trim();
        }

        // Extract room range: "דירות 5 חד׳" or "דירות 5-3 חד׳"
        const roomMatch = text.match(/דירות\s+(\d+)(?:-(\d+))?\s*חד/);
        if (roomMatch) {
          if (roomMatch[2]) {
            // Range format: "5-3" -> reverse to "3-5"
            const num1 = parseInt(roomMatch[1]);
            const num2 = parseInt(roomMatch[2]);
            projectData.room_range = `${Math.min(num1, num2)}-${Math.max(num1, num2)}`;
          } else {
            // Single number
            projectData.room_range = roomMatch[1];
          }
        }

        // Extract total floors: "X קומות"
        const floorMatch = text.match(/(\d+)\s*קומות/);
        if (floorMatch) {
          projectData.total_floors = parseInt(floorMatch[1]);
        }

        // Extract starting price: "החל מ - ‏3,350,000 ‏₪"
        const priceMatch = text.match(/החל\s+מ\s*-?\s*[^\d]*([\d,]+)\s*₪/);
        if (priceMatch) {
          projectData.starting_price = parseInt(priceMatch[1].replace(/,/g, ''));
        }

        // Extract location (address with comma and city)
        // Look for pattern: "address, city" at the end
        const locationMatch = text.match(/([^₪\n]+,\s*(?:חיפה|נשר|נהריה|קרית[^,]+|עכו))\s*$/);
        if (locationMatch) {
          projectData.project_location = locationMatch[1].trim();
        }

        // Only add if we have at least project name
        if (projectData.project_name && projectData.project_name.length > 3) {
          // Clean up project name - remove "פרויקט חדש" prefix if present
          projectData.project_name = projectData.project_name.replace(/^פרויקט\s+חדש\s*/i, '');

          console.log(`[constructionExtractor] Adding project: ${projectData.project_name}`);
          results.push(projectData);
        }
      }

      console.log(`[constructionExtractor] Extracted ${results.length} projects`);
      return results.slice(0, 20); // Limit to first 20
    }, propertyId);

    console.log(`[constructionExtractor] Final result: ${projects.length} projects`);
    if (projects.length > 0) {
      console.log(`[constructionExtractor] Sample:`, JSON.stringify(projects[0]));
    }
    return projects as ConstructionProjectInput[];
  } catch (error) {
    console.error('Error extracting construction projects:', error);
    return [];
  }
}
