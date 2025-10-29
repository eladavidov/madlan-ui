/**
 * URL Cache Management Utility
 * Manage Phase 1 URL cache for faster crawler restarts
 */

import { initDatabase } from "../database/connectionManager.js";
import { PropertyUrlCacheRepository } from "../database/repositories/PropertyUrlCacheRepository.js";
import { logger } from "../utils/logger.js";

async function main() {
  const command = process.argv[2] || "status";
  const city = process.argv[3] || "חיפה";

  const db = await initDatabase();
  const cacheRepo = new PropertyUrlCacheRepository(db);

  switch (command) {
    case "status":
    case "stats": {
      const stats = await cacheRepo.getStats(city);
      console.log("\n📊 URL Cache Status");
      console.log("=".repeat(60));
      console.log(`City: ${city}`);
      console.log(`Total URLs: ${stats.total}`);
      console.log(`Last Page: ${stats.lastPage}`);
      console.log(`Processed: ${stats.processed} (${Math.round((stats.processed / stats.total) * 100)}%)`);
      console.log(`Unprocessed: ${stats.unprocessed}`);
      console.log(`Successful: ${stats.successful}`);
      console.log(`Failed: ${stats.failed}`);
      console.log("=".repeat(60));
      break;
    }

    case "clear": {
      const count = await cacheRepo.clearCache(city);
      console.log(`\n✅ Cleared ${count} URLs from cache for ${city}`);
      break;
    }

    case "clear-all": {
      const count = await cacheRepo.clearAllCache();
      console.log(`\n✅ Cleared ${count} URLs from cache (all cities)`);
      break;
    }

    case "list": {
      const page = parseInt(process.argv[4] || "1");
      const urls = await cacheRepo.getUrlsByPage(city, page);
      console.log(`\n📋 URLs from page ${page} (${city}):`);
      console.log("=".repeat(60));
      urls.forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
      });
      console.log(`\nTotal: ${urls.length} URLs`);
      break;
    }

    case "help": {
      console.log("\n📚 URL Cache Management");
      console.log("=".repeat(60));
      console.log("Usage: npx tsx src/scripts/manage-url-cache.ts <command> [city] [args]");
      console.log("");
      console.log("Commands:");
      console.log("  status [city]         Show cache statistics (default: חיפה)");
      console.log("  stats [city]          Alias for 'status'");
      console.log("  clear [city]          Clear cache for specific city");
      console.log("  clear-all             Clear entire cache (all cities)");
      console.log("  list [city] [page]    List URLs from specific page");
      console.log("  help                  Show this help message");
      console.log("");
      console.log("Examples:");
      console.log("  npx tsx src/scripts/manage-url-cache.ts status");
      console.log("  npx tsx src/scripts/manage-url-cache.ts clear חיפה");
      console.log("  npx tsx src/scripts/manage-url-cache.ts list חיפה 5");
      console.log("=".repeat(60));
      break;
    }

    default:
      console.error(`\n❌ Unknown command: ${command}`);
      console.log("Run 'npx tsx src/scripts/manage-url-cache.ts help' for usage");
      process.exit(1);
  }

  await db.close();
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
