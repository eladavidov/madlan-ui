import { initDuckDB } from './src/database/connectionDuckDB.js';

async function verifyDatabase() {
  const db = await initDuckDB();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 DATABASE VERIFICATION REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  const tables = [
    { name: 'properties', critical: true, description: 'Main property data' },
    { name: 'transaction_history', critical: true, description: 'Historical transactions' },
    { name: 'nearby_schools', critical: true, description: 'Nearby schools' },
    { name: 'neighborhood_ratings', critical: true, description: 'Neighborhood ratings' },
    { name: 'price_comparisons', critical: true, description: 'Price comparison data' },
    { name: 'new_construction_projects', critical: false, description: 'Construction projects (may be sparse)' },
    { name: 'property_images', critical: false, description: 'Property images (empty with --no-images)' }
  ];

  let allCriticalTablesHaveData = true;
  const results: any[] = [];

  for (const table of tables) {
    try {
      const countResult = await db.queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM ${table.name}`);
      const count = countResult?.count || 0;

      const status = count === 0
        ? (table.critical ? '❌ EMPTY (CRITICAL)' : '⚠️  Empty (optional)')
        : `✅ ${count} rows`;

      results.push({
        table: table.name,
        count,
        status,
        description: table.description,
        critical: table.critical
      });

      if (table.critical && count === 0) {
        allCriticalTablesHaveData = false;
      }

      console.log(`${status.padEnd(30)} ${table.name.padEnd(30)} - ${table.description}`);

      // Show sample data if table has rows
      if (count > 0 && count < 100) {
        const sample = await db.queryOne(`SELECT * FROM ${table.name} LIMIT 1`);
        console.log(`   Sample: ${JSON.stringify(sample).substring(0, 120)}...`);
      }

    } catch (error: any) {
      console.log(`❌ ERROR querying ${table.name}: ${error.message}`);
      if (table.critical) {
        allCriticalTablesHaveData = false;
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📈 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  const propertiesCount = results.find(r => r.table === 'properties')?.count || 0;
  const transactionsCount = results.find(r => r.table === 'transaction_history')?.count || 0;
  const schoolsCount = results.find(r => r.table === 'nearby_schools')?.count || 0;
  const ratingsCount = results.find(r => r.table === 'neighborhood_ratings')?.count || 0;
  const priceCompsCount = results.find(r => r.table === 'price_comparisons')?.count || 0;
  const constructionCount = results.find(r => r.table === 'new_construction_projects')?.count || 0;

  console.log(`Total Properties Crawled: ${propertiesCount}`);
  console.log(`Total Transactions: ${transactionsCount} (avg ${propertiesCount > 0 ? (transactionsCount / propertiesCount).toFixed(1) : 0} per property)`);
  console.log(`Total Schools: ${schoolsCount} (avg ${propertiesCount > 0 ? (schoolsCount / propertiesCount).toFixed(1) : 0} per property)`);
  console.log(`Total Ratings: ${ratingsCount}`);
  console.log(`Total Price Comparisons: ${priceCompsCount}`);
  console.log(`Total Construction Projects: ${constructionCount}`);

  console.log('\n═══════════════════════════════════════════════════════════');

  if (allCriticalTablesHaveData) {
    console.log('✅ VERIFICATION PASSED - All critical tables have data!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('🚀 Ready to proceed with full production crawl!\n');
    process.exit(0);
  } else {
    console.log('❌ VERIFICATION FAILED - Some critical tables are empty!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('⚠️  DO NOT proceed with production crawl until issues are fixed.\n');
    process.exit(1);
  }
}

verifyDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
