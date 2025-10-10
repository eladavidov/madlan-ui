/**
 * Neighborhood Ratings Extractor
 * Extracts community ratings from "דירוגי השכנים" (Neighbors' Ratings) section
 */

import type { Page } from "playwright";
import type { NeighborhoodRatingsInput } from "../models/Property.js";
import { expandPanelByText, waitForPanelContent } from "../utils/panelExpander.js";

/**
 * Extract neighborhood ratings from property page
 * Returns ratings object with 6-7 different metrics (1-10 scale)
 */
export async function extractNeighborhoodRatings(
  page: Page,
  propertyId: string
): Promise<NeighborhoodRatingsInput | null> {
  try {
    // Try to expand the ratings panel if it's collapsed
    const panelExpanded = await expandPanelByText(page, "דירוגי השכנים");

    if (panelExpanded) {
      // Wait for ratings content to load
      await waitForPanelContent(page, '[class*="rating"], [class*="score"]', 3000);
    }

    // Extract ratings data
    const ratings = await page.evaluate((propId) => {
      const result: any = {
        property_id: propId
      };

      // Rating categories we're looking for (Hebrew text)
      const ratingCategories = {
        'תחושת קהילה': 'community_feeling',
        'קהילה': 'community_feeling',
        'נקיון ותחזוקה': 'cleanliness_maintenance',
        'נקיון': 'cleanliness_maintenance',
        'בתי ספר': 'schools_quality',
        'חינוך': 'schools_quality',
        'תחבורה ציבורית': 'public_transport',
        'תחבורה': 'public_transport',
        'קניות וסידורים': 'shopping_convenience',
        'קניות': 'shopping_convenience',
        'בילוי ופנאי': 'entertainment_leisure',
        'בילוי': 'entertainment_leisure',
        'פנאי': 'entertainment_leisure'
      };

      // Strategy 1: Look for rating elements with text labels and scores
      const allElements = Array.from(document.querySelectorAll('*'));

      for (const element of allElements) {
        const text = element.textContent?.trim() || '';

        // Check if this element contains a rating category
        for (const [hebrewName, fieldName] of Object.entries(ratingCategories)) {
          if (text.includes(hebrewName) && text.length < 50) { // Length check to avoid long paragraphs
            // Try to find the rating number nearby
            // Pattern 1: "7/10" or "7 / 10"
            const ratingMatch = text.match(/(\d+\.?\d*)\s*\/\s*(\d+)/);
            if (ratingMatch) {
              const score = parseFloat(ratingMatch[1]);
              const max = parseFloat(ratingMatch[2]);

              // Normalize to 1-10 scale if needed
              let normalizedScore = score;
              if (max !== 10) {
                normalizedScore = (score / max) * 10;
              }

              // Validate score is in reasonable range (0-10)
              if (normalizedScore >= 0 && normalizedScore <= 10) {
                result[fieldName] = Math.round(normalizedScore * 10) / 10; // Round to 1 decimal
              }
            }

            // Pattern 2: Just a number (e.g., "8.5")
            const scoreMatch = text.match(/(\d+\.?\d*)/);
            if (scoreMatch && !result[fieldName]) {
              const score = parseFloat(scoreMatch[1]);
              if (score >= 0 && score <= 10) {
                result[fieldName] = Math.round(score * 10) / 10;
              }
            }

            // Pattern 3: Look in sibling or child elements
            if (!result[fieldName]) {
              const parent = element.parentElement;
              if (parent) {
                const siblings = Array.from(parent.children);
                for (const sibling of siblings) {
                  if (sibling !== element) {
                    const siblingText = sibling.textContent?.trim() || '';
                    const siblingMatch = siblingText.match(/(\d+\.?\d*)\s*\/\s*(\d+)|^(\d+\.?\d*)$/);
                    if (siblingMatch) {
                      const score = parseFloat(siblingMatch[1] || siblingMatch[3]);
                      if (score >= 0 && score <= 10) {
                        result[fieldName] = Math.round(score * 10) / 10;
                        break;
                      }
                    }
                  }
                }
              }
            }
          }
        }

        // Look for overall rating
        if (text.includes('דירוג כללי') || text.includes('ציון כולל') || text.includes('overall')) {
          const overallMatch = text.match(/(\d+\.?\d*)\s*\/\s*(\d+)|(\d+\.?\d*)/);
          if (overallMatch) {
            const score = parseFloat(overallMatch[1] || overallMatch[3]);
            if (score >= 0 && score <= 10) {
              result.overall_rating = Math.round(score * 10) / 10;
            }
          }
        }
      }

      // Strategy 2: Look for structured rating components
      const ratingElements = document.querySelectorAll('[class*="rating"], [class*="score"], [data-rating]');

      for (const element of ratingElements) {
        // Try to extract rating from data attributes
        const ratingValue = element.getAttribute('data-rating') || element.getAttribute('data-score');
        if (ratingValue) {
          const score = parseFloat(ratingValue);
          if (score >= 0 && score <= 10) {
            // Try to find which category this belongs to
            const label = element.textContent?.trim() || '';
            for (const [hebrewName, fieldName] of Object.entries(ratingCategories)) {
              if (label.includes(hebrewName) && !result[fieldName]) {
                result[fieldName] = Math.round(score * 10) / 10;
                break;
              }
            }
          }
        }
      }

      // Calculate overall rating if not found but we have individual ratings
      if (!result.overall_rating) {
        const scores = Object.keys(result)
          .filter(key => key !== 'property_id')
          .map(key => result[key])
          .filter(val => typeof val === 'number');

        if (scores.length > 0) {
          const average = scores.reduce((sum: number, val: number) => sum + val, 0) / scores.length;
          result.overall_rating = Math.round(average * 10) / 10;
        }
      }

      // Only return if we have at least one rating
      const hasRatings = Object.keys(result).length > 1; // More than just property_id
      return hasRatings ? result : null;
    }, propertyId);

    return ratings as NeighborhoodRatingsInput | null;
  } catch (error) {
    console.error('Error extracting neighborhood ratings:', error);
    return null;
  }
}
