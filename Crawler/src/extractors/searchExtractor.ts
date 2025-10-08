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
 */
export async function hasNextPage(page: Page): Promise<boolean> {
  try {
    // Try to find "next" button
    const nextButton = await page.$(SEARCH_RESULTS_SELECTORS.pagination.nextButton);
    if (nextButton) {
      const isDisabled = await nextButton.evaluate((el) => {
        return el.hasAttribute("disabled") || el.classList.contains("disabled");
      });
      return !isDisabled;
    }

    // Try to find "load more" button
    const loadMoreButton = await page.$(SEARCH_RESULTS_SELECTORS.pagination.loadMore);
    if (loadMoreButton) {
      return await loadMoreButton.isVisible();
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Navigate to next page
 */
export async function goToNextPage(page: Page): Promise<boolean> {
  try {
    // Try clicking "next" button
    const nextButton = await page.$(SEARCH_RESULTS_SELECTORS.pagination.nextButton);
    if (nextButton) {
      await nextButton.click();
      await page.waitForLoadState("domcontentloaded");
      return true;
    }

    // Try clicking "load more" button
    const loadMoreButton = await page.$(SEARCH_RESULTS_SELECTORS.pagination.loadMore);
    if (loadMoreButton) {
      await loadMoreButton.click();
      await page.waitForTimeout(2000); // Wait for new items to load
      return true;
    }

    return false;
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
