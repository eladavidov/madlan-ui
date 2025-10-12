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
    // Wait for property cards to load
    await page.waitForSelector(SEARCH_RESULTS_SELECTORS.propertyCards, {
      timeout: 10000,
    }).catch(() => {
      console.log("Property cards selector not found, trying alternative...");
    });

    // Extract all property links
    const urls = await page.$$eval(
      SEARCH_RESULTS_SELECTORS.card.link,
      (links) => links.map((link) => (link as HTMLAnchorElement).href).filter(Boolean)
    );

    // Filter to only Madlan property URLs
    const propertyUrls = urls.filter((url) => {
      return url.includes("/listings/") || url.includes("/bulletin/");
    });

    // Make URLs absolute if they're relative
    const baseUrl = page.url();
    const absoluteUrls = propertyUrls.map((url) => {
      if (url.startsWith("http")) return url;
      return new URL(url, baseUrl).href;
    });

    // Deduplicate URLs
    const uniqueUrls = [...new Set(absoluteUrls)];

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
