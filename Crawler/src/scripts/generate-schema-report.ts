/**
 * Generate Comprehensive HTML Schema Report
 * Shows ALL tables with complete metadata and actual sample data
 */

import { initDatabase } from "../database/connectionManager.js";

interface TableMetadata {
  name: string;
  comment: string;
  emoji: string;
}

async function generateSchemaReport() {
  const db = await initDatabase();

  // Define all tables with their comments
  const tables: TableMetadata[] = [
    { name: 'properties', comment: 'Main table storing comprehensive property listings data from Madlan.co.il including basic info, amenities, location, and pricing details', emoji: '🏠' },
    { name: 'property_images', comment: 'Stores image URLs and metadata for property photos, including download status and BLOB storage', emoji: '📸' },
    { name: 'crawl_sessions', comment: 'Tracks crawler execution sessions with statistics and status - used for monitoring and debugging crawler runs', emoji: '📊' },
    { name: 'crawl_errors', comment: 'Logs all errors encountered during crawling for debugging and quality monitoring', emoji: '⚠️' },
    { name: 'transaction_history', comment: 'Historical real estate transactions for pricing trends (חשוב לדעת section) - Transaction date, price, rooms, size per property', emoji: '💰' },
    { name: 'nearby_schools', comment: 'Schools near property with distance and type (בתי ספר section) - Name, type, distance, grade range', emoji: '🏫' },
    { name: 'neighborhood_ratings', comment: 'Community ratings 1-10 across multiple categories (דירוגי השכנים) - Safety, cleanliness, noise, parking, public transport, quality of life', emoji: '⭐' },
    { name: 'price_comparisons', comment: 'Average price data by room count for neighborhood (מחירי דירות) - Average prices for 2-6 room apartments', emoji: '📈' },
    { name: 'new_construction_projects', comment: 'Construction projects nearby with status and details (בניה חדשה) - Project name, location, distance, status, completion date', emoji: '🏗️' },
  ];

  // Start HTML
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Madlan Crawler Database Schema - Complete Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; background: #f5f5f5; line-height: 1.6; }
        .container { max-width: 1600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; }
        h2 { color: #34495e; margin-top: 50px; margin-bottom: 10px; border-left: 4px solid #3498db; padding-left: 15px; }
        .info { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .info p { margin: 5px 0; }
        .stats { background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; display: flex; gap: 30px; flex-wrap: wrap; }
        .stat-item { text-align: center; }
        .stat-value { color: #2980b9; font-size: 32px; font-weight: bold; display: block; }
        .stat-label { color: #555; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; background: white; }
        th { background: #3498db; color: white; padding: 12px 8px; text-align: left; font-weight: 600; position: sticky; top: 0; white-space: nowrap; }
        td { padding: 10px 8px; border: 1px solid #ddd; vertical-align: top; }
        tr:nth-child(even) { background: #f9f9f9; }
        tr:hover { background: #e3f2fd; }
        .table-comment { background: #e8f4f8; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0; font-style: italic; color: #555; line-height: 1.8; }
        .table-count { background: #d4edda; padding: 10px 15px; border-radius: 4px; display: inline-block; margin: 15px 0; font-weight: 600; color: #155724; }
        .column-name { font-weight: 600; color: #2c3e50; font-family: 'Courier New', monospace; font-size: 13px; }
        .column-type { color: white; background: #7f8c8d; font-size: 11px; font-family: 'Courier New', monospace; padding: 3px 8px; border-radius: 3px; display: inline-block; }
        .nullable-yes { color: #856404; background: #fff3cd; font-size: 11px; padding: 3px 8px; border-radius: 3px; display: inline-block; }
        .nullable-no { color: #721c24; background: #f8d7da; font-size: 11px; padding: 3px 8px; border-radius: 3px; display: inline-block; }
        .sample-data { background: #fff9e6; padding: 8px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 12px; max-width: 400px; word-wrap: break-word; }
        .null-value { color: #999; font-style: italic; }
        .no-data-warning { color: #e74c3c; font-style: italic; background: #fee; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .metadata { color: #7f8c8d; font-size: 13px; margin-top: 40px; padding-top: 30px; border-top: 2px solid #ddd; }
        .metadata h3 { color: #34495e; margin-top: 25px; }
        .metadata p { margin: 8px 0; line-height: 1.8; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🗄️ Madlan Crawler Database Schema - Complete Report</h1>

        <div class="info">
            <p><strong>Database:</strong> DuckDB (properties.duckdb)</p>
            <p><strong>Target:</strong> Haifa Properties for Sale (~3,600 available)</p>
            <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
            <p><strong>Search URL:</strong> https://www.madlan.co.il/for-sale/%D7%97%D7%99%D7%A4%D7%94-%D7%99%D7%A9%D7%A8%D7%90%D7%9C?tracking_search_source=new_search&marketplace=residential</p>
        </div>
`;

  // Generate summary stats
  let totalRows = 0;
  let totalColumns = 0;
  let tablesWithData = 0;

  for (const table of tables) {
    try {
      const countResult = await db.query(`SELECT COUNT(*) as count FROM ${table.name}`);
      const rowCount = Number(countResult[0].count);
      totalRows += rowCount;
      if (rowCount > 0) tablesWithData++;

      const columnsResult = await db.query(`
        SELECT COUNT(*) as count
        FROM information_schema.columns
        WHERE table_name = '${table.name}'
      `);
      totalColumns += Number(columnsResult[0].count);
    } catch (err) {
      // Table doesn't exist yet
    }
  }

  html += `
        <div class="stats">
            <div class="stat-item">
                <span class="stat-value">${tables.length}</span>
                <span class="stat-label">Total Tables</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${totalColumns}</span>
                <span class="stat-label">Total Columns</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${totalRows}</span>
                <span class="stat-label">Total Rows</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${tablesWithData}/${tables.length}</span>
                <span class="stat-label">Tables with Data</span>
            </div>
        </div>
`;

  // Generate detailed table reports
  for (const table of tables) {
    html += `
        <h2>${table.emoji} ${table.name}</h2>
        <div class="table-comment">${table.comment}</div>
`;

    try {
      // Get column metadata from information_schema
      const columns = await db.query(`
        SELECT
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_name = '${table.name}'
        ORDER BY ordinal_position
      `);

      // Get row count
      const countResult = await db.query(`SELECT COUNT(*) as count FROM ${table.name}`);
      const rowCount = Number(countResult[0].count);

      html += `<div class="table-count">📊 Row Count: <strong>${rowCount}</strong> ${rowCount === 0 ? '(Empty - no data yet)' : ''}</div>`;

      // Get sample data (up to 5 rows) - try to sample from different properties if possible
      let sampleData: any[] = [];
      if (rowCount > 0) {
        // Check if table has property_id column (to sample from multiple properties)
        const hasPropertyId = columns.some((col: any) => col.column_name === 'property_id');

        if (hasPropertyId && table.name !== 'properties') {
          // For child tables: sample from up to 5 different properties
          sampleData = await db.query(`
            SELECT * FROM ${table.name}
            WHERE property_id IN (
              SELECT DISTINCT property_id FROM ${table.name}
              ORDER BY RANDOM()
              LIMIT 5
            )
            LIMIT 5
          `);
        } else {
          // For properties table and tables without property_id: sample randomly
          sampleData = await db.query(`
            SELECT * FROM ${table.name}
            ORDER BY RANDOM()
            LIMIT 5
          `);
        }
      }

      // Build table with complete metadata
      html += `
        <table>
            <tr>
                <th style="width: 180px">Column Name</th>
                <th style="width: 450px">Description</th>
                <th style="width: 120px">Type</th>
                <th style="width: 100px">Nullable</th>
                <th>Sample Data (up to 5 rows from different properties)</th>
            </tr>
`;

      for (const col of columns) {
        const columnName = col.column_name;
        const columnType = col.data_type;
        const isNullable = col.is_nullable === 'YES';

        // Get sample values for this column
        const sampleValues = sampleData.map(row => {
          const value = row[columnName];
          if (value === null || value === undefined) {
            return '<span class="null-value">NULL</span>';
          }
          if (typeof value === 'boolean') {
            return value ? 'TRUE' : 'FALSE';
          }
          if (value instanceof Date) {
            return value.toISOString();
          }
          const strValue = String(value);
          // Truncate long values
          return strValue.length > 80 ? strValue.substring(0, 80) + '...' : strValue;
        });

        const sampleDisplay = sampleValues.length > 0
          ? sampleValues.join('<br><br>')
          : '<span class="null-value">No data</span>';

        // Generate description based on column name (you can enhance this)
        const description = getColumnDescription(table.name, columnName);

        html += `
            <tr>
                <td><span class="column-name">${columnName}</span></td>
                <td>${description}</td>
                <td><span class="column-type">${columnType}</span></td>
                <td><span class="${isNullable ? 'nullable-yes' : 'nullable-no'}">${isNullable ? 'NULL' : 'NOT NULL'}</span></td>
                <td class="sample-data">${sampleDisplay}</td>
            </tr>
`;
      }

      html += `
        </table>
`;

      if (rowCount === 0) {
        html += `<div class="no-data-warning">⚠️ <strong>No data in this table yet.</strong> Run a crawl to populate it with actual data.</div>`;
      }

    } catch (error: any) {
      html += `<div class="no-data-warning">⚠️ <strong>Table not found in database.</strong> Schema may need to be initialized or migrated.</div>`;
    }
  }

  // Footer metadata
  html += `
        <div class="metadata">
            <h3>📋 Schema Information</h3>
            <p><strong>Schema Version:</strong> Phase 5C - DuckDB-only architecture</p>
            <p><strong>Database Engine:</strong> DuckDB with manual ID generation (no sequences)</p>
            <p><strong>Total Documentation:</strong> 135+ COMMENT statements on tables and columns</p>
            <p><strong>Foreign Keys:</strong> property_images → properties, crawl_errors → crawl_sessions</p>
            <p><strong>Indexes:</strong> Optimized for queries by city, price, rooms, neighborhood, price_per_sqm</p>
            <p><strong>Resume Capability:</strong> Partial (updates existing properties, skips already-downloaded images)</p>

            <h3>🚀 Production Configuration</h3>
            <p><strong>Anti-Blocking Strategy:</strong> Fresh browser per property with 60-120s random delays</p>
            <p><strong>Success Rate:</strong> 100% validated (20-property test with zero blocking)</p>
            <p><strong>Estimated Time:</strong> ~100-160 hours for full 3,600 properties (4-7 nights in sequential batches)</p>
            <p><strong>Batch Strategy:</strong> 500-1000 properties per night for safety and monitoring</p>
        </div>
    </div>
</body>
</html>`;

  // Write to file
  const fs = await import('fs');
  fs.writeFileSync('tests/schema-report-with-data.html', html);
  console.log('✅ Schema report generated: tests/schema-report-with-data.html');
  console.log(`📊 Summary: ${tables.length} tables, ${totalColumns} columns, ${totalRows} total rows, ${tablesWithData} tables with data`);

  db.close();
}

// Helper function to get column descriptions
function getColumnDescription(tableName: string, columnName: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    properties: {
      id: 'Unique property identifier from Madlan URL',
      url: 'Full Madlan property page URL',
      price: 'Property price in Israeli Shekels (₪)',
      rooms: 'Number of rooms (including half rooms like 3.5, 4.5)',
      size: 'Property size in square meters (m²)',
      floor: 'Floor number (negative for basement)',
      total_floors: 'Total floors in building',
      price_per_sqm: 'Price per square meter (₪/m²)',
      address: 'Street address in Hebrew',
      neighborhood: 'Neighborhood name in Hebrew (e.g., אחוזה, כרמל)',
      city: 'City name in Hebrew (חיפה)',
      property_type: 'Type: דירה, פנטהאוז, דירת גן, דופלקס',
      has_parking: 'TRUE if property has parking space(s)',
      has_elevator: 'TRUE if building has elevator (מעלית)',
      has_balcony: 'TRUE if property has balcony (מרפסת)',
      has_air_conditioning: 'TRUE if has air conditioning (מזגן)',
      has_security_door: 'TRUE if has security door (דלת פלדה)',
      has_storage: 'TRUE if has storage room (מחסן)',
      is_accessible: 'TRUE if accessible for disabled (נגיש)',
      is_renovated: 'TRUE if recently renovated (משופץ)',
      is_furnished: 'TRUE if furnished (מרוהט)',
      has_mamad: 'TRUE if has safe room/mamad (ממ"ד)',
      has_bars: 'TRUE if has window bars (סורגים)',
      first_crawled_at: 'Timestamp when first crawled',
      last_crawled_at: 'Timestamp when last crawled',
      crawl_count: 'Number of times property crawled',
      latitude: 'Property latitude coordinate',
      longitude: 'Property longitude coordinate',
      expected_yield: 'Expected rental yield percentage',
      neighborhood_description: 'Text description of neighborhood life',
    },
    property_images: {
      id: 'Auto-incrementing primary key for image records',
      property_id: 'Foreign key to properties table',
      image_url: 'Full URL to image on Madlan CDN',
      image_order: 'Order in gallery (0 = first/main image)',
      is_main_image: 'TRUE if primary thumbnail image',
      is_downloaded: 'TRUE if downloaded to local storage',
      local_path: 'Relative path to downloaded file (deprecated)',
      image_data: 'BLOB storage for actual image data',
    },
    crawl_sessions: {
      id: 'Auto-incrementing primary key',
      session_id: 'Unique session identifier (UUID or timestamp)',
      start_time: 'When crawler session started',
      end_time: 'When crawler session ended (NULL if running)',
      target_city: 'City targeted for crawl (חיפה)',
      properties_found: 'Total properties discovered',
      properties_new: 'New properties added',
      properties_updated: 'Existing properties updated',
      properties_failed: 'Properties that failed',
      images_downloaded: 'Images successfully downloaded',
      status: 'Session status: running | completed | failed | interrupted',
      error_message: 'Error message if session failed',
    },
    crawl_errors: {
      id: 'Auto-incrementing primary key',
      session_id: 'Foreign key to crawl_sessions',
      error_type: 'Category: navigation/extraction/validation/network/blocking',
      error_message: 'Human-readable error message',
      error_stack: 'Full stack trace for debugging',
      url: 'URL where error occurred',
      property_id: 'Property being processed when error occurred',
      occurred_at: 'Timestamp when error occurred',
    },
    transaction_history: {
      id: 'Auto-incrementing primary key',
      property_id: 'Foreign key to properties table',
      transaction_date: 'Date of transaction (sale/rental)',
      transaction_type: 'Type: sale or rental',
      price: 'Transaction price in Israeli Shekels (₪)',
      rooms: 'Number of rooms in transaction',
      size: 'Property size in square meters (m²)',
      floor: 'Floor number',
      price_per_sqm: 'Price per square meter (₪/m²)',
    },
    nearby_schools: {
      id: 'Auto-incrementing primary key',
      property_id: 'Foreign key to properties table',
      school_name: 'Name of school in Hebrew',
      school_type: 'Type: יסודי, חטיבה, תיכון',
      distance_meters: 'Distance from property in meters',
      grade_range: 'Grade range (e.g., "א-ו", "ז-ט")',
    },
    neighborhood_ratings: {
      id: 'Auto-incrementing primary key',
      property_id: 'Foreign key to properties table (one per property)',
      safety_rating: 'Safety rating (1-10 scale)',
      cleanliness_rating: 'Cleanliness rating (1-10)',
      noise_level_rating: 'Noise level rating (1-10)',
      parking_rating: 'Parking availability rating (1-10)',
      public_transport_rating: 'Public transport rating (1-10)',
      quality_of_life_rating: 'Overall quality of life rating (1-10)',
    },
    price_comparisons: {
      id: 'Auto-incrementing primary key',
      property_id: 'Foreign key to properties table',
      neighborhood: 'Neighborhood name for comparison',
      room_count: 'Number of rooms (2, 3, 4, 5, 6+)',
      average_price: 'Average price for this room count in neighborhood',
      price_per_sqm: 'Average price per square meter',
    },
    new_construction_projects: {
      id: 'Auto-incrementing primary key',
      property_id: 'Foreign key to properties table',
      project_name: 'Name of construction project',
      location: 'Project location/address',
      distance_meters: 'Distance from property in meters',
      status: 'Status: בתכנון, בבנייה, הושלם',
      expected_completion: 'Expected completion date',
    },
  };

  return descriptions[tableName]?.[columnName] || `Column: ${columnName}`;
}

generateSchemaReport().catch(console.error);
