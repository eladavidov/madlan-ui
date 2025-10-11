/**
 * Madlan Crawler - Main Entry Point
 */

import { runFullCrawl, runPropertyCrawl } from "./crawlers/integratedCrawler.js";
import { isSearchPage, isPropertyPage } from "./crawlers/router.js";
import { validateConfig } from "./utils/config.js";

async function main() {
  console.log("🕷️  Madlan Property Crawler v1.0");
  console.log("=" .repeat(60));

  try {
    // Validate configuration
    validateConfig();
    console.log("✅ Configuration validated\n");

    // Parse command line arguments
    const args = process.argv.slice(2);

    // Show help if no arguments
    if (args.length === 0) {
      showHelp();
      return;
    }

    // Parse options
    const options = parseArgs(args);

    if (options.help) {
      showHelp();
      return;
    }

    // Determine crawl mode
    if (options.urls.length === 0) {
      // Full crawl mode (search → properties)
      console.log("📋 Mode: Full Crawl (Search → Properties)\n");
      const summary = await runFullCrawl({
        city: options.city,
        maxSearchPages: options.maxPages,
        maxProperties: options.maxProperties,
        downloadImages: !options.noImages,
      });

      console.log("\n✅ Crawl completed successfully!");
      console.log(`Session ID: ${summary.sessionId}`);
    } else {
      // Check if URLs are search pages or property pages
      const searchUrls = options.urls.filter(isSearchPage);
      const propertyUrls = options.urls.filter(isPropertyPage);

      if (searchUrls.length > 0 && propertyUrls.length > 0) {
        console.error("❌ Error: Cannot mix search URLs and property URLs");
        console.error("   Please provide either search URLs OR property URLs, not both");
        process.exit(1);
      }

      if (searchUrls.length > 0) {
        // Search mode
        console.log("📋 Mode: Search Crawl\n");
        await runFullCrawl({
          searchUrl: searchUrls[0],
          maxSearchPages: options.maxPages,
          maxProperties: options.maxProperties,
        });
        console.log("\n✅ Search crawl completed successfully!");
      } else if (propertyUrls.length > 0) {
        // Property mode
        console.log("🏠 Mode: Property Crawl\n");
        await runPropertyCrawl(propertyUrls);
        console.log("\n✅ Property crawl completed successfully!");
      } else {
        console.error("❌ Error: No valid URLs provided");
        console.error("   URLs must be either search pages or property pages from Madlan.co.il");
        process.exit(1);
      }
    }
  } catch (error: any) {
    console.error("\n❌ Crawler failed:", error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function parseArgs(args: string[]): {
  help: boolean;
  city?: string;
  maxPages?: number;
  maxProperties?: number;
  noImages: boolean;
  urls: string[];
} {
  const options = {
    help: false,
    city: undefined as string | undefined,
    maxPages: undefined as number | undefined,
    maxProperties: undefined as number | undefined,
    noImages: false,
    urls: [] as string[],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--city" && i + 1 < args.length) {
      options.city = args[++i];
    } else if (arg === "--max-pages" && i + 1 < args.length) {
      options.maxPages = parseInt(args[++i], 10);
    } else if (arg === "--max-properties" && i + 1 < args.length) {
      options.maxProperties = parseInt(args[++i], 10);
    } else if (arg === "--no-images") {
      options.noImages = true;
    } else if (arg.startsWith("http")) {
      options.urls.push(arg);
    }
  }

  return options;
}

function showHelp() {
  console.log("Usage:");
  console.log("  npm run dev [options] [urls...]");
  console.log();
  console.log("Modes:");
  console.log("  1. Full crawl (no URLs):");
  console.log("     npm run dev --city חיפה --max-pages 5");
  console.log();
  console.log("  2. Search crawl (with search URL):");
  console.log("     npm run dev https://www.madlan.co.il/for-sale/חיפה");
  console.log();
  console.log("  3. Property crawl (with property URLs):");
  console.log("     npm run dev https://www.madlan.co.il/listings/12345");
  console.log();
  console.log("Options:");
  console.log("  --city <city>              Target city (default: חיפה)");
  console.log("  --max-pages <n>            Max search pages (default: 5)");
  console.log("  --max-properties <n>       Max properties to crawl (default: 100)");
  console.log("  --no-images                Skip image downloads (property data only)");
  console.log("  --help, -h                 Show this help");
  console.log();
  console.log("Examples:");
  console.log("  npm run dev --city תל-אביב --max-pages 3");
  console.log("  npm run dev https://www.madlan.co.il/listings/123 https://www.madlan.co.il/listings/456");
  console.log();
  console.log("⚠️  Note: CAPTCHA protection will block most live requests");
  console.log("   This is expected from Phase 1 research findings");
}

// Run main
main();
