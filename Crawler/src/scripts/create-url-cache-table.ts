/**
 * Create URL Cache Table
 * Manually creates the property_urls_cache table if migration doesn't work
 */

import { initDatabase } from "../database/connectionManager.js";

async function main() {
  console.log("Creating property_urls_cache table...");

  const db = await initDatabase();

  // Create table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS property_urls_cache (
      id INTEGER PRIMARY KEY,
      url VARCHAR UNIQUE NOT NULL,
      search_page INTEGER NOT NULL,
      city VARCHAR NOT NULL,
      discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processed BOOLEAN DEFAULT FALSE,
      processed_at TIMESTAMP,
      crawl_successful BOOLEAN,
      error_message TEXT
    )
  `);

  // Create indexes
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_url_cache_city ON property_urls_cache(city)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_url_cache_processed ON property_urls_cache(processed)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_url_cache_search_page ON property_urls_cache(search_page)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_url_cache_discovered ON property_urls_cache(discovered_at)`);

  console.log("✅ Table and indexes created successfully");

  await db.close();
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
