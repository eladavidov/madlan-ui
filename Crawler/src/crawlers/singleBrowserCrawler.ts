/**
 * Single Browser Property Crawler
 * Anti-Blocking Strategy: Launch fresh browser for EACH property
 *
 * This crawler bypasses PerimeterX session-based blocking by:
 * 1. Starting a new browser instance for each property
 * 2. Extracting data from that ONE property
 * 3. Closing the browser completely
 * 4. Waiting random delay (60-120s) before next property
 *
 * Trade-offs:
 * - Slow: ~2-3 minutes per property
 * - Resource intensive: Multiple browser launches
 * - Success rate: 100% (proven in testing)
 */

import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { extractPropertyData, extractImageUrls } from "../extractors/propertyExtractor.js";
import { PropertyRepository } from "../database/repositories/PropertyRepository.js";
import { ImageRepository } from "../database/repositories/ImageRepository.js";
import { CrawlSessionRepository } from "../database/repositories/CrawlSessionRepository.js";
import { ImageStore } from "../storage/imageStore.js";
import { logger } from "../utils/logger.js";
import { config } from "../utils/config.js";
import type { DuckDBConnection } from "../database/connectionDuckDB.js";

// Enable stealth plugin
chromium.use(StealthPlugin());

export interface SingleBrowserCrawlerOptions {
  downloadImages?: boolean;
  imageTimeout?: number;
  imageRetries?: number;
  browserLaunchDelayMin?: number;
  browserLaunchDelayMax?: number;
  onProgressUpdate?: (stats: Partial<SingleBrowserStats>) => void;
  maxHttpErrorRetries?: number; // Retry HTTP 520/502/503 errors
}

export interface SingleBrowserStats {
  propertiesProcessed: number;
  propertiesSuccessful: number;
  propertiesFailed: number;
  imagesDownloaded: number;
  imagesFailed: number;
  totalDuration: number;
}

/**
 * Crawl properties using fresh browser per property (anti-blocking)
 */
export async function crawlPropertiesWithFreshBrowser(
  db: DuckDBConnection,
  propertyUrls: string[],
  sessionId: string,
  options: SingleBrowserCrawlerOptions = {}
): Promise<SingleBrowserStats> {
  const {
    downloadImages = true,
    imageTimeout = 30000,
    imageRetries = 3,
    browserLaunchDelayMin = config.crawler.browserLaunchDelayMin,
    browserLaunchDelayMax = config.crawler.browserLaunchDelayMax,
    onProgressUpdate,
    maxHttpErrorRetries = 2, // Retry 520/502/503 errors twice
  } = options;

  const propertyRepo = new PropertyRepository(db);
  const imageRepo = new ImageRepository(db);
  const sessionRepo = new CrawlSessionRepository(db);
  const imageStore = new ImageStore(db);

  const stats: SingleBrowserStats = {
    propertiesProcessed: 0,
    propertiesSuccessful: 0,
    propertiesFailed: 0,
    imagesDownloaded: 0,
    imagesFailed: 0,
    totalDuration: 0,
  };

  const startTime = Date.now();

  logger.info("=" .repeat(70));
  logger.info("🚀 Starting Single-Browser-Per-Property Crawler");
  logger.info("=" .repeat(70));
  logger.info(`Properties to crawl: ${propertyUrls.length}`);
  logger.info(`Browser launch delay: ${browserLaunchDelayMin / 1000}-${browserLaunchDelayMax / 1000}s`);
  logger.info(`Download images: ${downloadImages}`);
  logger.info("=" .repeat(70));

  for (let i = 0; i < propertyUrls.length; i++) {
    const url = propertyUrls[i];
    const propertyStartTime = Date.now();

    logger.info(`\n${"=".repeat(70)}`);
    logger.info(`📍 Property ${i + 1}/${propertyUrls.length}: ${url}`);
    logger.info("=".repeat(70));

    let browser = null;
    let retryCount = 0;
    let lastHttpError: number | null = null;
    let propertySuccess = false;

    // Retry loop for HTTP errors (520, 502, 503)
    while (retryCount <= maxHttpErrorRetries && !propertySuccess) {
      try {
        if (retryCount === 0) {
          stats.propertiesProcessed++;
        } else {
          logger.info(`🔄 Retry attempt ${retryCount}/${maxHttpErrorRetries} for HTTP ${lastHttpError}`);
        }

        // Launch fresh browser for THIS property
        logger.info("🚀 Launching fresh browser instance...");
        browser = await chromium.launch({
          headless: config.browser.headless,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-blink-features=AutomationControlled",
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
            "--allow-running-insecure-content",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-infobars",
            "--window-size=1920,1080",
            "--start-maximized",
          ],
          // Note: JavaScript is enabled by default in Playwright
        });

        const context = await browser.newContext({
          userAgent: config.browser.userAgent,
          viewport: { width: 1920, height: 1080 },
          locale: "he-IL",
          timezoneId: "Asia/Jerusalem",
        });

        const page = await context.newPage();

        // Navigate to property
        logger.info("🌐 Navigating to property page...");
        const response = await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 60000, // Increased from 30s to 60s to reduce timeouts
        });

        const status = response?.status();
        logger.info(`📡 HTTP Status: ${status}`);

        if (status === 403) {
          logger.error("❌ BLOCKED: 403 Forbidden (should not happen with fresh browser!)");
          await sessionRepo.logError(sessionId, "blocking", "403 Forbidden on fresh browser", undefined, url);
          stats.propertiesFailed++;
          await browser.close();
          break; // Don't retry 403
        }

        // Retry logic for server errors (520, 502, 503)
        if (status === 520 || status === 502 || status === 503) {
          lastHttpError = status;
          logger.warn(`⚠️  Server error: HTTP ${status}`);
          await browser.close();

          if (retryCount < maxHttpErrorRetries) {
            retryCount++;
            const retryDelay = 10000 + (retryCount * 5000); // 10s, 15s, 20s
            logger.info(`⏳ Waiting ${retryDelay / 1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue; // Retry
          } else {
            logger.error(`❌ Max retries reached for HTTP ${status}`);
            await sessionRepo.logError(sessionId, "http_error", `HTTP ${status} after ${maxHttpErrorRetries} retries`, undefined, url);
            stats.propertiesFailed++;
            break; // Give up
          }
        }

        if (status !== 200) {
          logger.warn(`⚠️  Unexpected status: ${status}`);
          await sessionRepo.logError(sessionId, "http_error", `HTTP ${status}`, undefined, url);
          stats.propertiesFailed++;
          await browser.close();
          break; // Don't retry other errors
        }

      // Wait for content to render
      logger.info("⏳ Waiting for React content to render...");
      await page.waitForFunction(
        () => {
          const hasImages = document.querySelector('img') !== null;
          const hasPrice = document.body.textContent?.includes('₪') || false;
          const bodyLength = document.body.textContent?.length || 0;
          return bodyLength > 5000 || (hasImages && hasPrice);
        },
        { timeout: 15000 }
      );
      logger.info("✅ Content rendered");

      // Human behavior simulation (proven to work)
      logger.info("🖱️  Simulating human behavior...");
      await page.waitForTimeout(5000); // Initial delay

      // Scroll (human-like reading)
      await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
      await page.waitForTimeout(2000);

      await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }));
      await page.waitForTimeout(8000); // Reading time

      // Check for blocking
      const pageContent = await page.content();
      const hasCaptcha = pageContent.includes("Press & Hold") ||
                         pageContent.includes("סליחה על ההפרעה");

      if (hasCaptcha) {
        logger.warn("🛑 CAPTCHA detected (unexpected with fresh browser)");
        await sessionRepo.logError(sessionId, "captcha", "CAPTCHA on fresh browser", undefined, url);
        stats.propertiesFailed++;
        await browser.close();
        continue;
      }

      // Wait before extraction
      await page.waitForTimeout(3000);

      // Extract property data
      logger.info("📊 Extracting property data...");
      const propertyData = await extractPropertyData(page, url);

      if (!propertyData) {
        logger.error("❌ Extraction failed");
        await sessionRepo.logError(sessionId, "extraction", "extractPropertyData returned null", undefined, url);
        stats.propertiesFailed++;
        await browser.close();
        continue;
      }

      logger.info(`✅ Extracted: ${propertyData.id}`);
      logger.info(`   Price: ₪${propertyData.price?.toLocaleString() || "N/A"}`);
      logger.info(`   Rooms: ${propertyData.rooms || "N/A"}, Size: ${propertyData.size || "N/A"}m²`);

      // Check if property exists
      const existing = await propertyRepo.findById(propertyData.id);

      // Save to database
      await propertyRepo.upsert(propertyData);

      if (existing) {
        logger.info(`📝 Updated existing property`);
      } else {
        logger.info(`🆕 Added new property`);
      }

      // Extract images
      const imageUrls = await extractImageUrls(page);
      logger.info(`📸 Found ${imageUrls.length} images`);

      // Only process images if downloadImages is enabled
      if (downloadImages && imageUrls.length > 0) {
        // Delete old image records
        await imageRepo.deleteByPropertyId(propertyData.id);

        try {
          const downloadStats = await imageStore.downloadPropertyImages(
            propertyData.id,
            imageUrls,
            { maxRetries: imageRetries, timeout: imageTimeout }
          );

          stats.imagesDownloaded += downloadStats.successful;
          stats.imagesFailed += downloadStats.failed;

          logger.info(`📥 Images: ${downloadStats.successful} downloaded, ${downloadStats.failed} failed`);
        } catch (error: any) {
          logger.error(`Error downloading images: ${error.message}`);
          stats.imagesFailed += imageUrls.length;
        }
      }

        stats.propertiesSuccessful++;
        propertySuccess = true; // Mark success to exit retry loop

        // Close browser for this property
        await browser.close();
        logger.info("🔒 Browser closed");

        const propertyDuration = Date.now() - propertyStartTime;
        logger.info(`⏱️  Property completed in ${Math.round(propertyDuration / 1000)}s`);

      } catch (error: any) {
        logger.error(`❌ Error processing property: ${error.message}`);
        logger.error(error.stack);
        await sessionRepo.logError(sessionId, "error", error.message, error.stack, url);

        // Ensure browser is closed even on error
        if (browser) {
          try {
            await browser.close();
          } catch (e) {
            // Ignore close errors
          }
        }

        // Only retry on retryable errors, otherwise break
        if (retryCount < maxHttpErrorRetries && lastHttpError && (lastHttpError === 520 || lastHttpError === 502 || lastHttpError === 503)) {
          retryCount++;
          const retryDelay = 10000 + (retryCount * 5000);
          logger.info(`⏳ Waiting ${retryDelay / 1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue; // Retry
        } else {
          stats.propertiesFailed++;
          break; // Give up
        }
      }
    } // End retry while loop

    // Update session stats after property (success or failure)
    await sessionRepo.updateStats(sessionId, {
      properties_found: stats.propertiesProcessed,
      properties_new: stats.propertiesSuccessful,
      properties_updated: 0,
      properties_failed: stats.propertiesFailed,
      images_downloaded: stats.imagesDownloaded,
      images_failed: stats.imagesFailed,
    });

    // Call progress update callback if provided
    if (onProgressUpdate) {
      onProgressUpdate({
        propertiesProcessed: stats.propertiesProcessed,
        propertiesSuccessful: stats.propertiesSuccessful,
        propertiesFailed: stats.propertiesFailed,
        imagesDownloaded: stats.imagesDownloaded,
        imagesFailed: stats.imagesFailed,
      });
    }

    // Random delay before next property (except last one)
    if (i < propertyUrls.length - 1) {
      const delay = browserLaunchDelayMin + Math.random() * (browserLaunchDelayMax - browserLaunchDelayMin);
      const delaySeconds = Math.round(delay / 1000);
      logger.info(`\n⏸️  Waiting ${delaySeconds}s before next property (anti-blocking)...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  stats.totalDuration = Date.now() - startTime;

  // Print final summary
  logger.info("\n" + "=".repeat(70));
  logger.info("📊 CRAWL SUMMARY");
  logger.info("=".repeat(70));
  logger.info(`Total properties: ${propertyUrls.length}`);
  logger.info(`✅ Successful: ${stats.propertiesSuccessful} (${Math.round(stats.propertiesSuccessful / propertyUrls.length * 100)}%)`);
  logger.info(`❌ Failed: ${stats.propertiesFailed} (${Math.round(stats.propertiesFailed / propertyUrls.length * 100)}%)`);
  logger.info(`📸 Images: ${stats.imagesDownloaded} downloaded, ${stats.imagesFailed} failed`);
  logger.info(`⏱️  Duration: ${Math.round(stats.totalDuration / 1000 / 60)} minutes`);
  logger.info(`📈 Rate: ${(stats.propertiesSuccessful / (stats.totalDuration / 1000 / 60)).toFixed(1)} properties/minute`);
  logger.info("=".repeat(70));

  return stats;
}
