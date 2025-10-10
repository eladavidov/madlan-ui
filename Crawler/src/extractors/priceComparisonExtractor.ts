/**
 * Price Comparisons Extractor
 * Extracts price comparison data from "מחירי דירות" (Property Prices) section
 */

import type { Page } from "playwright";
import type { PriceComparisonInput } from "../models/Property.js";
import { expandPanelByText, waitForPanelContent } from "../utils/panelExpander.js";

/**
 * Extract price comparisons from property page
 * Returns array of price comparisons by room count
 */
export async function extractPriceComparisons(
  page: Page,
  propertyId: string
): Promise<PriceComparisonInput[]> {
  try {
    // Try to expand the price comparison panel if it's collapsed
    const panelExpanded = await expandPanelByText(page, "מחירי דירות");

    if (panelExpanded) {
      // Wait for price data to load
      await waitForPanelContent(page, '[class*="price"], [class*="chart"]', 3000);
    }

    // Extract price comparison data
    const comparisons = await page.evaluate((propId) => {
      const results: any[] = [];

      // Strategy 1: Look for structured price data (tables or lists)
      // Common pattern: "3 חדרים: ₪1,500,000" or similar

      const allElements = Array.from(document.querySelectorAll('*'));

      for (const element of allElements) {
        const text = element.textContent?.trim() || '';

        // Look for room count pattern (e.g., "3 חדרים", "4 חדרים", "5+ חדרים")
        const roomMatch = text.match(/(\d+\.?\d*)\s*(?:\+)?\s*חדרים/);

        if (roomMatch) {
          const roomCount = parseFloat(roomMatch[1]);

          // Look for prices in the same element or nearby
          const priceMatches = text.matchAll(/₪?\s*([\d,]+)\s*₪?/g);
          const prices: number[] = [];

          for (const match of priceMatches) {
            const priceStr = match[1].replace(/,/g, '');
            const price = parseInt(priceStr);

            // Validate it's a reasonable property price (₪100,000 - ₪100,000,000)
            if (price >= 100000 && price <= 100000000) {
              prices.push(price);
            }
          }

          if (prices.length > 0) {
            const comparisonData: any = {
              property_id: propId,
              room_count: Math.round(roomCount)
            };

            // If we have one price, it's the average
            if (prices.length === 1) {
              comparisonData.average_price = prices[0];
            }

            // If we have two prices, they might be old and new
            if (prices.length === 2) {
              comparisonData.old_price = Math.min(...prices);
              comparisonData.new_price = Math.max(...prices);
              comparisonData.average_price = Math.round((prices[0] + prices[1]) / 2);

              // Calculate trend
              const change = ((comparisonData.new_price - comparisonData.old_price) / comparisonData.old_price) * 100;
              if (Math.abs(change) < 1) {
                comparisonData.price_trend = 'stable';
              } else if (change > 0) {
                comparisonData.price_trend = `up ${Math.round(change)}%`;
              } else {
                comparisonData.price_trend = `down ${Math.round(Math.abs(change))}%`;
              }
            }

            // If we have three or more prices, take average
            if (prices.length >= 3) {
              comparisonData.average_price = Math.round(
                prices.reduce((sum, p) => sum + p, 0) / prices.length
              );
            }

            results.push(comparisonData);
          }
        }
      }

      // Strategy 2: Look for chart data (might be in data attributes or script tags)
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const scriptContent = script.textContent || '';

        // Look for JSON data with room counts and prices
        const jsonMatch = scriptContent.match(/\{[^}]*"rooms?"\s*:\s*\d+[^}]*"price"\s*:\s*\d+[^}]*\}/gi);
        if (jsonMatch) {
          for (const jsonStr of jsonMatch) {
            try {
              const data = JSON.parse(jsonStr);
              if (data.rooms && data.price) {
                const comparisonData: any = {
                  property_id: propId,
                  room_count: parseInt(data.rooms),
                  average_price: parseInt(data.price)
                };
                results.push(comparisonData);
              }
            } catch (e) {
              // Invalid JSON, skip
            }
          }
        }
      }

      // Strategy 3: Look for specific price comparison elements
      const priceElements = document.querySelectorAll('[class*="price-comparison"], [class*="market-price"]');

      for (const element of priceElements) {
        // Extract room count from label or data attribute
        const roomAttr = element.getAttribute('data-rooms');
        const labelText = element.querySelector('[class*="label"], [class*="room"]')?.textContent || '';

        const roomMatch = (roomAttr || labelText).match(/(\d+)/);
        if (!roomMatch) continue;

        const roomCount = parseInt(roomMatch[1]);

        // Extract price from value or data attribute
        const priceAttr = element.getAttribute('data-price');
        const priceText = element.querySelector('[class*="value"], [class*="amount"]')?.textContent || '';

        const priceMatch = (priceAttr || priceText).match(/([\d,]+)/);
        if (!priceMatch) continue;

        const price = parseInt(priceMatch[1].replace(/,/g, ''));

        if (price >= 100000 && price <= 100000000) {
          results.push({
            property_id: propId,
            room_count: roomCount,
            average_price: price
          });
        }
      }

      // Remove duplicates (same room count)
      const unique = results.filter((item, index, self) =>
        index === self.findIndex(t => t.room_count === item.room_count)
      );

      return unique;
    }, propertyId);

    return comparisons as PriceComparisonInput[];
  } catch (error) {
    console.error('Error extracting price comparisons:', error);
    return [];
  }
}
