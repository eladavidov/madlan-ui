/**
 * Test Script: Multiple Properties Scraping
 * Tests Approach A+B with 5 properties to verify consistency
 */

import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { extractPropertyData, extractImageUrls } from "./src/extractors/propertyExtractor.js";

// Enable stealth
chromium.use(StealthPlugin());

// TEST URLs (from recent search)
const PROPERTY_URLS = [
  "https://www.madlan.co.il/listings/YlFF2ZS2Z3q?dealType=sale&term=%D7%97%D7%99%D7%A4%D7%94-%D7%99%D7%A9%D7%A8%D7%90%D7%9C&tracking_search_source=new_search&tracking_event_source=list_regular_card&tracking_list_index=0",
  "https://www.madlan.co.il/listings/tGpm9tQFjt9?dealType=sale&term=%D7%97%D7%99%D7%A4%D7%94-%D7%99%D7%A9%D7%A8%D7%90%D7%9C&tracking_search_source=new_search&tracking_event_source=list_regular_card&tracking_list_index=1",
  "https://www.madlan.co.il/listings/LhkaBVY015d?dealType=sale&term=%D7%97%D7%99%D7%A4%D7%94-%D7%99%D7%A9%D7%A8%D7%90%D7%9C&tracking_search_source=new_search&tracking_event_source=list_regular_card&tracking_list_index=2",
  "https://www.madlan.co.il/listings/m42gywOhmzV?dealType=sale&term=%D7%97%D7%99%D7%A4%D7%94-%D7%99%D7%A9%D7%A8%D7%90%D7%9C&tracking_search_source=new_search&tracking_event_source=list_regular_card&tracking_list_index=3",
  "https://www.madlan.co.il/listings/1cUAV83GnCY?dealType=sale&term=%D7%97%D7%99%D7%A4%D7%94-%D7%99%D7%A9%D7%A8%D7%90%D7%9C&tracking_search_source=new_search&tracking_event_source=list_regular_card&tracking_list_index=4",
];

// Delays configuration
const CONFIG = {
  delayBetweenProperties: 30000,  // 30 seconds between properties (aggressive anti-blocking)
  initialDelay: 5000,             // 5s after page load
  beforeExtractionDelay: 3000,    // 3s before extraction
  humanReadingTime: 8000,         // 8s reading time
  headless: false,
};

interface TestResult {
  url: string;
  success: boolean;
  httpStatus?: number;
  propertyId?: string;
  price?: number;
  imageCount?: number;
  error?: string;
}

async function testMultipleProperties() {
  console.log("=" .repeat(70));
  console.log("🧪 TEST: Multiple Properties Scraping (5 properties)");
  console.log("=" .repeat(70));
  console.log(`\n📊 Testing ${PROPERTY_URLS.length} properties`);
  console.log(`⏱️  Delay between properties: ${CONFIG.delayBetweenProperties / 1000}s`);
  console.log(`🤖 Stealth: Enabled`);
  console.log(`👁️  Headless: ${CONFIG.headless}\n`);

  const results: TestResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Launch browser once and reuse (session continuity!)
  console.log("🚀 Launching browser with stealth plugin...");
  const browser = await chromium.launch({
    headless: CONFIG.headless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
    ],
    javaScriptEnabled: true,
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "he-IL",
    timezoneId: "Asia/Jerusalem",
  });

  const page = await context.newPage();

  try {
    for (let i = 0; i < PROPERTY_URLS.length; i++) {
      const url = PROPERTY_URLS[i];
      console.log("\n" + "=".repeat(70));
      console.log(`📍 Property ${i + 1}/${PROPERTY_URLS.length}: ${url}`);
      console.log("=".repeat(70));

      try {
        // Navigate
        console.log("🌐 Navigating...");
        const response = await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });

        const status = response?.status();
        console.log(`📡 HTTP Status: ${status}`);

        if (status === 403) {
          console.log("❌ BLOCKED: 403 Forbidden");
          results.push({ url, success: false, httpStatus: status, error: "403 Forbidden" });
          failureCount++;
          continue;
        }

        if (status !== 200) {
          console.log(`⚠️  Unexpected status: ${status}`);
          results.push({ url, success: false, httpStatus: status, error: `HTTP ${status}` });
          failureCount++;
          continue;
        }

        // Wait for content
        console.log("⏳ Waiting for content...");
        await page.waitForFunction(
          () => {
            const hasImages = document.querySelector('img') !== null;
            const hasPrice = document.body.textContent?.includes('₪') || false;
            const bodyLength = document.body.textContent?.length || 0;
            return bodyLength > 5000 || (hasImages && hasPrice);
          },
          { timeout: 15000 }
        );

        // Human behavior simulation
        console.log("🖱️  Simulating human behavior...");
        await page.waitForTimeout(CONFIG.initialDelay);
        await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
        await page.waitForTimeout(2000);
        await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }));
        await page.waitForTimeout(CONFIG.humanReadingTime);

        // Check for blocking
        const pageContent = await page.content();
        const hasCaptcha = pageContent.includes("Press & Hold") ||
                           pageContent.includes("סליחה על ההפרעה");

        if (hasCaptcha) {
          console.log("🛑 CAPTCHA detected");
          results.push({ url, success: false, httpStatus: status, error: "CAPTCHA" });
          failureCount++;
          continue;
        }

        await page.waitForTimeout(CONFIG.beforeExtractionDelay);

        // Extract data
        console.log("📊 Extracting data...");
        const propertyData = await extractPropertyData(page, url);

        if (!propertyData) {
          console.log("❌ Extraction failed");
          results.push({ url, success: false, httpStatus: status, error: "Extraction failed" });
          failureCount++;
          continue;
        }

        const imageUrls = await extractImageUrls(page);

        console.log("✅ Success!");
        console.log(`   ID: ${propertyData.id}`);
        console.log(`   Price: ₪${propertyData.price?.toLocaleString() || "N/A"}`);
        console.log(`   Rooms: ${propertyData.rooms || "N/A"}`);
        console.log(`   Images: ${imageUrls.length}`);

        results.push({
          url,
          success: true,
          httpStatus: status,
          propertyId: propertyData.id,
          price: propertyData.price,
          imageCount: imageUrls.length,
        });
        successCount++;

      } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
        results.push({
          url,
          success: false,
          error: error.message,
        });
        failureCount++;
      }

      // Delay between properties (except after last one)
      if (i < PROPERTY_URLS.length - 1) {
        console.log(`\n⏱️  Waiting ${CONFIG.delayBetweenProperties / 1000}s before next property...`);
        await page.waitForTimeout(CONFIG.delayBetweenProperties);
      }
    }

  } finally {
    console.log("\n🔒 Closing browser...");
    await browser.close();
  }

  // Print summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(70));
  console.log(`Total Properties: ${PROPERTY_URLS.length}`);
  console.log(`✅ Successful: ${successCount} (${Math.round(successCount / PROPERTY_URLS.length * 100)}%)`);
  console.log(`❌ Failed: ${failureCount} (${Math.round(failureCount / PROPERTY_URLS.length * 100)}%)`);
  console.log("\nResults:");
  results.forEach((r, i) => {
    const status = r.success ? "✅" : "❌";
    const details = r.success
      ? `ID: ${r.propertyId}, Price: ₪${r.price?.toLocaleString()}, Images: ${r.imageCount}`
      : `Error: ${r.error}`;
    console.log(`  ${i + 1}. ${status} ${details}`);
  });
  console.log("=".repeat(70));

  if (successCount === PROPERTY_URLS.length) {
    console.log("\n🎉 ALL TESTS PASSED! Ready for integration.");
  } else if (successCount >= PROPERTY_URLS.length * 0.8) {
    console.log("\n⚠️  Most tests passed. Review failures.");
  } else {
    console.log("\n❌ Too many failures. Need to adjust approach.");
  }

  return {
    total: PROPERTY_URLS.length,
    successful: successCount,
    failed: failureCount,
    successRate: successCount / PROPERTY_URLS.length,
  };
}

// Run test
testMultipleProperties()
  .then((summary) => {
    if (summary.successRate >= 0.8) {
      console.log("\n✅ Test suite passed!");
      process.exit(0);
    } else {
      console.log("\n❌ Test suite failed!");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n💥 Unexpected error:", error);
    process.exit(1);
  });
