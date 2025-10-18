/**
 * Quick status check for production crawl
 */

import { DuckDBConnection } from '../database/connectionDuckDB.js';

async function quickStatus() {
  const db = new DuckDBConnection('./data/databases/properties.duckdb', true); // Read-only mode
  await db.initialize();

  try {
    // Get property count
    const propCount = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM properties`,
      []
    );

    // Get error count
    const errorCount = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM crawl_errors`,
      []
    );

    // Get success rate (convert BigInt to Number)
    const totalProps = Number(propCount?.count || 0);
    const totalErrors = Number(errorCount?.count || 0);
    const total = totalProps + totalErrors;
    const successRate = total > 0 ? (totalProps / total * 100).toFixed(1) : 0;

    console.log('\n📊 PRODUCTION CRAWL STATUS\n');
    console.log(`✅ Properties crawled: ${totalProps}`);
    console.log(`❌ Failed/Errors: ${totalErrors}`);
    console.log(`📈 Success rate: ${successRate}%`);
    console.log(`📊 Total attempts: ${total}`);

    console.log('\n📋 Data Tables:');
    const tables = [
      { name: 'transaction_history', label: 'Transaction history' },
      { name: 'nearby_schools', label: 'Schools' },
      { name: 'neighborhood_ratings', label: 'Neighborhood ratings' },
      { name: 'price_comparisons', label: 'Price comparisons' },
      { name: 'new_construction_projects', label: 'Construction projects' }
    ];

    for (const table of tables) {
      const count = await db.queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${table.name}`,
        []
      );
      console.log(`  • ${table.label}: ${count?.count || 0} rows`);
    }

    console.log('\n🎯 Target: 500 properties (Step 3)');
    console.log(`📊 Progress: ${totalProps}/500 (${(totalProps / 500 * 100).toFixed(1)}%)`);
    console.log(`📉 Remaining: ${500 - totalProps} properties\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    db.close();
  }
}

quickStatus().catch(console.error);
