/**
 * Test extractors on 3 different properties to verify consistency
 */

import { chromium } from 'playwright';
import { extractTransactionHistory } from './src/extractors/transactionExtractor.js';
import { extractNearbySchools } from './src/extractors/schoolsExtractor.js';
import { extractNeighborhoodRatings } from './src/extractors/ratingsExtractor.js';
import { extractPriceComparisons } from './src/extractors/priceComparisonExtractor.js';
import { extractConstructionProjects } from './src/extractors/constructionExtractor.js';

// 3 test properties from Haifa
const TEST_PROPERTIES = [
  { url: 'https://www.madlan.co.il/listings/5BzpHqFwgd7', id: '5BzpHqFwgd7', name: 'Wadi Nisnas' },
  { url: 'https://www.madlan.co.il/listings/p3ZgCFFJd27', id: 'p3ZgCFFJd27', name: 'German Colony' },
  { url: 'https://www.madlan.co.il/listings/fJvWN2CjDa7', id: 'fJvWN2CjDa7', name: 'Carmel Center' },
];

interface TestResult {
  propertyId: string;
  propertyName: string;
  transactions: number;
  schools: number;
  hasRatings: boolean;
  priceComparisons: number;
  construction: number;
  error?: string;
}

async function testProperty(url: string, id: string, name: string): Promise<TestResult> {
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
    console.log(`\n>>> Testing: ${name} (${id})`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(5000);

    // Run all extractors
    const transactions = await extractTransactionHistory(page, id);
    const schools = await extractNearbySchools(page, id);
    const ratings = await extractNeighborhoodRatings(page, id);
    const priceComps = await extractPriceComparisons(page, id);
    const construction = await extractConstructionProjects(page, id);

    return {
      propertyId: id,
      propertyName: name,
      transactions: transactions.length,
      schools: schools.length,
      hasRatings: ratings !== null && Object.keys(ratings).length > 1,
      priceComparisons: priceComps.length,
      construction: construction.length,
    };
  } catch (error: any) {
    return {
      propertyId: id,
      propertyName: name,
      transactions: 0,
      schools: 0,
      hasRatings: false,
      priceComparisons: 0,
      construction: 0,
      error: error.message,
    };
  } finally {
    await browser.close();
  }
}

async function runTests() {
  console.log('=== Testing Phase 5B Extractors on 3 Properties ===\n');

  const results: TestResult[] = [];

  for (const property of TEST_PROPERTIES) {
    const result = await testProperty(property.url, property.id, property.name);
    results.push(result);

    // Brief pause between properties
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Print summary
  console.log('\n\n=== TEST RESULTS SUMMARY ===\n');
  console.log('Property                | Trans | Schools | Ratings | Prices | Construct | Status');
  console.log('------------------------|-------|---------|---------|--------|-----------|--------');

  for (const result of results) {
    const status = result.error ? 'ERROR' : 'OK';
    const ratings = result.hasRatings ? 'YES' : 'NO';
    console.log(
      `${result.propertyName.padEnd(23)} | ${String(result.transactions).padStart(5)} | ` +
      `${String(result.schools).padStart(7)} | ${ratings.padStart(7)} | ` +
      `${String(result.priceComparisons).padStart(6)} | ${String(result.construction).padStart(9)} | ${status}`
    );
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  }

  // Calculate totals
  const totals = results.reduce((acc, r) => ({
    transactions: acc.transactions + r.transactions,
    schools: acc.schools + r.schools,
    ratings: acc.ratings + (r.hasRatings ? 1 : 0),
    priceComps: acc.priceComps + r.priceComparisons,
    construction: acc.construction + r.construction,
  }), { transactions: 0, schools: 0, ratings: 0, priceComps: 0, construction: 0 });

  console.log('\n=== TOTALS ===');
  console.log(`Transactions: ${totals.transactions}`);
  console.log(`Schools: ${totals.schools}`);
  console.log(`Properties with Ratings: ${totals.ratings}/3`);
  console.log(`Price Comparisons: ${totals.priceComps}`);
  console.log(`Construction Projects: ${totals.construction}`);

  const successCount = results.filter(r => !r.error).length;
  console.log(`\nSuccess Rate: ${successCount}/3 properties`);
}

// Run tests
runTests().catch(console.error);
