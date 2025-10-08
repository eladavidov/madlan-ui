/**
 * Property Crawler
 * Crawls individual property pages and extracts data
 */

import { PlaywrightCrawler } from "crawlee";
import { PropertyRepository } from "../database/repositories/PropertyRepository.js";
import { ImageRepository } from "../database/repositories/ImageRepository.js";
import { CrawlSessionRepository } from "../database/repositories/CrawlSessionRepository.js";
import { extractPropertyData, extractImageUrls } from "../extractors/propertyExtractor.js";
import { ImageStore } from "../storage/imageStore.js";
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
  db: DatabaseConnection,
  sessionId: string,
  options: PropertyCrawlerOptions = {}
): PlaywrightCrawler {
  const { downloadImages = true, imageTimeout = 30000, imageRetries = 3 } = options;

  const propertyRepo = new PropertyRepository(db);
  const imageRepo = new ImageRepository(db);
  const sessionRepo = new CrawlSessionRepository(db);
  const imageStore = new ImageStore(db);

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
          logger.info(`Found ${imageUrls.length} images for property ${propertyData.id}`);

          // Delete old image records
          imageRepo.deleteByPropertyId(propertyData.id);

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

            imageRepo.insertMany(images);
            logger.info(`Saved ${imageUrls.length} image URLs (download disabled)`);
          }
        }

        // Update session stats
        sessionRepo.updateStats(sessionId, {
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
  sessionId?: string,
  options?: PropertyCrawlerOptions
): Promise<CrawlerStats> {
  const actualSessionId = sessionId || `crawl-${Date.now()}`;
  const sessionRepo = new CrawlSessionRepository(db);

  // Start session
  sessionRepo.startSession(actualSessionId, config.target.city);
  logger.info(`Started crawl session: ${actualSessionId}`);
  logger.info(`Crawling ${propertyUrls.length} properties`);

  try {
    // Create crawler
    const crawler = createPropertyCrawler(db, actualSessionId, options);

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
      imagesFound: 0, // Not tracked separately
      imagesDownloaded: finalStats?.images_downloaded || 0,
      imagesFailed: finalStats?.images_failed || 0,
    };
  } catch (error: any) {
    logger.error("Crawler error:", error);
    sessionRepo.completeSession(actualSessionId, false, error.message);
    throw error;
  }
}
