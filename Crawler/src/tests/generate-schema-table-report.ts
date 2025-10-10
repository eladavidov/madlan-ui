/**
 * Generate Schema Table Report
 *
 * Creates a simple HTML report with large tables showing:
 * - One table per database table
 * - Each row = one column with all properties
 * - Sample data included
 */

import Database from "duckdb";
import fs from "fs/promises";
import path from "path";

interface TableSchema {
  tableName: string;
  tableComment: string;
  columns: ColumnSchema[];
  sampleData: any[];
}

interface ColumnSchema {
  name: string;
  type: string;
  nullable: string;
  defaultValue: string;
  primaryKey: string;
  comment: string;
  sampleValues: string[];
}

async function generateSchemaTableReport() {
  console.log("🔍 Generating Schema Table Report from DuckDB...\n");

  // Initialize DuckDB
  const db = new Database.Database("./data/databases/properties.duckdb");

  const tables: TableSchema[] = [];

  // Get all tables
  const tableNames = await queryAsync(db, `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'main'
    ORDER BY table_name
  `);

  console.log(`  → Found ${tableNames.length} tables\n`);

  for (const { table_name } of tableNames) {
    console.log(`  → Processing: ${table_name}`);

    // Get table comment
    const tableCommentResult = await queryAsync(db, `
      SELECT obj_description FROM duckdb_tables()
      WHERE table_name = '${table_name}'
    `);
    const tableComment = tableCommentResult[0]?.obj_description || "";

    // Get column information
    const columns = await queryAsync(db, `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = '${table_name}'
      ORDER BY ordinal_position
    `);

    // Get sample data
    let sampleData: any[] = [];
    try {
      sampleData = await queryAsync(db, `SELECT * FROM ${table_name} LIMIT 3`);
    } catch (e) {
      // Table might be empty
    }

    // Get column comments from schema file
    const columnComments = getColumnCommentsFromFile(table_name);

    // Build column schema
    const columnSchemas: ColumnSchema[] = columns.map((col: any) => {
      const sampleValues = sampleData
        .map(row => row[col.column_name])
        .filter(val => val !== null && val !== undefined)
        .slice(0, 3)
        .map(val => formatSampleValue(val));

      return {
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL',
        defaultValue: col.column_default || '-',
        primaryKey: col.column_name === 'id' ? 'PK' : '-',
        comment: columnComments[col.column_name] || '',
        sampleValues
      };
    });

    tables.push({
      tableName: table_name,
      tableComment,
      columns: columnSchemas,
      sampleData
    });
  }

  // Generate HTML
  console.log("\n  → Generating HTML...");
  const html = generateHTML(tables);

  // Write to file
  const outputPath = path.resolve("./tests/schema-table-report.html");
  await fs.writeFile(outputPath, html, "utf-8");

  console.log(`\n✅ Schema Table Report Generated!`);
  console.log(`📁 Location: ${outputPath}`);

  db.close();
}

function queryAsync(db: any, sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, (err: any, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function getColumnCommentsFromFile(tableName: string): Record<string, string> {
  const schemaPath = "./src/database/schema-duckdb.sql";
  const comments: Record<string, string> = {};

  try {
    const schema = require("fs").readFileSync(schemaPath, "utf-8");
    const regex = new RegExp(
      `COMMENT ON COLUMN ${tableName}\\.(\\w+) IS '([^']+)'`,
      "gi"
    );

    let match;
    while ((match = regex.exec(schema)) !== null) {
      comments[match[1]] = match[2];
    }
  } catch {
    // Ignore errors
  }

  return comments;
}

function formatSampleValue(value: any): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return value.toLocaleString('en-US');

  const str = String(value);
  if (str.length > 80) {
    return str.substring(0, 77) + "...";
  }
  return str;
}

function generateHTML(tables: TableSchema[]): string {
  const timestamp = new Date().toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const tablesHTML = tables.map(table => `
    <div class="table-section">
      <h2>📋 ${table.tableName}</h2>
      ${table.tableComment ? `
        <div class="table-description">
          ${table.tableComment}
        </div>
      ` : ''}

      <table class="schema-table">
        <thead>
          <tr>
            <th style="width: 200px;">Column Name</th>
            <th style="width: 120px;">Type</th>
            <th style="width: 100px;">Nullable</th>
            <th style="width: 80px;">Key</th>
            <th style="width: 120px;">Default</th>
            <th>Description</th>
            <th style="width: 300px;">Sample Values</th>
          </tr>
        </thead>
        <tbody>
          ${table.columns.map(col => `
            <tr>
              <td class="col-name">${col.name}</td>
              <td class="col-type">${col.type}</td>
              <td class="col-nullable ${col.nullable === 'NULL' ? 'nullable-yes' : 'nullable-no'}">${col.nullable}</td>
              <td class="col-key ${col.primaryKey === 'PK' ? 'is-pk' : ''}">${col.primaryKey}</td>
              <td class="col-default">${col.defaultValue}</td>
              <td class="col-comment">${col.comment}</td>
              <td class="col-samples">
                ${col.sampleValues.length > 0
                  ? col.sampleValues.map(v => `<div class="sample-value">${v}</div>`).join('')
                  : '<span class="no-data">No data</span>'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="table-stats">
        Columns: ${table.columns.length} | Sample Rows: ${table.sampleData.length}
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Madlan Crawler - Database Schema (Table View)</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .header p { font-size: 1.1em; opacity: 0.95; }
    .stats-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 8px 20px;
      border-radius: 20px;
      margin: 10px 5px 0 5px;
      font-weight: 600;
    }
    .table-section {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .table-section h2 {
      font-size: 2em;
      color: #667eea;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 3px solid #667eea;
    }
    .table-description {
      background: linear-gradient(120deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 1.05em;
      line-height: 1.6;
    }
    .schema-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 0.95em;
    }
    .schema-table th {
      background: #667eea;
      color: white;
      padding: 14px 12px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #5568d3;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .schema-table td {
      padding: 12px;
      border: 1px solid #e0e0e0;
      vertical-align: top;
    }
    .schema-table tr:nth-child(even) {
      background: #f9f9f9;
    }
    .schema-table tr:hover {
      background: #e8f0fe;
    }
    .col-name {
      font-weight: 700;
      color: #667eea;
      font-family: 'Courier New', monospace;
    }
    .col-type {
      font-family: 'Courier New', monospace;
      color: #059669;
      font-weight: 600;
    }
    .col-nullable {
      text-align: center;
      font-size: 0.85em;
      font-weight: 600;
    }
    .nullable-yes {
      color: #f59e0b;
    }
    .nullable-no {
      color: #10b981;
    }
    .col-key {
      text-align: center;
      font-weight: 700;
      font-size: 0.85em;
    }
    .is-pk {
      color: #dc2626;
      background: #fee2e2;
    }
    .col-default {
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #666;
    }
    .col-comment {
      color: #444;
      line-height: 1.5;
      font-size: 0.95em;
    }
    .col-samples {
      font-family: 'Courier New', monospace;
      font-size: 0.85em;
    }
    .sample-value {
      padding: 4px 8px;
      margin: 2px 0;
      background: #f0f9ff;
      border-left: 3px solid #3b82f6;
      border-radius: 3px;
      color: #1e40af;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .no-data {
      color: #999;
      font-style: italic;
    }
    .table-stats {
      margin-top: 15px;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 6px;
      color: #666;
      font-size: 0.9em;
      text-align: center;
    }
    .timestamp {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🗄️ Database Schema - Table View</h1>
    <p>Madlan Property Crawler - DuckDB Schema Documentation</p>
    <div>
      <span class="stats-badge">📋 ${tables.length} Tables</span>
      <span class="stats-badge">📊 ${tables.reduce((sum, t) => sum + t.columns.length, 0)} Columns</span>
    </div>
  </div>

  ${tablesHTML}

  <div class="timestamp">
    Generated: ${timestamp} | Database: properties.duckdb
  </div>
</body>
</html>`;
}

// Run report generation
generateSchemaTableReport().catch((error) => {
  console.error("❌ Report generation failed:", error);
  process.exit(1);
});
