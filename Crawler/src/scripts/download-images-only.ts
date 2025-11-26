/**
 * Download Images Only Script
 * Downloads images for properties that already exist in the database
 * Uses concurrent downloading (5 images at a time) for faster performance
 */

import { chromium } from "playwright";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { initDuckDB } from "../database/connectionDuckDB.js";
import { PropertyRepository } from "../database/repositories/PropertyRepository.js";
import { ImageStore } from "../storage/imageStore.js";
import { logger } from "../utils/logger.js";
import { sleep } from "../utils/sleep.js";
import { extractImageUrls } from "../extractors/propertyExtractor.js";

// Configuration
const BROWSER_DELAY_MIN = 60000; // 60s
const BROWSER_DELAY_MAX = 120000; // 120s
const IMAGE_CONCURRENCY = 5; // Download 5 images concurrently
const MAX_PROPERTIES = 1792; // Process all properties
const START_FROM = 0; // Start from beginning (auto-resumes from last completed)

async function main() {
  logger.info("📸 Image-Only Crawler Starting...");
  logger.info(`Configuration:`);
  logger.info(`  - Browser delay: ${BROWSER_DELAY_MIN / 1000}-${BROWSER_DELAY_MAX / 1000}s`);
  logger.info(`  - Image concurrency: ${IMAGE_CONCURRENCY}`);
  logger.info(`  - Max properties: ${MAX_PROPERTIES}`);
  logger.info(`  - Start from: ${START_FROM}`);

  // Initialize database
  const db = await initDuckDB();
  const propertyRepo = new PropertyRepository(db);
  const imageStore = new ImageStore(db);

  try {
    // Get all properties without images
    logger.info("\n🔍 Finding properties without images...");
    const allProperties = await propertyRepo.findAll();
    logger.info(`Found ${allProperties.length} total properties`);

    // Filter to properties that need images
    const propertiesNeedingImages: typeof allProperties = [];
    for (const property of allProperties) {
      const imageStats = await imageStore.getPropertyStats(property.id);
      if (imageStats.downloaded === 0) {
        propertiesNeedingImages.push(property);
      }
    }

    logger.info(`${propertiesNeedingImages.length} properties need images`);

    // Apply limits
    const propertiesToProcess = propertiesNeedingImages
      .slice(START_FROM, START_FROM + MAX_PROPERTIES);

    logger.info(`Processing ${propertiesToProcess.length} properties (from ${START_FROM})`);

    // Stats
    let processed = 0;
    let successful = 0;
    let failed = 0;
    let totalImages = 0;
    const startTime = Date.now();

    // Process each property
    for (const property of propertiesToProcess) {
      processed++;
      const propertyStartTime = Date.now();

      logger.info(`\n[${ processed}/${propertiesToProcess.length}] Processing: ${property.id}`);
      logger.info(`  URL: ${property.url}`);

      let browser;
      try {
        // Random delay before browser launch
        const delay = Math.floor(Math.random() * (BROWSER_DELAY_MAX - BROWSER_DELAY_MIN + 1)) + BROWSER_DELAY_MIN;
        logger.info(`⏳ Waiting ${Math.round(delay / 1000)}s before browser launch...`);
        await sleep(delay);

        // Launch browser
        logger.info("🚀 Launching browser...");
        browser = await chromium.launch({
          headless: true,  // Run in background without visible window
          args: ["--disable-blink-features=AutomationControlled"],
        });

        const context = await browser.newContext({
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          viewport: { width: 1920, height: 1080 },
        });

        const page = await context.newPage();

        // Navigate to property page with longer timeout
        logger.info(`📄 Loading property page...`);
        await page.goto(property.url, {
          waitUntil: "domcontentloaded",  // Less strict than networkidle
          timeout: 30000  // 30s timeout
        });

        // Wait longer for dynamic content and images to load
        logger.info(`⏳ Waiting for page content...`);
        await page.waitForTimeout(5000);

        // Extract image URLs
        const imageUrls = await extractImageUrls(page);
        logger.info(`📸 Found ${imageUrls.length} images`);

        // Close browser before downloading images
        await browser.close();
        logger.info("🔒 Browser closed");

        if (imageUrls.length > 0) {
          // Download images with concurrency
          const downloadStats = await imageStore.downloadPropertyImages(
            property.id,
            imageUrls,
            {
              maxRetries: 3,
              timeout: 30000,
              concurrency: IMAGE_CONCURRENCY,
            }
          );

          totalImages += downloadStats.successful;
          successful++;

          logger.info(`✅ Success: ${downloadStats.successful}/${downloadStats.total} images downloaded`);
        } else {
          logger.warn("⚠️ No images found");
          successful++;
        }

        const duration = Math.round((Date.now() - propertyStartTime) / 1000);
        logger.info(`⏱️ Property completed in ${duration}s`);

        // Progress update
        const elapsed = Math.round((Date.now() - startTime) / 60000);
        const remaining = propertiesToProcess.length - processed;
        const rate = processed / ((Date.now() - startTime) / 60000);
        const eta = remaining / rate;

        logger.info(`\n📊 Progress: ${processed}/${propertiesToProcess.length} (${Math.round((processed / propertiesToProcess.length) * 100)}%)`);
        logger.info(`   ⏱️ Elapsed: ${elapsed}m | ETA: ${Math.round(eta)}m`);
        logger.info(`   ✅ Success: ${successful} | ❌ Failed: ${failed}`);
        logger.info(`   📸 Images: ${totalImages} downloaded`);

      } catch (error: any) {
        failed++;
        logger.error(`❌ Error processing property: ${error.message}`);
        logger.error(error.stack);
      } finally {
        // Ensure browser is always closed
        if (browser) {
          try {
            await browser.close();
            logger.info("🔒 Browser closed (cleanup)");
          } catch (e) {
            logger.warn("Failed to close browser in cleanup");
          }
        }
      }
    }

    // Final stats
    const totalDuration = Math.round((Date.now() - startTime) / 60000);
    logger.info("\n" + "=".repeat(70));
    logger.info("📊 FINAL STATS");
    logger.info("=".repeat(70));
    logger.info(`Total processed: ${processed}`);
    logger.info(`✅ Successful: ${successful}`);
    logger.info(`❌ Failed: ${failed}`);
    logger.info(`📸 Images downloaded: ${totalImages}`);
    logger.info(`⏱️  Duration: ${totalDuration} minutes`);
    logger.info(`📈 Rate: ${(processed / totalDuration).toFixed(2)} properties/min`);
    logger.info("=".repeat(70));

  } catch (error: any) {
    logger.error("Fatal error:", error);
  } finally {
    await db.close();
    logger.info("✅ Database connection closed");
  }
}

main().catch(error => {
  logger.error("Unhandled error:", error);
  process.exit(1);
});
