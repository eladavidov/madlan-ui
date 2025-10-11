/**
 * Production test: Extract data from 3 properties with proper delays
 * Uses production-ready delays (60-120s) to avoid blocking
 */

import { chromium } from 'playwright';
import { extractTransactionHistory } from './src/extractors/transactionExtractor.js';
import { extractNearbySchools } from './src/extractors/schoolsExtractor.js';
import { extractNeighborhoodRatings } from './src/extractors/ratingsExtractor.js';
import { extractPriceComparisons } from './src/extractors/priceComparisonExtractor.js';
import { extractConstructionProjects } from './src/extractors/constructionExtractor.js';
import { getConnectionManager } from './src/database/connectionManager.js';
import { PropertyRepository } from './src/database/repositories/PropertyRepository.js';
import { TransactionHistoryRepository } from './src/database/repositories/TransactionHistoryRepository.js';
import { SchoolsRepository } from './src/database/repositories/SchoolsRepository.js';
import { RatingsRepository } from './src/database/repositories/RatingsRepository.js';
import { PriceComparisonRepository } from './src/database/repositories/PriceComparisonRepository.js';
import { ConstructionProjectsRepository } from './src/database/repositories/ConstructionProjectsRepository.js';

// 3 test properties from Haifa - ONLY property 1 to avoid blocking
const TEST_PROPERTIES = [
  { url: 'https://www.madlan.co.il/listings/5BzpHqFwgd7', id: '5BzpHqFwgd7', name: 'Wadi Nisnas' },
];

interface TestResult {
  propertyId: string;
  propertyName: string;
  saved: boolean;
  transactions: number;
  schools: number;
  hasRatings: boolean;
  priceComparisons: number;
  construction: number;
  error?: string;
}

async function testProperty(url: string, id: string, name: string): Promise<TestResult> {
  console.log(`\n>>> Testing: ${name} (${id})`);
  console.log(`Opening browser...`);

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'he-IL',
  });

  const page = await context.newPage();

  try {
    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(5000);
    console.log(`✓ Page loaded successfully`);

    // Extract all data
    console.log(`Extracting data...`);
    const transactions = await extractTransactionHistory(page, id);
    const schools = await extractNearbySchools(page, id);
    const ratings = await extractNeighborhoodRatings(page, id);
    const priceComps = await extractPriceComparisons(page, id);
    const construction = await extractConstructionProjects(page, id);

    console.log(`✓ Extraction complete`);
    console.log(`  - Transactions: ${transactions.length}`);
    console.log(`  - Schools: ${schools.length}`);
    console.log(`  - Ratings: ${ratings ? 'Yes' : 'No'}`);
    console.log(`  - Price Comparisons: ${priceComps.length}`);
    console.log(`  - Construction: ${construction.length}`);

    // Save to database
    console.log(`Saving to database...`);
    const db = getConnectionManager();

    // Save basic property info (minimal for testing)
    const propertyRepo = new PropertyRepository(db);
    await propertyRepo.upsert({
      property_id: id,
      property_type: 'דירה',
      entry_date: new Date().toISOString().split('T')[0],
      price: 1700000,
      rooms: 3,
      size: 120,
      address: 'וואדי 10',
      neighborhood: 'ואדי ניסנאס',
      city: 'חיפה',
    });

    // Save Phase 5B data
    if (transactions.length > 0) {
      const transRepo = new TransactionHistoryRepository(db);
      for (const trans of transactions) {
        await transRepo.insert(trans);
      }
    }

    if (schools.length > 0) {
      const schoolsRepo = new SchoolsRepository(db);
      for (const school of schools) {
        await schoolsRepo.insert(school);
      }
    }

    if (ratings) {
      const ratingsRepo = new RatingsRepository(db);
      await ratingsRepo.upsert(ratings);
    }

    if (priceComps.length > 0) {
      const priceRepo = new PriceComparisonRepository(db);
      for (const price of priceComps) {
        await priceRepo.insert(price);
      }
    }

    if (construction.length > 0) {
      const constRepo = new ConstructionProjectsRepository(db);
      for (const proj of construction) {
        await constRepo.insert(proj);
      }
    }

    console.log(`✓ Data saved to database`);

    return {
      propertyId: id,
      propertyName: name,
      saved: true,
      transactions: transactions.length,
      schools: schools.length,
      hasRatings: ratings !== null && Object.keys(ratings).length > 1,
      priceComparisons: priceComps.length,
      construction: construction.length,
    };
  } catch (error: any) {
    console.error(`✗ ERROR: ${error.message}`);
    return {
      propertyId: id,
      propertyName: name,
      saved: false,
      transactions: 0,
      schools: 0,
      hasRatings: false,
      priceComparisons: 0,
      construction: 0,
      error: error.message,
    };
  } finally {
    await browser.close();
    console.log(`Browser closed`);
  }
}

async function runTests() {
  console.log('=== Production Test: 3 Properties with Database Storage ===\n');

  const results: TestResult[] = [];

  for (let i = 0; i < TEST_PROPERTIES.length; i++) {
    const property = TEST_PROPERTIES[i];
    const result = await testProperty(property.url, property.id, property.name);
    results.push(result);

    // Wait 60-120 seconds between properties (production delays)
    if (i < TEST_PROPERTIES.length - 1) {
      const delay = Math.floor(Math.random() * (120000 - 60000 + 1)) + 60000;
      console.log(`\nWaiting ${Math.round(delay/1000)} seconds before next property...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Print summary
  console.log('\n\n=== TEST RESULTS SUMMARY ===\n');
  console.log('Property                | Saved | Trans | Schools | Ratings | Prices | Construct');
  console.log('------------------------|-------|-------|---------|---------|--------|----------');

  for (const result of results) {
    const saved = result.saved ? '✓' : '✗';
    const ratings = result.hasRatings ? 'YES' : 'NO';
    console.log(
      `${result.propertyName.padEnd(23)} | ${saved.padStart(5)} | ` +
      `${String(result.transactions).padStart(5)} | ${String(result.schools).padStart(7)} | ` +
      `${ratings.padStart(7)} | ${String(result.priceComparisons).padStart(6)} | ${String(result.construction).padStart(9)}`
    );
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  }

  // Calculate totals
  const totals = results.reduce((acc, r) => ({
    saved: acc.saved + (r.saved ? 1 : 0),
    transactions: acc.transactions + r.transactions,
    schools: acc.schools + r.schools,
    ratings: acc.ratings + (r.hasRatings ? 1 : 0),
    priceComps: acc.priceComps + r.priceComparisons,
    construction: acc.construction + r.construction,
  }), { saved: 0, transactions: 0, schools: 0, ratings: 0, priceComps: 0, construction: 0 });

  console.log('\n=== TOTALS ===');
  console.log(`Properties Saved: ${totals.saved}/${TEST_PROPERTIES.length}`);
  console.log(`Transactions: ${totals.transactions}`);
  console.log(`Schools: ${totals.schools}`);
  console.log(`Properties with Ratings: ${totals.ratings}`);
  console.log(`Price Comparisons: ${totals.priceComps}`);
  console.log(`Construction Projects: ${totals.construction}`);

  console.log(`\n✓ Test complete! Check database with: npx tsx src/scripts/check-table-counts.ts`);
}

// Run tests
runTests().catch(console.error);
