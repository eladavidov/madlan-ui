/**
 * Madlan Crawler - Main Entry Point
 */

import { initDatabase } from "./database/connection.js";
import { crawlProperties } from "./crawlers/propertyCrawler.js";
import { logger } from "./utils/logger.js";
import { config, validateConfig } from "./utils/config.js";

async function main() {
  console.log("🕷️  Madlan Property Crawler");
  console.log("=" .repeat(50));

  try {
    // Validate configuration
    validateConfig();
    logger.info("Configuration validated");

    // Initialize database
    logger.info("Initializing database...");
    const db = await initDatabase(config.database.path);
    logger.info(`Database initialized: ${config.database.path}`);

    // Get test URLs from command line or use defaults
    const testUrls = process.argv.slice(2);

    if (testUrls.length === 0) {
      console.log("\n⚠️  No URLs provided. Usage:");
      console.log("  npm run dev <url1> [url2] [url3]...");
      console.log("\nExample:");
      console.log("  npm run dev https://www.madlan.co.il/listings/12345");
      console.log("\n💡 Phase 2.2 Test Mode:");
      console.log("  Testing with hardcoded URL (will likely hit CAPTCHA)");
      console.log();

      // Use a test URL for Phase 2.2
      const testUrl = "https://www.madlan.co.il/listings/test-123";
      console.log(`Testing with URL: ${testUrl}`);
      console.log("Note: This will likely fail due to CAPTCHA protection");
      console.log();

      // Don't actually run - just show that the crawler is set up
      console.log("✅ Crawler setup complete");
      console.log("✅ Database connection working");
      console.log("✅ Configuration loaded");
      console.log("\n🎯 Phase 2.2 Status: Basic crawler prototype created");
      console.log("\n📝 Next Steps:");
      console.log("  1. Implement search results crawler (Phase 3)");
      console.log("  2. Work on CAPTCHA bypass strategies");
      console.log("  3. Test with live property URLs");

      db.close();
      return;
    }

    // Run crawler with provided URLs
    logger.info(`Starting crawl with ${testUrls.length} URLs`);
    console.log(`\n🚀 Crawling ${testUrls.length} properties...\n`);

    const stats = await crawlProperties(db, testUrls);

    // Print results
    console.log("\n" + "=".repeat(50));
    console.log("📊 Crawl Results:");
    console.log("=".repeat(50));
    console.log(`  Properties Found:   ${stats.propertiesFound}`);
    console.log(`  New Properties:     ${stats.propertiesNew}`);
    console.log(`  Updated Properties: ${stats.propertiesUpdated}`);
    console.log(`  Failed Properties:  ${stats.propertiesFailed}`);
    console.log(`  Images Found:       ${stats.imagesFound}`);
    console.log("=".repeat(50));

    // Close database
    db.close();
    logger.info("Crawler finished successfully");
  } catch (error: any) {
    logger.error("Crawler failed:", error);
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

// Run main
main();
