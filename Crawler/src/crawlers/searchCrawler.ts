/**
 * Search Results Crawler
 * Crawls search results pages and extracts property URLs
 * ANTI-BLOCKING: Fresh browser per page (like property crawling)
 */

import { PlaywrightCrawler } from "crawlee";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { extractPropertyUrls } from "../extractors/searchExtractor.js";
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
  startPage?: number;
  onPropertiesFound?: (urls: string[]) => void | Promise<void>;
}

/**
 * Create search results crawler for a SINGLE page
 * (Fresh browser approach - one page per crawler instance)
 */
function createSinglePageCrawler(
  pageNumber: number,
  onPropertiesFound?: (urls: string[]) => void | Promise<void>
): PlaywrightCrawler {
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
    persistCookiesPerSession: false, // CRITICAL: Fresh session per page

    // Request handler
    async requestHandler({ page, request, log }) {
      const url = request.url;
      log.info(`Processing search page ${pageNumber}: ${url}`);

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

        // Step 4: Wait for React to mount and render (quality-first approach)
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

        // Step 5: Additional wait for any lazy-loaded content
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
            logger.error(`🛑 CAPTCHA detected on search page ${pageNumber}: ${url}`);
          } else {
            logger.error(`🛑 Blocking detected on search page ${pageNumber}: ${url}`);
          }
          throw new Error(`Search page ${pageNumber} blocked by anti-bot protection`);
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

        logger.info(`✅ Page ${pageNumber}: Extracted ${propertyUrls.length} property URLs`);

        if (propertyUrls.length > 0 && onPropertiesFound) {
          await onPropertiesFound(propertyUrls);
        }

      } catch (error: any) {
        logger.error(`Error processing search page ${pageNumber} ${url}:`, error);
        throw error;
      }
    },

    // Failed request handler
    failedRequestHandler({ request, log }, error) {
      log.error(`Search request for page ${pageNumber} failed: ${request.url}`, error);
    },
  });

  return crawler;
}

/**
 * Crawl search results with FRESH BROWSER PER PAGE
 * Anti-blocking strategy: Each page gets a completely new browser
 */
export async function crawlSearchResults(
  baseSearchUrl: string,
  options: SearchCrawlerOptions = {}
): Promise<string[]> {
  const { maxPages = 10, startPage = 1, onPropertiesFound } = options;
  const allPropertyUrls: string[] = [];

  logger.info(`Starting search crawl with fresh browser per page`);
  logger.info(`Base URL: ${baseSearchUrl}`);
  logger.info(`Pages: ${startPage} to ${startPage + maxPages - 1}`);
  logger.info(`Delay between pages: ${config.crawler.searchPageDelayMin/1000}-${config.crawler.searchPageDelayMax/1000}s`);

  for (let i = 0; i < maxPages; i++) {
    const pageNumber = startPage + i;

    // Construct URL for this page
    const pageUrl = pageNumber === 1
      ? baseSearchUrl  // First page has no ?page= param
      : `${baseSearchUrl}${baseSearchUrl.includes('?') ? '&' : '?'}page=${pageNumber}`;

    logger.info('');
    logger.info('='.repeat(70));
    logger.info(`🌐 Search Page ${pageNumber}/${startPage + maxPages - 1}: Launching fresh browser...`);
    logger.info('='.repeat(70));

    try {
      const pageUrls: string[] = [];

      // Create fresh crawler for this page
      const crawler = createSinglePageCrawler(pageNumber, async (urls) => {
        pageUrls.push(...urls);
        allPropertyUrls.push(...urls);

        if (onPropertiesFound) {
          await onPropertiesFound(urls);
        }
      });

      // Crawl this page
      await crawler.run([pageUrl]);

      logger.info(`✅ Page ${pageNumber} complete: ${pageUrls.length} URLs extracted`);

      // If this was not the last page, wait before next page
      if (i < maxPages - 1) {
        const delayMs = Math.floor(
          Math.random() * (config.crawler.searchPageDelayMax - config.crawler.searchPageDelayMin) +
          config.crawler.searchPageDelayMin
        );
        logger.info(`⏳ Waiting ${(delayMs/1000).toFixed(0)}s before next page...`);
        await randomDelay({
          min: config.crawler.searchPageDelayMin,
          max: config.crawler.searchPageDelayMax,
        });
      }

    } catch (error: any) {
      logger.error(`❌ Failed to crawl search page ${pageNumber}:`, error.message);
      logger.warn(`⚠️  Stopping pagination at page ${pageNumber}`);
      break; // Stop pagination on first failure
    }
  }

  logger.info('');
  logger.info('='.repeat(70));
  logger.info(`✅ Search crawl complete`);
  logger.info(`📊 Total pages processed: ${allPropertyUrls.length > 0 ? Math.ceil(allPropertyUrls.length / 34) : 0}`);
  logger.info(`🔗 Total property URLs: ${allPropertyUrls.length}`);
  logger.info('='.repeat(70));

  return [...new Set(allPropertyUrls)]; // Deduplicate
}
