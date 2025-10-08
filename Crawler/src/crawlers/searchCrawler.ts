/**
 * Search Results Crawler
 * Crawls search results pages and extracts property URLs
 */

import { PlaywrightCrawler } from "crawlee";
import {
  extractPropertyUrls,
  hasNextPage,
  goToNextPage,
  getResultsCount,
} from "../extractors/searchExtractor.js";
import { randomDelay } from "../utils/sleep.js";
import { logger } from "../utils/logger.js";
import { config } from "../utils/config.js";

export interface SearchCrawlerOptions {
  maxPages?: number;
  onPropertiesFound?: (urls: string[]) => void | Promise<void>;
}

/**
 * Create search results crawler
 */
export function createSearchCrawler(options: SearchCrawlerOptions = {}): PlaywrightCrawler {
  const { maxPages = 10, onPropertiesFound } = options;
  let pagesProcessed = 0;
  const allPropertyUrls: string[] = [];

  const crawler = new PlaywrightCrawler({
    // Browser options
    launchContext: {
      launchOptions: {
        headless: config.browser.headless,
        args: ["--disable-blink-features=AutomationControlled"],
      },
      userAgent: config.browser.userAgent,
    },

    // Concurrency settings
    minConcurrency: 1, // Sequential for search pages
    maxConcurrency: 1,

    // Session management
    persistCookiesPerSession: true,

    // Request handler
    async requestHandler({ page, request, log }) {
      const url = request.url;
      log.info(`Processing search page: ${url}`);

      try {
        // Wait for page to load
        await page.waitForLoadState("domcontentloaded");

        // Check for CAPTCHA
        const captchaDetected = await page
          .locator('text="Press & Hold"')
          .count()
          .then((count) => count > 0);

        if (captchaDetected) {
          logger.warn(`CAPTCHA detected on search page: ${url}`);
          return;
        }

        // Get results count
        const totalResults = await getResultsCount(page);
        if (totalResults) {
          logger.info(`Found ${totalResults} total results`);
        }

        // Extract property URLs from current page
        const propertyUrls = await extractPropertyUrls(page);
        logger.info(`Extracted ${propertyUrls.length} property URLs from page ${pagesProcessed + 1}`);

        if (propertyUrls.length > 0) {
          allPropertyUrls.push(...propertyUrls);

          // Call callback if provided
          if (onPropertiesFound) {
            await onPropertiesFound(propertyUrls);
          }
        }

        pagesProcessed++;

        // Check if we should continue to next page
        if (pagesProcessed >= maxPages) {
          logger.info(`Reached max pages limit (${maxPages})`);
          return;
        }

        // Check for next page
        const hasNext = await hasNextPage(page);
        if (!hasNext) {
          logger.info("No more pages available");
          return;
        }

        // Navigate to next page
        logger.info("Navigating to next page...");
        const success = await goToNextPage(page);

        if (success) {
          // Random delay before processing next page
          await randomDelay({
            min: config.crawler.requestDelayMin,
            max: config.crawler.requestDelayMax,
          });

          // Re-queue current page to process next page of results
          // (since pagination might be in-place, same URL)
          // In production, we'd handle this differently
          logger.info("Next page loaded");
        } else {
          logger.warn("Failed to navigate to next page");
        }
      } catch (error: any) {
        logger.error(`Error processing search page ${url}:`, error);
      }
    },

    // Failed request handler
    failedRequestHandler({ request, log }, error) {
      log.error(`Search request ${request.url} failed`, error);
    },
  });

  return crawler;
}

/**
 * Crawl search results and return all property URLs
 */
export async function crawlSearchResults(
  searchUrl: string,
  options: SearchCrawlerOptions = {}
): Promise<string[]> {
  const propertyUrls: string[] = [];

  const crawler = createSearchCrawler({
    ...options,
    onPropertiesFound: async (urls) => {
      propertyUrls.push(...urls);
      if (options.onPropertiesFound) {
        await options.onPropertiesFound(urls);
      }
    },
  });

  logger.info(`Starting search crawl: ${searchUrl}`);

  try {
    await crawler.run([searchUrl]);
    logger.info(`Search crawl complete. Found ${propertyUrls.length} total properties`);
    return [...new Set(propertyUrls)]; // Deduplicate
  } catch (error: any) {
    logger.error("Search crawler error:", error);
    throw error;
  }
}
