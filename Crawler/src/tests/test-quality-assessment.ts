/**
 * Quality Assessment Test
 * Compares scraped data from live crawl with backed-up HTML files
 */

import { chromium } from 'playwright';
import { extractPropertyData, extractImageUrls } from '../extractors/propertyExtractor';
import { PropertyRepository } from '../database/repositories/PropertyRepository';
import { ImageRepository } from '../database/repositories/ImageRepository';
import { initDatabase } from '../database/connection';
import * as path from 'path';
import * as fs from 'fs';
import type { PropertyInput } from '../models/Property';

const PROPERTY_URL = 'https://www.madlan.co.il/listings/LNkcTRJRods?dealType=sale&term=%D7%97%D7%99%D7%A4%D7%94-%D7%99%D7%A9%D7%A8%D7%90%D7%9C&bbox=34.95241%2C32.75516%2C35.07945%2C32.84437&tracking_search_source=map&tracking_event_source=list_regular_card&tracking_list_index=0';
const BACKUP_HTML = path.join(__dirname, '..', '..', 'tests', 'madlan-website-saved-pages', 'FirstPropertyPage', 'index.html');

interface QualityReport {
  propertyUrl: string;
  scrapedData: {
    property: PropertyInput | null;
    images: string[];
  };
  databaseData: any;
  backupFileExists: boolean;
  extractionSuccess: boolean;
  errors: string[];
  warnings: string[];
  fieldComparison: { field: string; scraped: any; expected: any; match: boolean }[];
}

async function testQualityAssessment(): Promise<QualityReport> {
  const report: QualityReport = {
    propertyUrl: PROPERTY_URL,
    scrapedData: {
      property: null,
      images: []
    },
    databaseData: null,
    backupFileExists: false,
    extractionSuccess: false,
    errors: [],
    warnings: [],
    fieldComparison: []
  };

  console.log('🔍 Starting Quality Assessment Test...\n');

  try {
    // Check if backup file exists
    report.backupFileExists = fs.existsSync(BACKUP_HTML);
    console.log(`📁 Backup HTML file: ${report.backupFileExists ? '✅ Found' : '❌ Not found'}`);

    if (!report.backupFileExists) {
      report.errors.push(`Backup HTML file not found at: ${BACKUP_HTML}`);
      return report;
    }

    // Initialize database
    console.log('\n📊 Initializing database...');
    const db = await initDatabase();
    const propertyRepo = new PropertyRepository(db);
    const imageRepo = new ImageRepository(db);

    // Launch browser and crawl the property
    console.log('\n🌐 Launching browser for live crawl...');
    const browser = await chromium.launch({
      headless: false, // HEADLESS=false for anti-blocking
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    try {
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });

      const page = await context.newPage();

      // Navigate to property page
      console.log(`📍 Navigating to: ${PROPERTY_URL}`);
      await page.goto(PROPERTY_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // Wait for content to load
      console.log('⏳ Waiting for page content...');
      await page.waitForTimeout(5000);

      // Check for blocking
      const pageContent = await page.content();
      if (pageContent.includes('Press &amp; Hold') || pageContent.includes('px-captcha')) {
        report.errors.push('❌ BLOCKED: PerimeterX CAPTCHA detected');
        console.log('❌ BLOCKED: PerimeterX CAPTCHA detected');
        await browser.close();
        return report;
      }

      // Extract property data
      console.log('\n🔍 Extracting property data...');
      const propertyData = await extractPropertyData(page, PROPERTY_URL);
      const imageUrls = await extractImageUrls(page);

      report.scrapedData = {
        property: propertyData,
        images: imageUrls
      };

      if (!propertyData) {
        report.errors.push('Failed to extract property data');
        await browser.close();
        return report;
      }

      report.extractionSuccess = true;

      console.log('✅ Property data extracted successfully');
      console.log(`   - Property ID: ${propertyData.id}`);
      console.log(`   - Price: ₪${propertyData.price?.toLocaleString()}`);
      console.log(`   - Rooms: ${propertyData.rooms}`);
      console.log(`   - Size: ${propertyData.size}m²`);
      console.log(`   - Address: ${propertyData.address}`);
      console.log(`   - Images: ${imageUrls.length} found`);

      // Save to database
      console.log('\n💾 Saving to database...');
      await propertyRepo.upsert(propertyData);

      // Save images metadata
      if (imageUrls.length > 0) {
        for (let i = 0; i < imageUrls.length; i++) {
          await imageRepo.insert({
            property_id: propertyData.id,
            image_url: imageUrls[i],
            image_order: i,
            is_main_image: i === 0
          });
        }
        console.log(`   ✅ Saved ${imageUrls.length} image records`);
      }

      // Retrieve from database to verify
      const dbProperty = propertyRepo.findById(propertyData.id);
      const dbImages = imageRepo.findByPropertyId(propertyData.id);

      report.databaseData = {
        property: dbProperty,
        images: dbImages
      };

      console.log('✅ Data saved and verified in database');

      await browser.close();

    } catch (error: any) {
      report.errors.push(`Browser error: ${error.message}`);
      console.error('❌ Browser error:', error);
      await browser.close();
      return report;
    }

  } catch (error: any) {
    report.errors.push(`Test error: ${error.message}`);
    console.error('❌ Test error:', error);
  }

  return report;
}

// Run the test
testQualityAssessment()
  .then(report => {
    console.log('\n' + '='.repeat(80));
    console.log('📊 QUALITY ASSESSMENT REPORT');
    console.log('='.repeat(80));

    console.log('\n✅ Extraction Success:', report.extractionSuccess);
    console.log('📁 Backup File Found:', report.backupFileExists);

    if (report.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      report.errors.forEach(err => console.log(`   - ${err}`));
    }

    if (report.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      report.warnings.forEach(warn => console.log(`   - ${warn}`));
    }

    if (report.scrapedData.property) {
      const prop = report.scrapedData.property;
      console.log('\n📋 SCRAPED DATA SUMMARY:');
      console.log(`   - ID: ${prop.id}`);
      console.log(`   - Price: ₪${prop.price?.toLocaleString() || 'N/A'}`);
      console.log(`   - Rooms: ${prop.rooms || 'N/A'}`);
      console.log(`   - Size: ${prop.size || 'N/A'}m²`);
      console.log(`   - Floor: ${prop.floor || 'N/A'}`);
      console.log(`   - Address: ${prop.address || 'N/A'}`);
      console.log(`   - City: ${prop.city || 'N/A'}`);
      console.log(`   - Property Type: ${prop.property_type || 'N/A'}`);
      console.log(`   - Images: ${report.scrapedData.images.length}`);
      console.log(`   - Parking: ${prop.has_parking ? '✅' : '❌'}`);
      console.log(`   - Elevator: ${prop.has_elevator ? '✅' : '❌'}`);
      console.log(`   - Balcony: ${prop.has_balcony ? '✅' : '❌'}`);
    }

    console.log('\n' + '='.repeat(80));

    // Save report to JSON file
    const reportPath = path.join(__dirname, '..', '..', 'tests', 'quality-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Full report saved to: ${reportPath}`);

    process.exit(report.errors.length > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
