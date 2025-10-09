/**
 * Search Results Crawler
 * Crawls search results pages and extracts property URLs
 */

import { PlaywrightCrawler } from "crawlee";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {
  extractPropertyUrls,
  hasNextPage,
  goToNextPage,
} from "../extractors/searchExtractor.js";
import { simulateHumanBehavior } from "../utils/humanBehavior.js";
import { randomDelay } from "../utils/sleep.js";
import { logger } from "../utils/logger.js";
import { config } from "../utils/config.js";
import {
  screenshotIfJavaScriptDisabled,
  screenshotWithHtml,
} from "../utils/screenshotDebug.js";
import {
  extractPropertiesFromApiResponses,
  type CapturedApiData,
} from "../utils/networkCapture.js";

// Enable stealth plugin
chromium.use(StealthPlugin());

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
    // Browser options with stealth (minimal args for maximum compatibility)
    launchContext: {
      launcher: chromium, // Use stealth-enhanced chromium
      launchOptions: {
        headless: config.browser.headless,
        // Minimal args - stealth plugin handles most detection
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
        // EXPLICITLY enable JavaScript
        javaScriptEnabled: true,
      },
      userAgent: config.browser.userAgent,
    },

    // Browser fingerprinting
    browserPoolOptions: {
      useFingerprints: true, // Enable fingerprinting with default options
    },

    // Retry configuration
    maxRequestRetries: config.crawler.maxRequestRetries,
    requestHandlerTimeoutSecs: 180, // Increased for human behavior

    // Concurrency settings
    minConcurrency: 1, // Sequential for search pages
    maxConcurrency: 1,

    // Session management
    persistCookiesPerSession: true,

    // Request handler
    async requestHandler({ page, request, log }) {
      const url = request.url;
      log.info(`Processing search page: ${url}`);

      // SOLUTION: Capture API responses instead of parsing HTML
      const capturedData: CapturedApiData = { properties: [], rawResponses: [] };
      const failedResources: string[] = [];

      // Monitor console errors
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          logger.warn(`🔴 Browser console error: ${msg.text()}`);
        }
      });

      // Monitor failed resources to debug JavaScript issues
      page.on('requestfailed', (request) => {
        const url = request.url();
        if (url.includes('.js') || url.includes('main') || url.includes('chunk')) {
          failedResources.push(url);
          logger.warn(`❌ Failed to load JS: ${url} - ${request.failure()?.errorText}`);
        }
      });

      // Set up network interception BEFORE navigation
      page.on('response', async (response) => {
        const responseUrl = response.url();

        // Log JavaScript file responses
        if (responseUrl.includes('.js')) {
          logger.debug(`JS file loaded: ${responseUrl} (${response.status()})`);
        }

        if (responseUrl.includes('/api2') || responseUrl.includes('/api3')) {
          try {
            const json = await response.json();
            capturedData.rawResponses.push({
              url: responseUrl,
              status: response.status(),
              data: json
            });
            logger.info(`📡 Captured API response: ${responseUrl} (${response.status()})`);
          } catch (e) {
            // Not JSON
          }
        }
      });

      try {
        // QUALITY-FIRST APPROACH: Robust waiting for React/SPA content

        // Step 1: Wait for initial DOM
        await page.waitForLoadState("domcontentloaded");

        // Step 2: Close the "מה חסר לך במדלן?" popup if it appears
        try {
          // Wait for the "אחר-כך" (later) button and click it
          const laterButton = page.locator('text=אחר-כך');
          await laterButton.waitFor({ timeout: 5000 });
          await laterButton.click();
          logger.info("✅ Closed 'What's missing' popup");
          await page.waitForTimeout(1000);
        } catch (e) {
          logger.debug("No popup to close or already closed");
        }

        // Step 3: Wait for network to be mostly idle
        try {
          await page.waitForLoadState("networkidle", { timeout: 15000 });
        } catch (e) {
          log.debug("Network idle timeout, continuing...");
        }

        // Step 3: Wait for React to mount and render (quality-first approach)
        // Check if JavaScript is actually running by looking for actual content
        try {
          await page.waitForFunction(
            () => {
              // Better detection: Check for actual React root content
              const hasPropertyCards = document.querySelector('[class*="property"]') !== null ||
                                      document.querySelector('[class*="listing"]') !== null ||
                                      document.querySelector('img') !== null;
              const bodyLength = document.body.textContent?.length || 0;
              // Page is rendered if we have substantial content AND React elements
              return bodyLength > 5000 || hasPropertyCards;
            },
            { timeout: 20000 }
          );
          logger.debug("✅ React content detected, page fully rendered");
        } catch (e) {
          logger.warn("⚠️  Content not fully rendered, proceeding anyway");
        }

        // Step 4: Additional wait for any lazy-loaded content
        await page.waitForTimeout(2000);

        // Simulate human behavior AFTER content loads
        await simulateHumanBehavior(page);

        // Check for CAPTCHA and other blocking signals
        const captchaDetected = await page
          .locator('text="Press & Hold"')
          .count()
          .then((count) => count > 0);

        // Also check for other blocking indicators
        const pageContent = await page.content();

        // Quality-first debugging: Check page state and take screenshots if needed
        const pageTitle = await page.title();
        const bodyText = await page.locator("body").textContent();
        const firstWords = bodyText?.substring(0, 200) || "";

        logger.debug(`Page title: "${pageTitle}"`);
        logger.debug(`Page has blocking text: ${pageContent.includes("סליחה על ההפרעה")}`);
        logger.debug(`CAPTCHA button found: ${captchaDetected}`);
        logger.debug(`First 200 chars of page: "${firstWords.substring(0, 200)}"`);

        // Take screenshot if JavaScript not running (for debugging)
        await screenshotIfJavaScriptDisabled(page);

        const isBlocked =
          captchaDetected ||
          pageContent.includes("access denied") ||
          pageContent.includes("rate limit") ||
          pageContent.includes("too many requests") ||
          pageContent.includes("סליחה על ההפרעה"); // Hebrew: "Sorry for the interruption"

        if (isBlocked) {
          // Quality-first: Take screenshot with HTML for debugging
          await screenshotWithHtml(page, "search-page-blocked");

          if (captchaDetected) {
            logger.warn(`🛑 CAPTCHA detected on search page: ${url}`);
          } else {
            logger.warn(`🛑 Blocking detected on search page: ${url} (rate limit or access denied)`);
          }
          logger.warn(`⚠️  Cannot continue search - blocking on search pages requires manual intervention`);
          logger.warn(`💡 Try reducing CONCURRENCY and MAX_REQUESTS_PER_MINUTE in .env`);
          return;
        }

        // Log captured API data for debugging
        logger.info(`📊 Captured ${capturedData.rawResponses.length} API responses`);

        // Try to extract from captured API data first
        let propertyUrls: string[] = [];

        if (capturedData.rawResponses.length > 0) {
          logger.info("✅ Using API data (bypassing HTML extraction)");

          // Log first response for debugging
          logger.debug(`Sample API response: ${JSON.stringify(capturedData.rawResponses[0]?.data).substring(0, 500)}`);

          // Extract property URLs from API responses
          // TODO: Parse actual API structure once we see the data
          const apiProperties = extractPropertiesFromApiResponses(capturedData);
          logger.info(`Found ${apiProperties.length} properties in API responses`);

          // Convert to URLs (structure TBD)
          propertyUrls = apiProperties.map((p: any) => {
            // Try common property ID fields
            const id = p.id || p.property_id || p.listing_id || p._id;
            if (id) {
              return `https://www.madlan.co.il/listings/${id}`;
            }
            return null;
          }).filter(Boolean) as string[];
        }

        // Fallback to HTML extraction if API didn't work
        if (propertyUrls.length === 0) {
          logger.warn("⚠️ No properties from API, trying HTML extraction");
          propertyUrls = await extractPropertyUrls(page);
        }

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
