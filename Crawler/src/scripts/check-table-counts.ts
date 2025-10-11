/**
 * Check row counts in all database tables
 */

import { DuckDBConnection } from '../database/connectionDuckDB.js';

async function checkTableCounts() {
  const db = new DuckDBConnection('./data/databases/properties.duckdb');
  await db.initialize();

  try {
    console.log('📊 Checking row counts in all tables...\n');

    const tables = [
      'properties',
      'property_images',
      'amenities',
      'crawl_sessions',
      'crawl_errors',
      'transaction_history',
      'nearby_schools',
      'neighborhood_ratings',
      'price_comparisons',
      'new_construction_projects'
    ];

    for (const table of tables) {
      try {
        const result = await db.queryOne<{ count: number }>(
          `SELECT COUNT(*) as count FROM ${table}`,
          []
        );
        const count = result?.count || 0;
        const icon = count > 0 ? '✅' : '⚠️';
        console.log(`${icon} ${table}: ${count} rows`);
      } catch (error) {
        console.log(`❌ ${table}: Error - ${error}`);
      }
    }

    console.log('\n📋 Sample data from properties table:');
    const properties = await db.query<any>(
      `SELECT property_id, address, city, price, rooms, size FROM properties LIMIT 5`,
      []
    );
    console.table(properties);

    console.log('\n📋 Sample data from neighborhood_ratings:');
    const ratings = await db.query<any>(
      `SELECT * FROM neighborhood_ratings LIMIT 5`,
      []
    );
    console.table(ratings);

    console.log('\n📋 Sample data from price_comparisons:');
    const priceComps = await db.query<any>(
      `SELECT * FROM price_comparisons LIMIT 5`,
      []
    );
    console.table(priceComps);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    db.close();
  }
}

checkTableCounts().catch(console.error);
