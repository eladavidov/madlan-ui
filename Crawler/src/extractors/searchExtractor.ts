/**
 * Search Results Extractor
 * Extracts property links from search results pages
 */

import type { Page } from "playwright";
import { SEARCH_RESULTS_SELECTORS } from "../config/selectors.js";

/**
 * Extract property URLs from search results page
 */
export async function extractPropertyUrls(page: Page): Promise<string[]> {
  try {
    // NEW APPROACH: Find all links that contain property data (price ₪, rooms חד', size מ"ר)
    const result = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const bodyText = document.body.textContent || '';

      // Debug info
      const debugInfo = {
        totalLinks: links.length,
        bodyLength: bodyText.length,
        hasShekels: bodyText.includes('₪'),
        hasRooms: bodyText.includes('חד'),
        hasSize: bodyText.includes('מ"ר'),
      };

      // Filter links that look like property cards (have price, rooms, size in text)
      const propertyLinks = links.filter(link => {
        const text = link.textContent || '';
        const href = link.getAttribute('href') || '';

        // Property cards have: price (₪), rooms (חד'), size (מ"ר)
        // Note: The apostrophe might be encoded differently
        const hasPropertyData = text.includes('₪') && text.includes('חד') && text.includes('מ"ר');

        // Exclude navigation/filter links
        const isNavigationLink =
          href.includes('/2-bd') ||
          href.includes('/3-bd') ||
          href.includes('/4-bd') ||
          href.includes('/5-bd') ||
          href.includes('/secure-room') ||
          href.endsWith('/for-sale/חיפה-ישראל') ||
          href.includes('/commercial/');

        return hasPropertyData && !isNavigationLink;
      });

      return {
        urls: propertyLinks.map(link => link.href),
        debug: {
          ...debugInfo,
          propertyLinksFound: propertyLinks.length,
          sampleHref: propertyLinks[0]?.href || 'none',
          sampleText: propertyLinks[0]?.textContent?.substring(0, 100) || 'none',
        }
      };
    });

    const urls = result.urls;

    console.log(`Debug info:`, JSON.stringify(result.debug, null, 2));
    console.log(`Found ${urls.length} property card links with property data`);

    // Make URLs absolute if they're relative
    const baseUrl = page.url();
    const absoluteUrls = urls.map((url) => {
      if (url.startsWith("http")) return url;
      return new URL(url, baseUrl).href;
    });

    // Deduplicate URLs
    const uniqueUrls = [...new Set(absoluteUrls)];

    console.log(`After deduplication: ${uniqueUrls.length} unique property URLs`);

    return uniqueUrls;
  } catch (error) {
    console.error("Error extracting property URLs:", error);
    return [];
  }
}

/**
 * Check if there's a next page (pagination)
 * Note: Madlan uses URL-based pagination, not buttons
 */
export async function hasNextPage(_page: Page, currentPageNum: number, maxPages: number): Promise<boolean> {
  // Simple check: if we haven't reached maxPages, there are more pages
  // Madlan has 3600+ properties in Haifa, so we can safely assume pages exist
  return currentPageNum < maxPages;
}

/**
 * Navigate to next page using URL manipulation
 * Madlan uses ?page=N query parameter for pagination
 */
export async function goToNextPage(page: Page, nextPageNum: number): Promise<boolean> {
  try {
    const currentUrl = page.url();
    const url = new URL(currentUrl);

    // Add or update page parameter
    url.searchParams.set('page', nextPageNum.toString());

    const nextUrl = url.toString();
    console.log(`Navigating to page ${nextPageNum}: ${nextUrl}`);

    await page.goto(nextUrl, { waitUntil: 'domcontentloaded' });
    return true;
  } catch (error) {
    console.error("Error navigating to next page:", error);
    return false;
  }
}

/**
 * Get total results count (if available)
 */
export async function getResultsCount(page: Page): Promise<number | null> {
  try {
    const countText = await page.textContent(SEARCH_RESULTS_SELECTORS.resultsCount);
    if (!countText) return null;

    // Extract number from text like "נמצאו 142 תוצאות"
    const match = countText.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  } catch (error) {
    return null;
  }
}
