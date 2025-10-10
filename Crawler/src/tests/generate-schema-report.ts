/**
 * Generate Comprehensive Schema Documentation Report
 *
 * Creates detailed HTML documentation of the database schema including:
 * - All tables with descriptions
 * - All columns with types and comments
 * - Sample data from actual database
 * - Foreign key relationships
 * - Indexes
 */

import Database from "better-sqlite3";
import fs from "fs/promises";
import path from "path";

interface TableInfo {
  name: string;
  comment: string;
  columns: ColumnInfo[];
  sampleData: any[];
  indexes: string[];
  foreignKeys: string[];
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  comment: string;
  sampleValues: any[];
}

async function generateSchemaReport() {
  console.log("🔍 Generating Comprehensive Schema Documentation Report...\n");

  // Initialize database (using SQLite as it has actual data)
  console.log("  → Connecting to SQLite database...");
  const db = new Database("./data/databases/properties.db", { readonly: true });

  // Get all tables
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all() as { name: string }[];

  console.log(`  → Found ${tables.length} tables\n`);

  const tableInfos: TableInfo[] = [];

  for (const table of tables) {
    console.log(`  → Processing table: ${table.name}`);

    // Get table info from PRAGMA
    const columns = db.prepare(`PRAGMA table_info(${table.name})`).all() as any[];

    // Get sample data (up to 5 rows)
    const sampleData = db.prepare(`SELECT * FROM ${table.name} LIMIT 5`).all();

    // Get indexes
    const indexes = db.prepare(`PRAGMA index_list(${table.name})`).all() as any[];

    // Get foreign keys
    const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${table.name})`).all() as any[];

    // Get table and column comments from schema-duckdb.sql
    const tableComment = getTableComment(table.name);
    const columnComments = getColumnComments(table.name);

    const columnInfos: ColumnInfo[] = columns.map(col => {
      // Get sample values for this column
      const sampleValues = sampleData
        .map((row: any) => row[col.name])
        .filter(val => val !== null && val !== undefined)
        .slice(0, 3); // First 3 non-null values

      return {
        name: col.name,
        type: col.type,
        nullable: col.notnull === 0,
        defaultValue: col.dflt_value,
        comment: columnComments[col.name] || "",
        sampleValues
      };
    });

    tableInfos.push({
      name: table.name,
      comment: tableComment,
      columns: columnInfos,
      sampleData: sampleData.slice(0, 3), // First 3 rows
      indexes: indexes.map(idx => idx.name),
      foreignKeys: foreignKeys.map(fk => `${fk.from} → ${fk.table}(${fk.to})`)
    });
  }

  // Generate HTML
  console.log("\n  → Generating HTML report...");
  const html = generateHTML(tableInfos);

  // Write to file
  const outputPath = path.resolve("./tests/schema-documentation.html");
  await fs.writeFile(outputPath, html, "utf-8");

  console.log(`\n✅ Schema Documentation Report Generated Successfully!`);
  console.log(`📁 Location: ${outputPath}`);

  db.close();
}

// Parse comments from schema-duckdb.sql
function getTableComment(tableName: string): string {
  const schemaPath = "./src/database/schema-duckdb.sql";
  try {
    const schema = require("fs").readFileSync(schemaPath, "utf-8");
    const commentMatch = schema.match(
      new RegExp(`COMMENT ON TABLE ${tableName} IS '([^']+)'`, "i")
    );
    return commentMatch ? commentMatch[1] : "";
  } catch {
    return "";
  }
}

function getColumnComments(tableName: string): Record<string, string> {
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

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '<span style="color: #999; font-style: italic;">NULL</span>';
  }
  if (typeof value === "boolean") {
    return value ? '<span style="color: #10b981;">TRUE</span>' : '<span style="color: #ef4444;">FALSE</span>';
  }
  if (typeof value === "number") {
    return `<span style="color: #3b82f6;">${value.toLocaleString('he-IL')}</span>`;
  }
  // Truncate long strings
  const str = String(value);
  if (str.length > 100) {
    return `<span style="color: #666;">"${str.substring(0, 97)}..."</span>`;
  }
  return `<span style="color: #666;">"${str}"</span>`;
}

function generateHTML(tables: TableInfo[]): string {
  const timestamp = new Date().toLocaleString("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const totalTables = tables.length;
  const totalColumns = tables.reduce((sum, t) => sum + t.columns.length, 0);
  const totalComments = tables.reduce((sum, t) => {
    const tableComment = t.comment ? 1 : 0;
    const colComments = t.columns.filter(c => c.comment).length;
    return sum + tableComment + colComments;
  }, 0);

  const tablesHTML = tables.map(table => `
    <div class="table-section">
      <h2>📋 ${table.name}</h2>
      ${table.comment ? `<div class="table-comment">${table.comment}</div>` : ''}

      <h3>Columns (${table.columns.length})</h3>
      <div class="columns-container">
        ${table.columns.map(col => `
          <div class="column-card">
            <div class="column-header">
              <span class="column-name">${col.name}</span>
              <span class="column-type">${col.type}</span>
              ${!col.nullable ? '<span class="badge-required">REQUIRED</span>' : ''}
            </div>
            ${col.comment ? `<div class="column-comment">${col.comment}</div>` : ''}
            ${col.sampleValues.length > 0 ? `
              <div class="sample-values">
                <strong>Sample values:</strong>
                <div class="values-list">
                  ${col.sampleValues.map(val => `<div>${formatValue(val)}</div>`).join('')}
                </div>
              </div>
            ` : '<div class="no-data">No sample data available</div>'}
          </div>
        `).join('')}
      </div>

      ${table.sampleData.length > 0 ? `
        <h3>Sample Data (${table.sampleData.length} rows)</h3>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                ${table.columns.slice(0, 8).map(col => `<th>${col.name}</th>`).join('')}
                ${table.columns.length > 8 ? '<th>...</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${table.sampleData.map((row: any) => `
                <tr>
                  ${table.columns.slice(0, 8).map(col => `<td>${formatValue(row[col.name])}</td>`).join('')}
                  ${table.columns.length > 8 ? '<td>...</td>' : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="no-data">No sample data available</div>'}

      ${table.indexes.length > 0 ? `
        <h3>Indexes (${table.indexes.length})</h3>
        <div class="indexes-list">
          ${table.indexes.map(idx => `<div class="index-item">🔍 ${idx}</div>`).join('')}
        </div>
      ` : ''}

      ${table.foreignKeys.length > 0 ? `
        <h3>Foreign Keys (${table.foreignKeys.length})</h3>
        <div class="foreign-keys-list">
          ${table.foreignKeys.map(fk => `<div class="fk-item">🔗 ${fk}</div>`).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Madlan Crawler - Database Schema Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      direction: rtl;
    }
    .container {
      max-width: 1600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 { font-size: 2.8em; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
    .header p { font-size: 1.2em; opacity: 0.95; }
    .stats-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 8px 20px;
      border-radius: 20px;
      margin: 5px;
      font-weight: 600;
      backdrop-filter: blur(10px);
    }
    .stats-container {
      display: flex;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
      margin-top: 20px;
    }
    .table-section {
      padding: 40px;
      border-bottom: 2px solid #f0f0f0;
    }
    .table-section:last-child { border-bottom: none; }
    .table-section h2 {
      font-size: 2em;
      margin-bottom: 20px;
      color: #667eea;
      padding-bottom: 10px;
      border-bottom: 3px solid #667eea;
    }
    .table-section h3 {
      font-size: 1.4em;
      margin: 30px 0 15px 0;
      color: #444;
    }
    .table-comment {
      background: linear-gradient(120deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      font-size: 1.1em;
      line-height: 1.6;
    }
    .columns-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .column-card {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      padding: 15px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .column-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .column-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .column-name {
      font-weight: 700;
      color: #667eea;
      font-size: 1.1em;
      font-family: 'Courier New', monospace;
    }
    .column-type {
      background: #e0e7ff;
      color: #667eea;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.85em;
      font-family: 'Courier New', monospace;
      font-weight: 600;
    }
    .badge-required {
      background: #ef4444;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75em;
      font-weight: 700;
    }
    .column-comment {
      color: #555;
      font-size: 0.95em;
      line-height: 1.5;
      margin-bottom: 10px;
      padding-right: 5px;
    }
    .sample-values {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e0e0e0;
    }
    .sample-values strong {
      color: #667eea;
      font-size: 0.9em;
      display: block;
      margin-bottom: 8px;
    }
    .values-list {
      background: white;
      padding: 10px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    .values-list > div {
      padding: 4px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .values-list > div:last-child {
      border-bottom: none;
    }
    .no-data {
      color: #999;
      font-style: italic;
      font-size: 0.9em;
      padding: 10px 0;
    }
    .table-wrapper {
      overflow-x: auto;
      margin: 15px 0;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      font-size: 0.9em;
    }
    .data-table th {
      background: #667eea;
      color: white;
      padding: 12px;
      text-align: right;
      font-weight: 600;
      white-space: nowrap;
    }
    .data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e0e0e0;
      text-align: right;
    }
    .data-table tr:nth-child(even) {
      background: #f8f9fa;
    }
    .data-table tr:hover {
      background: #e9ecef;
    }
    .indexes-list, .foreign-keys-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 15px 0;
    }
    .index-item, .fk-item {
      background: #f0f0f0;
      padding: 8px 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #444;
    }
    .fk-item {
      background: #e0f2fe;
      color: #0369a1;
    }
    .timestamp {
      text-align: center;
      padding: 20px;
      color: #aaa;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🗄️ Database Schema Documentation</h1>
      <p>Madlan Property Crawler - Complete Schema Reference</p>
      <div class="stats-container">
        <div class="stats-badge">📋 ${totalTables} Tables</div>
        <div class="stats-badge">📊 ${totalColumns} Columns</div>
        <div class="stats-badge">💬 ${totalComments} Comments</div>
      </div>
    </div>

    ${tablesHTML}

    <div class="timestamp">
      Generated: ${timestamp}
    </div>
  </div>
</body>
</html>`;
}

// Run report generation
generateSchemaReport().catch((error) => {
  console.error("❌ Report generation failed:", error);
  process.exit(1);
});
