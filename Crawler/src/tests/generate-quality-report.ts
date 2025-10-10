/**
 * Generate Quality Assessment Report
 * Compares database data with backed-up HTML files
 */

import { initDatabase } from '../database/connection.js';
import { PropertyRepository } from '../database/repositories/PropertyRepository.js';
import { ImageRepository } from '../database/repositories/ImageRepository.js';
import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { extractPropertyData, extractImageUrls } from '../extractors/propertyExtractor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROPERTY_ID = 'LNkcTRJRods';
const BACKUP_HTML_PATH = path.join(__dirname, '..', '..', 'tests', 'madlan-website-saved-pages', 'FirstPropertyPage', 'index.html');
const REPORT_OUTPUT_PATH = path.join(__dirname, '..', '..', 'tests', 'quality-assessment-report.html');

interface FieldComparison {
  field: string;
  dbValue: any;
  htmlValue: any;
  match: boolean;
  severity: 'ok' | 'warning' | 'error';
  notes?: string;
}

async function generateQualityReport() {
  console.log('📊 Generating Quality Assessment Report...\n');

  // Initialize database
  console.log('📂 Loading database...');
  const db = await initDatabase();
  const propertyRepo = new PropertyRepository(db);
  const imageRepo = new ImageRepository(db);

  // Get all properties from database
  const allProperties = propertyRepo.findAll();
  console.log(`   ✅ Found ${allProperties.length} properties in database\n`);

  // Get database schema
  const schemaInfo = db.query(`
    SELECT name, sql
    FROM sqlite_master
    WHERE type='table' AND name IN ('properties', 'property_images', 'crawl_sessions', 'crawl_errors')
    ORDER BY name
  `);

  // Get specific property for detailed comparison
  const targetProperty = propertyRepo.findById(PROPERTY_ID);
  const targetImages = targetProperty ? imageRepo.findByPropertyId(PROPERTY_ID) : [];

  // Extract data from backed-up HTML file
  console.log('📄 Extracting data from backed-up HTML file...');
  let htmlExtractedData: any = null;
  let htmlExtractedImages: string[] = [];

  if (fs.existsSync(BACKUP_HTML_PATH)) {
    try {
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      // Load the local HTML file
      const fileUrl = `file:///${BACKUP_HTML_PATH.replace(/\\/g, '/')}`;
      await page.goto(fileUrl);
      await page.waitForTimeout(2000);

      // Extract data using our extractors
      const fakeUrl = `https://www.madlan.co.il/listings/${PROPERTY_ID}`;
      htmlExtractedData = await extractPropertyData(page, fakeUrl);
      htmlExtractedImages = await extractImageUrls(page);

      console.log(`   ✅ Extracted data from HTML file`);
      console.log(`      - Price: ₪${htmlExtractedData?.price?.toLocaleString()}`);
      console.log(`      - Rooms: ${htmlExtractedData?.rooms}`);
      console.log(`      - Size: ${htmlExtractedData?.size}m²`);
      console.log(`      - Images: ${htmlExtractedImages.length}`);

      await browser.close();
    } catch (error: any) {
      console.error(`   ❌ Error extracting from HTML: ${error.message}`);
    }
  } else {
    console.log(`   ⚠️ Backup HTML file not found at: ${BACKUP_HTML_PATH}`);
  }

  // Compare data
  const comparisons: FieldComparison[] = [];

  if (targetProperty && htmlExtractedData) {
    console.log('\n🔍 Comparing database vs HTML data...\n');

    const fieldsToCompare = [
      'price', 'rooms', 'size', 'floor', 'address', 'neighborhood', 'city',
      'property_type', 'has_parking', 'has_elevator', 'has_balcony',
      'has_air_conditioning', 'has_security_door', 'has_bars', 'has_storage',
      'has_shelter', 'is_accessible', 'is_renovated', 'is_furnished'
    ];

    for (const field of fieldsToCompare) {
      const dbVal = (targetProperty as any)[field];
      const htmlVal = (htmlExtractedData as any)[field];

      const match = dbVal === htmlVal ||
                    (dbVal == null && htmlVal == null) ||
                    (typeof dbVal === 'boolean' && typeof htmlVal === 'boolean' && dbVal === htmlVal);

      let severity: 'ok' | 'warning' | 'error' = match ? 'ok' : 'warning';

      // Critical fields
      if (['price', 'rooms', 'size', 'address'].includes(field) && !match) {
        severity = 'error';
      }

      comparisons.push({
        field,
        dbValue: dbVal,
        htmlValue: htmlVal,
        match,
        severity,
        notes: match ? undefined : 'Values differ'
      });
    }

    // Compare images
    comparisons.push({
      field: 'image_count',
      dbValue: targetImages.length,
      htmlValue: htmlExtractedImages.length,
      match: targetImages.length === htmlExtractedImages.length,
      severity: targetImages.length === htmlExtractedImages.length ? 'ok' : 'warning',
      notes: targetImages.length !== htmlExtractedImages.length ? 'Image count differs' : undefined
    });
  }

  // Generate HTML report
  console.log('\n📝 Generating HTML report...');
  const reportHtml = generateHtmlReport({
    generatedAt: new Date().toISOString(),
    databaseStats: {
      totalProperties: allProperties.length,
      properties: allProperties.slice(0, 10), // First 10 for summary
      schema: schemaInfo
    },
    targetProperty: {
      database: targetProperty,
      html: htmlExtractedData,
      images: {
        database: targetImages,
        html: htmlExtractedImages
      },
      comparisons
    }
  });

  fs.writeFileSync(REPORT_OUTPUT_PATH, reportHtml);
  console.log(`\n✅ Report generated successfully!`);
  console.log(`   📄 Location: ${REPORT_OUTPUT_PATH}`);
  console.log(`\n🌐 Open the report in your browser to view the results.`);

  db.close();
}

function generateHtmlReport(data: any): string {
  const { generatedAt, databaseStats, targetProperty } = data;
  const { comparisons } = targetProperty;

  const errorCount = comparisons.filter((c: FieldComparison) => c.severity === 'error').length;
  const warningCount = comparisons.filter((c: FieldComparison) => c.severity === 'warning').length;
  const okCount = comparisons.filter((c: FieldComparison) => c.severity === 'ok').length;

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Madlan Crawler - Quality Assessment Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      direction: rtl;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { font-size: 1.1em; opacity: 0.9; }
    .section {
      padding: 30px;
      border-bottom: 1px solid #e0e0e0;
    }
    .section:last-child { border-bottom: none; }
    .section h2 {
      font-size: 1.8em;
      margin-bottom: 20px;
      color: #333;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-right: 4px solid #667eea;
    }
    .stat-card h3 {
      font-size: 2em;
      color: #667eea;
      margin-bottom: 5px;
    }
    .stat-card p {
      color: #666;
      font-size: 0.95em;
    }
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 0.95em;
    }
    .comparison-table th {
      background: #667eea;
      color: white;
      padding: 12px;
      text-align: right;
      font-weight: 600;
    }
    .comparison-table td {
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
      text-align: right;
    }
    .comparison-table tr:nth-child(even) {
      background: #f8f9fa;
    }
    .status-ok { color: #28a745; font-weight: bold; }
    .status-warning { color: #ffc107; font-weight: bold; }
    .status-error { color: #dc3545; font-weight: bold; }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 600;
    }
    .badge-ok { background: #d4edda; color: #155724; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-error { background: #f8d7da; color: #721c24; }
    .code-block {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 15px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      overflow-x: auto;
      margin: 15px 0;
      direction: ltr;
      text-align: left;
    }
    .property-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .property-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      border-right: 3px solid #667eea;
    }
    .property-card h4 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 1.1em;
    }
    .property-card .field {
      margin: 8px 0;
      font-size: 0.9em;
    }
    .property-card .field strong {
      color: #666;
      min-width: 120px;
      display: inline-block;
    }
    .schema-box {
      background: #2d2d2d;
      color: #f8f8f2;
      border-radius: 6px;
      padding: 20px;
      font-family: 'Courier New', monospace;
      font-size: 0.85em;
      overflow-x: auto;
      margin: 15px 0;
      direction: ltr;
      text-align: left;
    }
    .summary-banner {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
    }
    .summary-banner h3 {
      font-size: 1.5em;
      margin-bottom: 15px;
    }
    .summary-stats {
      display: flex;
      justify-content: center;
      gap: 40px;
      flex-wrap: wrap;
    }
    .summary-stat {
      text-align: center;
    }
    .summary-stat-value {
      font-size: 2.5em;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .summary-stat-label {
      font-size: 0.9em;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 Madlan Crawler - Quality Assessment Report</h1>
      <p>Generated: ${new Date(generatedAt).toLocaleString('he-IL')}</p>
    </div>

    <div class="section">
      <h2>📊 Database Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <h3>${databaseStats.totalProperties}</h3>
          <p>Total Properties in Database</p>
        </div>
        <div class="stat-card">
          <h3>${targetProperty.images.database.length}</h3>
          <p>Images for Target Property</p>
        </div>
        <div class="stat-card">
          <h3>${databaseStats.schema.length}</h3>
          <p>Database Tables</p>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>🎯 Comparison Summary</h2>
      <div class="summary-banner">
        <h3>Data Quality Assessment</h3>
        <div class="summary-stats">
          <div class="summary-stat">
            <div class="summary-stat-value">${okCount}</div>
            <div class="summary-stat-label">✅ Matching Fields</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-value">${warningCount}</div>
            <div class="summary-stat-label">⚠️ Warnings</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-value">${errorCount}</div>
            <div class="summary-stat-label">❌ Errors</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>🔍 Detailed Field Comparison (Property ID: ${PROPERTY_ID})</h2>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>שדה</th>
            <th>ערך במסד הנתונים</th>
            <th>ערך ב-HTML</th>
            <th>סטטוס</th>
            <th>הערות</th>
          </tr>
        </thead>
        <tbody>
          ${comparisons.map((comp: FieldComparison) => `
            <tr>
              <td><strong>${comp.field}</strong></td>
              <td>${formatValue(comp.dbValue)}</td>
              <td>${formatValue(comp.htmlValue)}</td>
              <td>
                <span class="badge badge-${comp.severity}">
                  ${comp.severity === 'ok' ? '✅ תואם' : comp.severity === 'warning' ? '⚠️ אזהרה' : '❌ שגיאה'}
                </span>
              </td>
              <td>${comp.notes || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>🏠 Property Details</h2>
      <div class="property-grid">
        <div class="property-card">
          <h4>📊 Database Data</h4>
          ${targetProperty.database ? `
            <div class="field"><strong>מחיר:</strong> ₪${targetProperty.database.price?.toLocaleString() || 'N/A'}</div>
            <div class="field"><strong>חדרים:</strong> ${targetProperty.database.rooms || 'N/A'}</div>
            <div class="field"><strong>מ"ר:</strong> ${targetProperty.database.size || 'N/A'}</div>
            <div class="field"><strong>קומה:</strong> ${targetProperty.database.floor || 'N/A'}</div>
            <div class="field"><strong>כתובת:</strong> ${targetProperty.database.address || 'N/A'}</div>
            <div class="field"><strong>שכונה:</strong> ${targetProperty.database.neighborhood || 'N/A'}</div>
            <div class="field"><strong>עיר:</strong> ${targetProperty.database.city || 'N/A'}</div>
            <div class="field"><strong>סוג נכס:</strong> ${targetProperty.database.property_type || 'N/A'}</div>
            <div class="field"><strong>חניה:</strong> ${targetProperty.database.has_parking ? '✅ כן' : '❌ לא'}</div>
            <div class="field"><strong>מעלית:</strong> ${targetProperty.database.has_elevator ? '✅ כן' : '❌ לא'}</div>
            <div class="field"><strong>מרפסת:</strong> ${targetProperty.database.has_balcony ? '✅ כן' : '❌ לא'}</div>
          ` : '<p>No data found in database</p>'}
        </div>

        <div class="property-card">
          <h4>📄 HTML Extracted Data</h4>
          ${targetProperty.html ? `
            <div class="field"><strong>מחיר:</strong> ₪${targetProperty.html.price?.toLocaleString() || 'N/A'}</div>
            <div class="field"><strong>חדרים:</strong> ${targetProperty.html.rooms || 'N/A'}</div>
            <div class="field"><strong>מ"ר:</strong> ${targetProperty.html.size || 'N/A'}</div>
            <div class="field"><strong>קומה:</strong> ${targetProperty.html.floor || 'N/A'}</div>
            <div class="field"><strong>כתובת:</strong> ${targetProperty.html.address || 'N/A'}</div>
            <div class="field"><strong>שכונה:</strong> ${targetProperty.html.neighborhood || 'N/A'}</div>
            <div class="field"><strong>עיר:</strong> ${targetProperty.html.city || 'N/A'}</div>
            <div class="field"><strong>סוג נכס:</strong> ${targetProperty.html.property_type || 'N/A'}</div>
            <div class="field"><strong>חניה:</strong> ${targetProperty.html.has_parking ? '✅ כן' : '❌ לא'}</div>
            <div class="field"><strong>מעלית:</strong> ${targetProperty.html.has_elevator ? '✅ כן' : '❌ לא'}</div>
            <div class="field"><strong>מרפסת:</strong> ${targetProperty.html.has_balcony ? '✅ כן' : '❌ לא'}</div>
          ` : '<p>No HTML data extracted</p>'}
        </div>
      </div>
    </div>

    <div class="section">
      <h2>🗄️ Database Schema</h2>
      ${databaseStats.schema.map((table: any) => `
        <h3 style="margin-top: 20px; color: #667eea;">${table.name}</h3>
        <div class="schema-box">${escapeHtml(table.sql)}</div>
      `).join('')}
    </div>

    <div class="section">
      <h2>📸 Image Analysis</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <h3>${targetProperty.images.database.length}</h3>
          <p>Images in Database</p>
        </div>
        <div class="stat-card">
          <h3>${targetProperty.images.html.length}</h3>
          <p>Images in HTML</p>
        </div>
        <div class="stat-card">
          <h3>${targetProperty.images.database.filter((img: any) => img.is_downloaded).length}</h3>
          <p>Downloaded Images</p>
        </div>
      </div>

      <h3 style="margin-top: 20px;">Sample Image URLs (Database):</h3>
      <div class="code-block">
        ${targetProperty.images.database.slice(0, 5).map((img: any) =>
          `${img.image_order + 1}. ${img.image_url}`
        ).join('\n') || 'No images found'}
      </div>

      <h3 style="margin-top: 20px;">Sample Image URLs (HTML):</h3>
      <div class="code-block">
        ${targetProperty.images.html.slice(0, 5).map((url: string, i: number) =>
          `${i + 1}. ${url}`
        ).join('\n') || 'No images extracted'}
      </div>
    </div>

    <div class="section">
      <h2>📝 Sample Properties from Database</h2>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>מחיר</th>
            <th>חדרים</th>
            <th>מ"ר</th>
            <th>כתובת</th>
            <th>עיר</th>
          </tr>
        </thead>
        <tbody>
          ${databaseStats.properties.map((prop: any) => `
            <tr>
              <td>${prop.id}</td>
              <td>₪${prop.price?.toLocaleString() || 'N/A'}</td>
              <td>${prop.rooms || 'N/A'}</td>
              <td>${prop.size || 'N/A'}</td>
              <td>${prop.address || 'N/A'}</td>
              <td>${prop.city || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${databaseStats.totalProperties > 10 ? `
        <p style="text-align: center; margin-top: 15px; color: #666;">
          מציג 10 מתוך ${databaseStats.totalProperties} נכסים
        </p>
      ` : ''}
    </div>
  </div>
</body>
</html>`;
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '<em style="color: #999;">null</em>';
  if (typeof value === 'boolean') return value ? '✅ כן' : '❌ לא';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Run the report generation
generateQualityReport()
  .then(() => {
    console.log('\n✅ Quality assessment complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error generating report:', error);
    process.exit(1);
  });
