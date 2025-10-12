/**
 * Clean Database - Remove duplicate properties
 */

import { DuckDBConnection } from "../database/connectionDuckDB.js";

async function cleanDatabase() {
  console.log("🧹 Cleaning database...\n");

  const db = new DuckDBConnection();

  try {
    // Get count before
    const beforeResult = await db.execute("SELECT COUNT(*) as count FROM properties");
    const beforeCount = beforeResult[0]?.count || 0;
    console.log(`📊 Properties before cleanup: ${beforeCount}`);

    // Find duplicates (same listing_id)
    const duplicatesQuery = `
      SELECT listing_id, COUNT(*) as count
      FROM properties
      GROUP BY listing_id
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    const duplicates = await db.execute(duplicatesQuery);
    console.log(`🔍 Found ${duplicates.length} duplicated listing IDs\n`);

    if (duplicates.length > 0) {
      // Keep the most recent version of each property (highest id = most recent)
      const deleteQuery = `
        DELETE FROM properties
        WHERE id IN (
          SELECT id FROM properties p1
          WHERE EXISTS (
            SELECT 1 FROM properties p2
            WHERE p1.listing_id = p2.listing_id
            AND p2.id > p1.id
          )
        )
      `;

      await db.execute(deleteQuery);
      console.log("✅ Deleted older duplicate versions\n");
    }

    // Get count after
    const afterResult = await db.execute("SELECT COUNT(*) as count FROM properties");
    const afterCount = afterResult[0]?.count || 0;
    console.log(`📊 Properties after cleanup: ${afterCount}`);
    console.log(`🗑️  Removed: ${beforeCount - afterCount} duplicates\n`);

    // Show table counts
    console.log("📋 Table Counts:");
    const tables = ["properties", "transaction_history", "nearby_schools", "neighborhood_ratings", "price_comparisons", "new_construction_projects"];
    for (const table of tables) {
      try {
        const result = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${result[0]?.count || 0} rows`);
      } catch (e) {
        // Table doesn't exist or error
      }
    }

    db.close();
    console.log("\n✅ Database cleaned successfully!");
  } catch (error: any) {
    console.error("❌ Error cleaning database:", error.message);
    db.close();
    process.exit(1);
  }
}

cleanDatabase();
