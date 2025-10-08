/**
 * Property Crawler
 * Crawls individual property pages and extracts data
 */

import { PlaywrightCrawler } from "crawlee";
import { PropertyRepository } from "../database/repositories/PropertyRepository.js";
import { ImageRepository } from "../database/repositories/ImageRepository.js";
import { CrawlSessionRepository } from "../database/repositories/CrawlSessionRepository.js";
import { extractPropertyData, extractImageUrls } from "../extractors/propertyExtractor.js";
import { randomDelay } from "../utils/sleep.js";
import { logger } from "../utils/logger.js";
import { config } from "../utils/config.js";
import type { DatabaseConnection } from "../database/connection.js";

export interface CrawlerStats {
  propertiesFound: number;
  propertiesNew: number;
  propertiesUpdated: number;
  propertiesFailed: number;
  imagesFound: number;
}

/**
 * Create property crawler
 */
export function createPropertyCrawler(
  db: DatabaseConnection,
  sessionId: string
): PlaywrightCrawler {
  const propertyRepo = new PropertyRepository(db);
  const imageRepo = new ImageRepository(db);
  const sessionRepo = new CrawlSessionRepository(db);

  const stats: CrawlerStats = {
    propertiesFound: 0,
    propertiesNew: 0,
    propertiesUpdated: 0,
    propertiesFailed: 0,
    imagesFound: 0,
  };

  const crawler = new PlaywrightCrawler({
    // Browser options
    launchContext: {
      launchOptions: {
        headless: config.browser.headless,
        args: ["--disable-blink-features=AutomationControlled"],
      },
      userAgent: config.browser.userAgent,
    },

    // Concurrency settings (anti-blocking)
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
        // Wait for page to load
        await page.waitForLoadState("domcontentloaded");

        // Check for CAPTCHA
        const captchaDetected = await page
          .locator('text="Press & Hold"')
          .count()
          .then((count) => count > 0);

        if (captchaDetected) {
          logger.warn(`CAPTCHA detected on ${url}`);
          sessionRepo.logError(
            sessionId,
            "captcha",
            "CAPTCHA challenge detected",
            undefined,
            url
          );
          stats.propertiesFailed++;
          return;
        }

        // Extract property data
        const propertyData = await extractPropertyData(page, url);

        if (!propertyData) {
          logger.error(`Failed to extract data from ${url}`);
          sessionRepo.logError(
            sessionId,
            "extraction",
            "Failed to extract property data",
            undefined,
            url
          );
          stats.propertiesFailed++;
          return;
        }

        // Check if property exists
        const existing = propertyRepo.findById(propertyData.id);

        // Upsert property
        propertyRepo.upsert(propertyData);

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
          // Save image metadata
          const images = imageUrls.map((url, index) => ({
            property_id: propertyData.id,
            image_url: url,
            image_order: index,
            is_main_image: index === 0,
          }));

          // Delete old images and insert new ones
          imageRepo.deleteByPropertyId(propertyData.id);
          imageRepo.insertMany(images);

          logger.info(`Saved ${imageUrls.length} images for property ${propertyData.id}`);
        }

        // Update session stats
        sessionRepo.updateStats(sessionId, {
          properties_found: stats.propertiesFound,
          properties_new: stats.propertiesNew,
          properties_updated: stats.propertiesUpdated,
          properties_failed: stats.propertiesFailed,
        });

        // Random delay before next request
        await randomDelay({
          min: config.crawler.requestDelayMin,
          max: config.crawler.requestDelayMax,
        });
      } catch (error: any) {
        logger.error(`Error processing ${url}:`, error);
        sessionRepo.logError(
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
    failedRequestHandler({ request, log }, error) {
      log.error(`Request ${request.url} failed`, error);
      sessionRepo.logError(
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
  db: DatabaseConnection,
  propertyUrls: string[],
  sessionId?: string
): Promise<CrawlerStats> {
  const actualSessionId = sessionId || `crawl-${Date.now()}`;
  const sessionRepo = new CrawlSessionRepository(db);

  // Start session
  sessionRepo.startSession(actualSessionId, config.target.city);
  logger.info(`Started crawl session: ${actualSessionId}`);
  logger.info(`Crawling ${propertyUrls.length} properties`);

  try {
    // Create crawler
    const crawler = createPropertyCrawler(db, actualSessionId);

    // Add URLs to queue
    await crawler.addRequests(propertyUrls);

    // Run crawler
    await crawler.run();

    // Complete session
    sessionRepo.completeSession(actualSessionId, true);
    logger.info(`Completed crawl session: ${actualSessionId}`);

    // Get final stats
    const finalStats = sessionRepo.getSessionStats(actualSessionId);
    return {
      propertiesFound: finalStats?.properties_found || 0,
      propertiesNew: finalStats?.properties_new || 0,
      propertiesUpdated: finalStats?.properties_updated || 0,
      propertiesFailed: finalStats?.properties_failed || 0,
      imagesFound: 0, // Not tracked in session
    };
  } catch (error: any) {
    logger.error("Crawler error:", error);
    sessionRepo.completeSession(actualSessionId, false, error.message);
    throw error;
  }
}
