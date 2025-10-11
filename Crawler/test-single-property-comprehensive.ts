/**
 * Comprehensive test for extracting ALL data from a single property page
 * Property: https://www.madlan.co.il/listings/5BzpHqFwgd7
 */

import { chromium } from 'playwright';
import { extractTransactionHistory } from './src/extractors/transactionExtractor.js';
import { extractNearbySchools } from './src/extractors/schoolsExtractor.js';
import { extractNeighborhoodRatings } from './src/extractors/ratingsExtractor.js';
import { extractPriceComparisons } from './src/extractors/priceComparisonExtractor.js';
import { extractConstructionProjects } from './src/extractors/constructionExtractor.js';

const PROPERTY_URL = 'https://www.madlan.co.il/listings/5BzpHqFwgd7';
const PROPERTY_ID = '5BzpHqFwgd7';

async function testPropertyExtraction() {
  console.log('=== Starting Comprehensive Property Extraction Test ===\n');
  console.log(`Property URL: ${PROPERTY_URL}`);
  console.log(`Property ID: ${PROPERTY_ID}\n`);

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'he-IL',
  });

  const page = await context.newPage();

  try {
    // Navigate to property page
    console.log('Navigating to property page...');
    await page.goto(PROPERTY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('✓ Page loaded\n');

    // Wait for main content
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('✓ Main content visible');
    await page.waitForTimeout(5000); // Let all data load
    console.log('✓ Wait complete\n');

    console.log('=== EXTRACTION RESULTS ===\n');

    // 1. Extract Transaction History
    console.log('1. Testing Transaction History Extraction...');
    try {
      const transactions = await extractTransactionHistory(page, PROPERTY_ID);
      console.log(`   ✓ Found ${transactions.length} transactions`);
      if (transactions.length > 0) {
        console.log(`   Sample:`, JSON.stringify(transactions[0], null, 2));
      }
    } catch (error: any) {
      console.error(`   ✗ ERROR:`, error.message);
    }
    console.log('');

    // 2. Extract Schools
    console.log('2. Testing Schools Extraction...');
    try {
      const schools = await extractNearbySchools(page, PROPERTY_ID);
      console.log(`   ✓ Found ${schools.length} schools`);
      if (schools.length > 0) {
        console.log(`   Sample:`, JSON.stringify(schools[0], null, 2));
      }
    } catch (error: any) {
      console.error(`   ✗ ERROR:`, error.message);
    }
    console.log('');

    // 3. Extract Neighborhood Ratings
    console.log('3. Testing Neighborhood Ratings Extraction...');
    try {
      const ratings = await extractNeighborhoodRatings(page, PROPERTY_ID);
      console.log(`   ✓ Ratings extracted:`, JSON.stringify(ratings, null, 2));
    } catch (error: any) {
      console.error(`   ✗ ERROR:`, error.message);
    }
    console.log('');

    // 4. Extract Price Comparisons
    console.log('4. Testing Price Comparisons Extraction...');
    try {
      const priceComps = await extractPriceComparisons(page, PROPERTY_ID);
      console.log(`   ✓ Found ${priceComps.length} price comparisons`);
      if (priceComps.length > 0) {
        console.log(`   Sample:`, JSON.stringify(priceComps[0], null, 2));
      }
    } catch (error: any) {
      console.error(`   ✗ ERROR:`, error.message);
    }
    console.log('');

    // 5. Extract Construction Projects
    console.log('5. Testing Construction Projects Extraction...');
    try {
      const projects = await extractConstructionProjects(page, PROPERTY_ID);
      console.log(`   ✓ Found ${projects.length} construction projects`);
      if (projects.length > 0) {
        console.log(`   Sample:`, JSON.stringify(projects[0], null, 2));
      }
    } catch (error: any) {
      console.error(`   ✗ ERROR:`, error.message);
    }
    console.log('');

    // 6. Extract additional visible data for reference
    console.log('6. Extracting Additional Visible Data...');
    const additionalData = await page.evaluate(() => {
      const results: any = {};

      // Price per sqm
      const pricePerSqmElements = Array.from(document.querySelectorAll('*')).filter(
        el => el.textContent?.includes('מחיר למ״ר')
      );
      if (pricePerSqmElements.length > 0) {
        results.price_per_sqm_visible = pricePerSqmElements[0].textContent?.trim();
      }

      // Yield
      const yieldElements = Array.from(document.querySelectorAll('*')).filter(
        el => el.textContent?.includes('תשואה')
      );
      if (yieldElements.length > 0) {
        results.yield_visible = yieldElements[0].textContent?.trim();
      }

      // Transportation text
      const transportHeadings = Array.from(document.querySelectorAll('h3, h2')).filter(
        el => el.textContent?.includes('תחנת הרכבת')
      );
      if (transportHeadings.length > 0) {
        results.transportation_text = transportHeadings[0].textContent?.trim();
      }

      // Life in neighborhood text
      const lifeHeadings = Array.from(document.querySelectorAll('h3, h2')).filter(
        el => el.textContent?.includes('לא חייבים להזיז את האוטו')
      );
      if (lifeHeadings.length > 0) {
        results.life_in_neighborhood = lifeHeadings[0].textContent?.trim();
      }

      return results;
    });
    console.log(`   ✓ Additional data:`, JSON.stringify(additionalData, null, 2));
    console.log('');

    console.log('=== TEST COMPLETED ===');
    console.log('\nKeeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error: any) {
    console.error('FATAL ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
}

// Run the test
testPropertyExtraction().catch(console.error);
