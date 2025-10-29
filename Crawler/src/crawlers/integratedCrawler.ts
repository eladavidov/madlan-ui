/**
 * Integrated Crawler
 * Combines search crawler and property crawler for end-to-end crawling
 */

import { initDatabase } from "../database/connectionManager.js";
import { crawlSearchResults } from "./searchCrawler.js";
import { crawlProperties } from "./propertyCrawler.js";
import { crawlPropertiesWithFreshBrowser } from "./singleBrowserCrawler.js";
import { CrawlSessionRepository } from "../database/repositories/CrawlSessionRepository.js";
import { PropertyUrlCacheRepository } from "../database/repositories/PropertyUrlCacheRepository.js";
import { ProgressReporter } from "../utils/progressReporter.js";
import { logger } from "../utils/logger.js";
import { config } from "../utils/config.js";

export interface IntegratedCrawlerOptions {
  city?: string;
  maxSearchPages?: number;
  startPage?: number;
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

  // Auto-Resume: Calculate start page from database if not provided
  let calculatedStartPage = 1;
  const dbPath = options.dbPath || config.database.path;

  if (!options.startPage) {
    try {
      const db = await initDatabase(dbPath);
      const result = await db.queryOne<{ count: number }>("SELECT COUNT(*) as count FROM properties", []);
      const currentProperties = result?.count || 0;

      if (currentProperties > 0) {
        const lastCompletePage = Math.floor(currentProperties / 34);
        calculatedStartPage = lastCompletePage + 1;
        logger.info(`🔄 Auto-Resume Detected:`);
        logger.info(`   Database has ${currentProperties} properties`);
        logger.info(`   Last complete page: ${lastCompletePage}`);
        logger.info(`   Resuming from page: ${calculatedStartPage}`);
      }
      // Note: Do NOT close the database here - we'll reuse the singleton connection
    } catch (error) {
      logger.warn("Could not auto-detect resume point, starting from page 1");
    }
  }

  const {
    city = config.target.city,
    maxSearchPages = 5,
    startPage = calculatedStartPage,
    maxProperties = config.target.maxProperties,
    searchUrl,
    downloadImages = true,
    imageTimeout,
    imageRetries,
  } = options;

  const sessionId = `crawl-${Date.now()}`;
  // Use config template for correct URL format
  let actualSearchUrl = searchUrl || config.target.searchUrlTemplate.replace("{city}", encodeURIComponent(city));

  // Add page parameter if starting from page > 1
  if (startPage > 1) {
    const url = new URL(actualSearchUrl);
    url.searchParams.set('page', startPage.toString());
    actualSearchUrl = url.toString();
  }

  logger.info("=" .repeat(60));
  logger.info("🕷️  Starting Integrated Crawl");
  logger.info("=" .repeat(60));
  logger.info(`Session ID: ${sessionId}`);
  logger.info(`Target City: ${city}`);
  logger.info(`Search URL: ${actualSearchUrl}`);
  logger.info(`Max Search Pages: ${maxSearchPages} (starting from page ${startPage})`);
  logger.info(`Max Properties: ${maxProperties}`);
  logger.info("=" .repeat(60));

  // Initialize progress reporter
  const progressReporter = new ProgressReporter();
  progressReporter.start(15000); // Update every 15 seconds

  try {
    // Initialize database
    logger.info("Initializing DuckDB database...");
    const db = await initDatabase(dbPath);
    const sessionRepo = new CrawlSessionRepository(db);
    const urlCacheRepo = new PropertyUrlCacheRepository(db);

    // Start session
    await sessionRepo.startSession(sessionId, city, maxProperties);

    // Check URL cache first
    const cacheStats = await urlCacheRepo.getStats(city);
    const cacheComplete = await urlCacheRepo.isPhase1Complete(city, maxSearchPages);

    let propertyUrls: string[] = [];

    if (cacheComplete && cacheStats.total > 0) {
      // Phase 1 already complete - use cache
      logger.info("\n💾 Phase 1: Using cached URLs (Phase 1 complete)");
      logger.info(`   ✅ Cache has ${cacheStats.total} URLs from ${cacheStats.lastPage} pages`);
      logger.info(`   ⏭️  Skipping Phase 1 search crawl (saving ~${Math.round(maxSearchPages * 2)}+ minutes)`);

      propertyUrls = await urlCacheRepo.getAllUrls(city);
      logger.info(`\n✅ Loaded ${propertyUrls.length} URLs from cache`);
    } else {
      // Phase 1: Crawl search results (with caching)
      const lastPage = cacheStats.lastPage;
      const resumeFromPage = lastPage > 0 ? lastPage + 1 : startPage;

      if (lastPage > 0) {
        logger.info(`\n📋 Phase 1: Resuming search crawl from page ${resumeFromPage}/${maxSearchPages}`);
        logger.info(`   💾 Cache has ${cacheStats.total} URLs from pages 1-${lastPage}`);
        logger.info(`   🔄 Will crawl pages ${resumeFromPage}-${maxSearchPages}`);
      } else {
        logger.info("\n📋 Phase 1: Crawling search results...");
      }

      const newUrls = await crawlSearchResults(actualSearchUrl, {
        maxPages: maxSearchPages - lastPage,
        startPage: resumeFromPage,
        urlCacheRepo: urlCacheRepo,
        city: city,
        onPropertiesFound: (urls) => {
          logger.info(`  → Batch: ${urls.length} property URLs extracted`);
        },
      });

      // Combine cached + new URLs
      if (lastPage > 0) {
        const cachedUrls = await urlCacheRepo.getAllUrls(city);
        propertyUrls = [...cachedUrls, ...newUrls];
        logger.info(`\n✅ Search complete: ${newUrls.length} new + ${cachedUrls.length} cached = ${propertyUrls.length} total URLs`);
      } else {
        propertyUrls = newUrls;
        logger.info(`\n✅ Search complete: ${propertyUrls.length} property URLs found`);
      }
    }

    // Post-crawl validation: Check if actual count matches expected
    const expectedPropertiesPerPage = 34; // Typical Madlan search results per page
    const expectedTotal = maxSearchPages * expectedPropertiesPerPage;
    const actualTotal = propertyUrls.length;

    if (actualTotal < expectedTotal * 0.8) {
      // Warn if we got less than 80% of expected properties
      logger.warn(`⚠️  Post-Crawl Validation Warning:`);
      logger.warn(`   Expected ~${expectedTotal} properties (${maxSearchPages} pages × ~${expectedPropertiesPerPage}/page)`);
      logger.warn(`   Actually found ${actualTotal} properties`);
      logger.warn(`   This may indicate pagination issues or blocking`);
    } else {
      logger.info(`   ✅ Property count validated: ${actualTotal} properties from ${maxSearchPages} pages`);
    }

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
        // Update progress reporter after each property
        onProgressUpdate: (partialStats) => {
          progressReporter.updateStats({
            propertiesFound: partialStats.propertiesProcessed || 0,
            propertiesNew: partialStats.propertiesSuccessful || 0,
            propertiesUpdated: 0,
            propertiesFailed: partialStats.propertiesFailed || 0,
            imagesDownloaded: partialStats.imagesDownloaded || 0,
            imagesFailed: partialStats.imagesFailed || 0,
          });
        },
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

    // Complete session (wrapped in try-catch due to DuckDB foreign key quirk)
    try {
      await sessionRepo.completeSession(sessionId, true);
    } catch (error: any) {
      logger.warn("Warning: Could not mark session as complete (DuckDB foreign key constraint)");
      logger.warn("Session data was saved successfully, only status update failed");
    }

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
    await sessionRepo.startSession(sessionId);

    // Crawl properties
    const stats = await crawlProperties(db, propertyUrls, sessionId, {
      downloadImages,
      imageTimeout,
      imageRetries,
    });

    // Complete session (wrapped in try-catch due to DuckDB foreign key quirk)
    try {
      await sessionRepo.completeSession(sessionId, true);
    } catch (error: any) {
      logger.warn("Warning: Could not mark session as complete (DuckDB foreign key constraint)");
      logger.warn("Session data was saved successfully, only status update failed");
    }

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
