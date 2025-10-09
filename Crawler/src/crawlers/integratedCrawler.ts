/**
 * Integrated Crawler
 * Combines search crawler and property crawler for end-to-end crawling
 */

import { initDatabase } from "../database/connection.js";
import { crawlSearchResults } from "./searchCrawler.js";
import { crawlProperties } from "./propertyCrawler.js";
import { crawlPropertiesWithFreshBrowser } from "./singleBrowserCrawler.js";
import { CrawlSessionRepository } from "../database/repositories/CrawlSessionRepository.js";
import { ProgressReporter } from "../utils/progressReporter.js";
import { logger } from "../utils/logger.js";
import { config } from "../utils/config.js";

export interface IntegratedCrawlerOptions {
  city?: string;
  maxSearchPages?: number;
  maxProperties?: number;
  searchUrl?: string;
  dbPath?: string;
  downloadImages?: boolean;
  imageTimeout?: number;
  imageRetries?: number;
}

export interface CrawlSummary {
  sessionId: string;
  searchUrl: string;
  propertiesFound: number;
  propertiesNew: number;
  propertiesUpdated: number;
  propertiesFailed: number;
  duration: number;
}

/**
 * Run full crawl: search → extract → crawl properties → save
 */
export async function runFullCrawl(
  options: IntegratedCrawlerOptions = {}
): Promise<CrawlSummary> {
  const startTime = Date.now();
  const {
    city = config.target.city,
    maxSearchPages = 5,
    maxProperties = config.target.maxProperties,
    searchUrl,
    dbPath = config.database.path,
    downloadImages = true,
    imageTimeout,
    imageRetries,
  } = options;

  const sessionId = `crawl-${Date.now()}`;
  // Use config template for correct URL format
  const actualSearchUrl = searchUrl || config.target.searchUrlTemplate.replace("{city}", encodeURIComponent(city));

  logger.info("=" .repeat(60));
  logger.info("🕷️  Starting Integrated Crawl");
  logger.info("=" .repeat(60));
  logger.info(`Session ID: ${sessionId}`);
  logger.info(`Target City: ${city}`);
  logger.info(`Search URL: ${actualSearchUrl}`);
  logger.info(`Max Search Pages: ${maxSearchPages}`);
  logger.info(`Max Properties: ${maxProperties}`);
  logger.info("=" .repeat(60));

  // Initialize progress reporter
  const progressReporter = new ProgressReporter();
  progressReporter.start(15000); // Update every 15 seconds

  try {
    // Initialize database
    logger.info("Initializing database...");
    const db = await initDatabase(dbPath);
    const sessionRepo = new CrawlSessionRepository(db);

    // Start session
    sessionRepo.startSession(sessionId, city, maxProperties);

    // Phase 1: Crawl search results
    logger.info("\n📋 Phase 1: Crawling search results...");
    const propertyUrls = await crawlSearchResults(actualSearchUrl, {
      maxPages: maxSearchPages,
      onPropertiesFound: (urls) => {
        logger.info(`  → Batch: ${urls.length} property URLs extracted`);
      },
    });

    logger.info(`\n✅ Search complete: ${propertyUrls.length} property URLs found`);

    // Limit to maxProperties
    const urlsToProcess = propertyUrls.slice(0, maxProperties);
    if (urlsToProcess.length < propertyUrls.length) {
      logger.info(`   Limited to first ${maxProperties} properties`);
    }

    // Phase 2: Crawl individual properties
    logger.info("\n🏠 Phase 2: Crawling individual properties...");
    logger.info(`   Processing ${urlsToProcess.length} properties...`);

    // Choose crawler based on configuration
    let stats;
    if (config.crawler.freshBrowserPerProperty) {
      logger.info("   Strategy: Fresh browser per property (anti-blocking)");
      stats = await crawlPropertiesWithFreshBrowser(db, urlsToProcess, sessionId, {
        downloadImages,
        imageTimeout,
        imageRetries,
      });

      // Convert stats format
      stats = {
        propertiesFound: stats.propertiesProcessed,
        propertiesNew: stats.propertiesSuccessful,
        propertiesUpdated: 0,
        propertiesFailed: stats.propertiesFailed,
        imagesFound: 0,
        imagesDownloaded: stats.imagesDownloaded,
        imagesFailed: stats.imagesFailed,
      };
    } else {
      logger.info("   Strategy: Standard Crawlee (session-based)");
      stats = await crawlProperties(db, urlsToProcess, sessionId, {
        downloadImages,
        imageTimeout,
        imageRetries,
      });
    }

    // Update final progress stats
    progressReporter.updateStats({
      propertiesFound: stats.propertiesFound,
      propertiesNew: stats.propertiesNew,
      propertiesUpdated: stats.propertiesUpdated,
      propertiesFailed: stats.propertiesFailed,
      imagesDownloaded: stats.imagesDownloaded,
      imagesFailed: stats.imagesFailed,
    });

    // Stop progress reporter
    progressReporter.stop();

    // Complete session
    sessionRepo.completeSession(sessionId, true);

    const duration = Date.now() - startTime;

    // Print summary
    logger.info("\n" + "=".repeat(60));
    logger.info("✅ Crawl Complete!");
    logger.info("=".repeat(60));
    logger.info(`Duration: ${Math.round(duration / 1000)}s`);
    logger.info(`Properties Found: ${stats.propertiesFound}`);
    logger.info(`New Properties: ${stats.propertiesNew}`);
    logger.info(`Updated Properties: ${stats.propertiesUpdated}`);
    logger.info(`Failed Properties: ${stats.propertiesFailed}`);
    if (downloadImages) {
      logger.info(`Images Downloaded: ${stats.imagesDownloaded}`);
      logger.info(`Images Failed: ${stats.imagesFailed}`);
    }
    logger.info("=".repeat(60));

    // Close database
    db.close();

    return {
      sessionId,
      searchUrl: actualSearchUrl,
      propertiesFound: stats.propertiesFound,
      propertiesNew: stats.propertiesNew,
      propertiesUpdated: stats.propertiesUpdated,
      propertiesFailed: stats.propertiesFailed,
      duration,
    };
  } catch (error: any) {
    progressReporter.stop();
    logger.error("Integrated crawl failed:", error);
    throw error;
  }
}

/**
 * Run crawl with just property URLs (skip search)
 */
export async function runPropertyCrawl(
  propertyUrls: string[],
  options: {
    dbPath?: string;
    downloadImages?: boolean;
    imageTimeout?: number;
    imageRetries?: number;
  } = {}
): Promise<CrawlSummary> {
  const startTime = Date.now();
  const {
    dbPath = config.database.path,
    downloadImages = true,
    imageTimeout,
    imageRetries,
  } = options;
  const sessionId = `property-crawl-${Date.now()}`;

  logger.info("=" .repeat(60));
  logger.info("🏠 Starting Property Crawl");
  logger.info("=" .repeat(60));
  logger.info(`Session ID: ${sessionId}`);
  logger.info(`Properties: ${propertyUrls.length}`);
  logger.info("=" .repeat(60));

  try {
    // Initialize database
    const db = await initDatabase(dbPath);
    const sessionRepo = new CrawlSessionRepository(db);

    // Start session
    sessionRepo.startSession(sessionId);

    // Crawl properties
    const stats = await crawlProperties(db, propertyUrls, sessionId, {
      downloadImages,
      imageTimeout,
      imageRetries,
    });

    // Complete session
    sessionRepo.completeSession(sessionId, true);

    const duration = Date.now() - startTime;

    // Print summary
    logger.info("\n" + "=".repeat(60));
    logger.info("✅ Property Crawl Complete!");
    logger.info("=".repeat(60));
    logger.info(`Duration: ${Math.round(duration / 1000)}s`);
    logger.info(`Properties Found: ${stats.propertiesFound}`);
    logger.info(`New Properties: ${stats.propertiesNew}`);
    logger.info(`Updated Properties: ${stats.propertiesUpdated}`);
    logger.info(`Failed Properties: ${stats.propertiesFailed}`);
    logger.info("=".repeat(60));

    // Close database
    db.close();

    return {
      sessionId,
      searchUrl: "",
      propertiesFound: stats.propertiesFound,
      propertiesNew: stats.propertiesNew,
      propertiesUpdated: stats.propertiesUpdated,
      propertiesFailed: stats.propertiesFailed,
      duration,
    };
  } catch (error: any) {
    logger.error("Property crawl failed:", error);
    throw error;
  }
}
