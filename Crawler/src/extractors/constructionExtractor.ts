/**
 * Construction Projects Extractor
 * Extracts new construction projects from "בניה חדשה" (New Construction) section
 */

import type { Page } from "playwright";
import type { ConstructionProjectInput } from "../models/Property.js";

/**
 * Extract new construction projects from property page
 * Returns array of construction projects (first page only, no pagination)
 */
export async function extractConstructionProjects(
  page: Page,
  propertyId: string
): Promise<ConstructionProjectInput[]> {
  try {
    // First, expand the construction section
    console.log('[constructionExtractor] Expanding construction section...');

    try {
      const constructionHeading = page.locator('h3').filter({ hasText: 'בניה חדשה' }).first();
      if (await constructionHeading.count() > 0) {
        // Click parent to expand
        const parent = constructionHeading.locator('..').first();
        await parent.click({ timeout: 3000 });
        // Wait for content to load
        await page.waitForTimeout(2000);
        console.log('[constructionExtractor] Section expanded');
      } else {
        console.log('[constructionExtractor] Construction heading not found');
        return [];
      }
    } catch (error: any) {
      console.log('[constructionExtractor] Failed to expand section:', error.message);
      // Continue anyway - section might already be expanded
    }

    // Extract construction projects data
    const projects = await page.evaluate((propId) => {
      const results: any[] = [];

      // Find all links that might contain construction project names
      // Construction projects are typically in links or project cards
      const allLinks = Array.from(document.querySelectorAll('a'));

      for (const link of allLinks) {
        const linkText = link.textContent?.trim() || '';

        // Construction project links might contain:
        // - "פרויקט" (project)
        // - Hebrew project names with building details
        // - Address with "דירות X חד'" pattern
        if (linkText.length < 5) {
          continue;
        }

        // Check if this looks like a construction project
        // Projects typically have: name, "דירות X-Y חד'", "X קומות", address
        const isProject =
          linkText.includes('דירות') &&
          linkText.includes('חד\'') &&
          (linkText.includes('קומות') || linkText.includes('קומה'));

        if (!isProject) {
          continue;
        }

        // Parse project data from link text
        // Format: "Project Name\nדירות 5-3 חד'\nX קומות\nAddress"
        const lines = linkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        if (lines.length < 2) {
          continue;
        }

        const projectData: any = {
          property_id: propId,
          project_name: lines[0]
        };

        // Parse remaining lines
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];

          // Room range: "דירות 5-3 חד'"
          if (line.includes('דירות') && line.includes('חד\'')) {
            const roomMatch = line.match(/(\d+)-(\d+)\s*חד/);
            if (roomMatch) {
              projectData.room_range = `${roomMatch[1]}-${roomMatch[2]}`;
            }
          }

          // Floors: "X קומות"
          if (line.includes('קומות') || line.includes('קומה')) {
            const floorMatch = line.match(/(\d+)\s*קומ/);
            if (floorMatch) {
              projectData.total_floors = parseInt(floorMatch[1]);
            }
          }

          // Price: "החל מ - ‏X,XXX,XXX ‏₪"
          if (line.includes('החל מ')) {
            const priceMatch = line.match(/(\d[\d,]*)\s*₪/);
            if (priceMatch) {
              projectData.starting_price = parseInt(priceMatch[1].replace(/,/g, ''));
            }
          }

          // Location/Address: contains comma and city name
          if (line.includes(',') && (line.includes('חיפה') || line.includes('נשר') || line.includes('נהריה'))) {
            projectData.project_location = line;
          }
        }

        // Extract distance if in nearby text (might be in parent element)
        const parentText = link.parentElement?.textContent || '';
        const distanceMatch = parentText.match(/(\d+\.?\d*)\s*(מטר|ק״מ)/);
        if (distanceMatch) {
          const value = parseFloat(distanceMatch[1]);
          const unit = distanceMatch[2];
          projectData.distance_meters = unit.includes('ק״מ')
            ? Math.round(value * 1000)
            : Math.round(value);
        }

        // Only add if we have at least name and some details
        if (projectData.project_name && projectData.project_name.length > 3) {
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
