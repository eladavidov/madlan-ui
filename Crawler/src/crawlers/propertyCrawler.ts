/**
 * Property Crawler
 * Crawls individual property pages and extracts data
 */

import { PlaywrightCrawler } from "crawlee";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { PropertyRepository } from "../database/repositories/PropertyRepository.js";
import { ImageRepository } from "../database/repositories/ImageRepository.js";
import { CrawlSessionRepository } from "../database/repositories/CrawlSessionRepository.js";
import { extractPropertyData, extractImageUrls } from "../extractors/propertyExtractor.js";
import { ImageStore } from "../storage/imageStore.js";
import { createCaptchaSolver } from "../utils/captchaSolver.js";
import { simulateHumanBehavior } from "../utils/humanBehavior.js";
import { randomDelay } from "../utils/sleep.js";
import { logger } from "../utils/logger.js";
import { config } from "../utils/config.js";
import type { DuckDBConnection } from "../database/connectionDuckDB.js";
import {
  screenshotIfJavaScriptDisabled,
  screenshotIfCaptcha,
  screenshotWithHtml,
  screenshotOnError,
} from "../utils/screenshotDebug.js";

// Enable stealth plugin for enhanced anti-detection
chromium.use(StealthPlugin());

export interface CrawlerStats {
  propertiesFound: number;
  propertiesNew: number;
  propertiesUpdated: number;
  propertiesFailed: number;
  imagesFound: number;
  imagesDownloaded: number;
  imagesFailed: number;
}

export interface PropertyCrawlerOptions {
  downloadImages?: boolean;
  imageTimeout?: number;
  imageRetries?: number;
}

/**
 * Create property crawler
 */
export function createPropertyCrawler(
  db: DuckDBConnection,
  sessionId: string,
  options: PropertyCrawlerOptions = {}
): PlaywrightCrawler {
  const { downloadImages = true, imageTimeout = 30000, imageRetries = 3 } = options;

  const propertyRepo = new PropertyRepository(db);
  const imageRepo = new ImageRepository(db);
  const sessionRepo = new CrawlSessionRepository(db);
  const imageStore = new ImageStore(db);
  const captchaSolver = createCaptchaSolver();

  const stats: CrawlerStats = {
    propertiesFound: 0,
    propertiesNew: 0,
    propertiesUpdated: 0,
    propertiesFailed: 0,
    imagesFound: 0,
    imagesDownloaded: 0,
    imagesFailed: 0,
  };

  const crawler = new PlaywrightCrawler({
    // Browser options with stealth (minimal args for maximum compatibility)
    launchContext: {
      launcher: chromium, // Use stealth-enhanced chromium
      launchOptions: {
        headless: config.browser.headless,
        // Minimal args - stealth plugin handles most detection
        // Removed aggressive args that were blocking JavaScript execution
        args: [
          "--no-sandbox", // Required for some environments
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage", // Prevent memory issues
          "--disable-gpu", // Reduce resource usage
        ],
        // CRITICAL: Explicitly enable JavaScript
        javaScriptEnabled: true,
      },
      userAgent: config.browser.userAgent,
    },

    // Browser fingerprinting (explicit configuration)
    browserPoolOptions: {
      useFingerprints: true, // Enable fingerprinting with default options
    },

    // Retry configuration
    maxRequestRetries: config.crawler.maxRequestRetries,
    requestHandlerTimeoutSecs: 90, // Temporarily reduced for faster testing (was 180)

    // Concurrency settings (anti-blocking) - Very conservative
    minConcurrency: config.crawler.concurrencyMin,
    maxConcurrency: config.crawler.concurrencyMax,
    maxRequestsPerMinute: config.crawler.maxRequestsPerMinute,

    // Session management
    persistCookiesPerSession: true,
    useSessionPool: true,
    sessionPoolOptions: {
      maxPoolSize: 10,
      sessionOptions: {
        maxUsageCount: 10,
      },
    },

    // Request handler
    async requestHandler({ page, request, log }) {
      const url = request.url;
      log.info(`Processing property: ${url}`);
      stats.propertiesFound++;

      try {
        // QUALITY-FIRST APPROACH: Robust waiting for React/SPA content

        // Step 1: Wait for initial DOM
        await page.waitForLoadState("domcontentloaded");

        // Step 2: Wait for network to be mostly idle (reduced timeout for testing)
        try {
          await page.waitForLoadState("networkidle", { timeout: 5000 });
          logger.debug("✅ Network idle");
        } catch (e) {
          logger.debug("⚠️  Network idle timeout, continuing...");
        }

        // Step 3: Wait for React to mount and render (reduced timeout for testing)
        try {
          await page.waitForFunction(
            () => {
              // Better detection: Check for actual property page content
              const hasImages = document.querySelector('img') !== null;
              const hasPrice = document.body.textContent?.includes('₪') || false;
              const bodyLength = document.body.textContent?.length || 0;
              // Page is rendered if we have substantial content OR price/images
              return bodyLength > 5000 || (hasImages && hasPrice);
            },
            { timeout: 10000 }
          );
          logger.debug("✅ React content detected, page fully rendered");
        } catch (e) {
          logger.warn("⚠️  Content not fully rendered, proceeding anyway");
        }

        // Step 4: Additional wait for any lazy-loaded content (reduced for testing)
        logger.debug("⏱️  Waiting 1s for lazy content...");
        await page.waitForTimeout(1000);

        // Simulate human behavior AFTER content loads
        logger.debug("🎭 Starting human behavior simulation...");
        await simulateHumanBehavior(page);
        logger.debug("✅ Human behavior simulation complete");

        // Check for CAPTCHA and other blocking signals
        logger.debug("🔍 Checking for CAPTCHA and blocking signals...");
        const captchaDetected = await page
          .locator('text="Press & Hold"')
          .count()
          .then((count) => count > 0);

        // Quality-first debugging: Check for JavaScript issues
        await screenshotIfJavaScriptDisabled(page);

        // Also check for other blocking indicators
        const pageContent = await page.content();
        const isBlocked =
          captchaDetected ||
          pageContent.includes("access denied") ||
          pageContent.includes("rate limit") ||
          pageContent.includes("too many requests") ||
          pageContent.includes("סליחה על ההפרעה"); // Hebrew: "Sorry for the interruption"

        logger.debug(`🔎 Blocking check: CAPTCHA=${captchaDetected}, isBlocked=${isBlocked}`);

        if (isBlocked) {
          // Quality-first: Take screenshot with HTML for debugging
          await screenshotWithHtml(page, "property-blocked");

          if (captchaDetected) {
            logger.warn(`🛑 CAPTCHA detected on ${url}`);
            await screenshotIfCaptcha(page, true);
          } else {
            logger.warn(`🛑 Blocking detected on ${url} (rate limit or access denied)`);
          }

          // Adaptive throttling: wait longer before retrying
          const backoffDelay = 10000 + Math.random() * 10000; // 10-20 seconds
          logger.warn(`⏸️  Backing off for ${Math.round(backoffDelay / 1000)}s due to blocking...`);
          await page.waitForTimeout(backoffDelay);

          // Try to solve CAPTCHA if solver is configured
          if (captchaDetected && captchaSolver) {
            logger.info("🤖 Attempting to solve CAPTCHA automatically...");
            const solved = await captchaSolver.solveCaptcha(page);

            if (solved) {
              logger.info("✅ CAPTCHA solved successfully, continuing...");
              // Continue with extraction (don't return)
            } else {
              logger.error("❌ CAPTCHA solving failed");
              await sessionRepo.logError(
                sessionId,
                "captcha",
                "CAPTCHA detected but solving failed",
                undefined,
                url
              );
              stats.propertiesFailed++;

              // Additional backoff after failed solve
              await page.waitForTimeout(30000); // Wait 30 seconds
              return;
            }
          } else if (captchaDetected && !captchaSolver) {
            logger.warn("⚠️  CAPTCHA detected but no solver configured (set CAPTCHA_API_KEY)");
            await sessionRepo.logError(
              sessionId,
              "captcha",
              "CAPTCHA challenge detected - no solver configured",
              undefined,
              url
            );
            stats.propertiesFailed++;

            // Wait before continuing to next request
            await page.waitForTimeout(30000);
            return;
          } else {
            // Non-CAPTCHA blocking (rate limit, etc.)
            logger.warn("⚠️  Blocking detected but no CAPTCHA - likely rate limited");
            await sessionRepo.logError(
              sessionId,
              "rate_limit",
              "Rate limiting or access restriction detected",
              undefined,
              url
            );
            stats.propertiesFailed++;

            // Wait before continuing
            await page.waitForTimeout(20000);
            return;
          }
        }

        // Extract property data
        logger.debug("📊 Starting property data extraction...");
        const propertyData = await extractPropertyData(page, url);
        logger.debug(`📊 Extraction result: ${propertyData ? 'SUCCESS' : 'FAILED'}`);

        if (!propertyData) {
          logger.error(`❌ Failed to extract data from ${url}`);
          await sessionRepo.logError(
            sessionId,
            "extraction",
            "Failed to extract property data",
            undefined,
            url
          );
          stats.propertiesFailed++;
          return;
        }

        logger.info(`✅ Extracted property: ${propertyData.id} - ${propertyData.address || 'Unknown'}, ₪${propertyData.price || 'N/A'}`);

        // Check if property exists
        const existing = await propertyRepo.findById(propertyData.id);

        // Upsert property
        await propertyRepo.upsert(propertyData);

        if (existing) {
          stats.propertiesUpdated++;
          logger.info(`Updated property: ${propertyData.id}`);
        } else {
          stats.propertiesNew++;
          logger.info(`Added new property: ${propertyData.id}`);
        }

        // Extract images
        const imageUrls = await extractImageUrls(page);
        stats.imagesFound += imageUrls.length;

        if (imageUrls.length > 0) {
          logger.info(`Found ${imageUrls.length} images for property ${propertyData.id}`);

          // Delete old image records
          await imageRepo.deleteByPropertyId(propertyData.id);

          // Download images if enabled
          if (downloadImages) {
            try {
              const downloadStats = await imageStore.downloadPropertyImages(
                propertyData.id,
                imageUrls,
                { maxRetries: imageRetries, timeout: imageTimeout }
              );

              stats.imagesDownloaded += downloadStats.successful;
              stats.imagesFailed += downloadStats.failed;

              logger.info(
                `Images for ${propertyData.id}: ` +
                  `${downloadStats.successful} downloaded, ` +
                  `${downloadStats.failed} failed, ` +
                  `${downloadStats.skipped} skipped`
              );
            } catch (error: any) {
              logger.error(`Error downloading images for ${propertyData.id}:`, error);
              stats.imagesFailed += imageUrls.length;
            }
          } else {
            // Just save image URLs without downloading
            const images = imageUrls.map((url, index) => ({
              property_id: propertyData.id,
              image_url: url,
              image_order: index,
              is_main_image: index === 0,
            }));

            await imageRepo.insertMany(images);
            logger.info(`Saved ${imageUrls.length} image URLs (download disabled)`);
          }
        }

        // Update session stats
        await sessionRepo.updateStats(sessionId, {
          properties_found: stats.propertiesFound,
          properties_new: stats.propertiesNew,
          properties_updated: stats.propertiesUpdated,
          properties_failed: stats.propertiesFailed,
          images_downloaded: stats.imagesDownloaded,
          images_failed: stats.imagesFailed,
        });

        // Random delay before next request
        await randomDelay({
          min: config.crawler.requestDelayMin,
          max: config.crawler.requestDelayMax,
        });
      } catch (error: any) {
        // Quality-first: Take screenshot on error
        try {
          await screenshotOnError(page, error, "property-extraction");
        } catch (screenshotError) {
          // Ignore screenshot errors
        }

        logger.error(`Error processing ${url}:`, error);
        await sessionRepo.logError(
          sessionId,
          "extraction",
          error.message,
          error.stack,
          url
        );
        stats.propertiesFailed++;
      }
    },

    // Failed request handler
    async failedRequestHandler({ request, log }, error) {
      log.error(`Request ${request.url} failed`, error);
      await sessionRepo.logError(
        sessionId,
        "network",
        error.message,
        error.stack,
        request.url
      );
      stats.propertiesFailed++;
    },
  });

  return crawler;
}

/**
 * Run crawler on a list of URLs
 */
export async function crawlProperties(
  db: DuckDBConnection,
  propertyUrls: string[],
  sessionId?: string,
  options?: PropertyCrawlerOptions
): Promise<CrawlerStats> {
  const actualSessionId = sessionId || `crawl-${Date.now()}`;
  const sessionRepo = new CrawlSessionRepository(db);

  // Start session only if we created it (not passed in)
  if (!sessionId) {
    await sessionRepo.startSession(actualSessionId, config.target.city);
    logger.info(`Started crawl session: ${actualSessionId}`);
  } else {
    logger.info(`Using existing session: ${actualSessionId}`);
  }
  logger.info(`Crawling ${propertyUrls.length} properties`);

  try {
    // Create crawler
    const crawler = createPropertyCrawler(db, actualSessionId, options);

    // Add URLs to queue
    await crawler.addRequests(propertyUrls);

    // Run crawler
    await crawler.run();

    // Complete session only if we created it (not passed in)
    if (!sessionId) {
      await sessionRepo.completeSession(actualSessionId, true);
      logger.info(`Completed crawl session: ${actualSessionId}`);
    }

    // Get final stats
    const finalStats = await sessionRepo.getSessionStats(actualSessionId);
    return {
      propertiesFound: finalStats?.properties_found || 0,
      propertiesNew: finalStats?.properties_new || 0,
      propertiesUpdated: finalStats?.properties_updated || 0,
      propertiesFailed: finalStats?.properties_failed || 0,
      imagesFound: 0, // Not tracked separately
      imagesDownloaded: finalStats?.images_downloaded || 0,
      imagesFailed: finalStats?.images_failed || 0,
    };
  } catch (error: any) {
    logger.error("Crawler error:", error);
    // Complete session with error only if we created it (not passed in)
    if (!sessionId) {
      await sessionRepo.completeSession(actualSessionId, false, error.message);
    }
    throw error;
  }
}
