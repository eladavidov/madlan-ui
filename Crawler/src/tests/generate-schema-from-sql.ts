/**
 * Generate Schema Table Report from SQL File + SQLite Data
 *
 * Reads schema from schema-duckdb.sql (10 tables, 135 comments)
 * Combines with actual data from SQLite database
 */

import Database from "better-sqlite3";
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

async function generateSchemaFromSQL() {
  console.log("🔍 Generating Schema Report from schema-duckdb.sql + SQLite data...\n");

  // Read the schema-duckdb.sql file
  const schemaSQL = await fs.readFile("./src/database/schema-duckdb.sql", "utf-8");

  // Parse tables from schema
  const tables = parseTablesFromSQL(schemaSQL);

  console.log(`  → Found ${tables.length} tables in schema\n`);

  // Open SQLite database for sample data
  const db = new Database("./data/databases/properties.db", { readonly: true });

  // For each table, try to get sample data from SQLite
  for (const table of tables) {
    console.log(`  → ${table.tableName} (${table.columns.length} columns)`);

    try {
      const sampleData = db.prepare(`SELECT * FROM ${table.tableName} LIMIT 3`).all();
      table.sampleData = sampleData;

      // Add sample values to columns
      for (const col of table.columns) {
        col.sampleValues = sampleData
          .map((row: any) => row[col.name])
          .filter(val => val !== null && val !== undefined)
          .slice(0, 3)
          .map(val => formatSampleValue(val));
      }
    } catch (e) {
      // Table doesn't exist in SQLite or is empty
      table.sampleData = [];
    }
  }

  db.close();

  // Generate HTML
  console.log("\n  → Generating HTML...");
  const html = generateHTML(tables);

  // Write to file
  const outputPath = path.resolve("./tests/schema-table-report.html");
  await fs.writeFile(outputPath, html, "utf-8");

  console.log(`\n✅ Schema Table Report Generated!`);
  console.log(`📁 Location: ${outputPath}`);
}

function parseTablesFromSQL(sql: string): TableSchema[] {
  const tables: TableSchema[] = [];

  // Find all CREATE TABLE statements
  const tableRegex = /CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\);/gi;
  let match;

  while ((match = tableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const tableBody = match[2];

    // Get table comment
    const tableCommentRegex = new RegExp(`COMMENT ON TABLE ${tableName} IS '([^']+)'`, 'i');
    const commentMatch = sql.match(tableCommentRegex);
    const tableComment = commentMatch ? commentMatch[1] : "";

    // Parse columns
    const columns = parseColumnsFromTableBody(tableName, tableBody, sql);

    tables.push({
      tableName,
      tableComment,
      columns,
      sampleData: []
    });
  }

  return tables;
}

function parseColumnsFromTableBody(tableName: string, tableBody: string, fullSQL: string): ColumnSchema[] {
  const columns: ColumnSchema[] = [];
  const lines = tableBody.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('--'));

  for (const line of lines) {
    // Skip constraints, foreign keys, etc
    if (line.startsWith('FOREIGN KEY') || line.startsWith('PRIMARY KEY') ||
        line.startsWith('UNIQUE') || line.startsWith('CHECK')) {
      continue;
    }

    // Parse column definition
    const colMatch = line.match(/^(\w+)\s+([\w()]+)(.*)$/);
    if (!colMatch) continue;

    const colName = colMatch[1];
    const colType = colMatch[2];
    const rest = colMatch[3];

    const nullable = rest.includes('NOT NULL') ? 'NOT NULL' : 'NULL';
    const primaryKey = rest.includes('PRIMARY KEY') ? 'PK' : '-';

    // Extract default value
    let defaultValue = '-';
    const defaultMatch = rest.match(/DEFAULT\s+([^,]+)/i);
    if (defaultMatch) {
      defaultValue = defaultMatch[1].trim();
    }

    // Get column comment from COMMENT ON COLUMN
    const commentRegex = new RegExp(`COMMENT ON COLUMN ${tableName}\\.${colName} IS '([^']+)'`, 'i');
    const commentMatch = fullSQL.match(commentRegex);
    const comment = commentMatch ? commentMatch[1] : "";

    columns.push({
      name: colName,
      type: colType,
      nullable,
      defaultValue,
      primaryKey,
      comment,
      sampleValues: []
    });
  }

  return columns;
}

function formatSampleValue(value: any): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return value.toLocaleString('en-US');

  const str = String(value);
  if (str.length > 60) {
    return str.substring(0, 57) + "...";
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

  const totalColumns = tables.reduce((sum, t) => sum + t.columns.length, 0);
  const totalComments = tables.reduce((sum, t) => {
    return sum + (t.tableComment ? 1 : 0) + t.columns.filter(c => c.comment).length;
  }, 0);

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
            <th style="width: 180px;">Column Name</th>
            <th style="width: 100px;">Type</th>
            <th style="width: 90px;">Nullable</th>
            <th style="width: 50px;">Key</th>
            <th style="width: 100px;">Default</th>
            <th>Description</th>
            <th style="width: 280px;">Sample Values</th>
          </tr>
        </thead>
        <tbody>
          ${table.columns.map(col => `
            <tr>
              <td class="col-name">${col.name}</td>
              <td class="col-type">${col.type}</td>
              <td class="col-nullable ${col.nullable === 'NULL' ? 'nullable-yes' : 'nullable-no'}">${col.nullable}</td>
              <td class="col-key ${col.primaryKey === 'PK' ? 'is-pk' : ''}">${col.primaryKey}</td>
              <td class="col-default">${escapeHTML(col.defaultValue)}</td>
              <td class="col-comment">${escapeHTML(col.comment)}</td>
              <td class="col-samples">
                ${col.sampleValues.length > 0
                  ? col.sampleValues.map(v => `<div class="sample-value">${escapeHTML(v)}</div>`).join('')
                  : '<span class="no-data">No data</span>'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="table-stats">
        Columns: <strong>${table.columns.length}</strong> |
        Comments: <strong>${(table.tableComment ? 1 : 0) + table.columns.filter(c => c.comment).length}</strong> |
        Sample Rows: <strong>${table.sampleData.length}</strong>
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
      line-height: 1.6;
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
      line-height: 1.7;
    }
    .schema-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 0.92em;
    }
    .schema-table th {
      background: #667eea;
      color: white;
      padding: 14px 10px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #5568d3;
    }
    .schema-table td {
      padding: 12px 10px;
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
      font-size: 0.95em;
    }
    .col-type {
      font-family: 'Courier New', monospace;
      color: #059669;
      font-weight: 600;
      font-size: 0.9em;
    }
    .col-nullable {
      text-align: center;
      font-size: 0.85em;
      font-weight: 600;
    }
    .nullable-yes { color: #f59e0b; }
    .nullable-no { color: #10b981; }
    .col-key {
      text-align: center;
      font-weight: 700;
      font-size: 0.85em;
    }
    .is-pk {
      color: #dc2626;
      background: #fee2e2;
      border-radius: 3px;
      padding: 2px 4px;
    }
    .col-default {
      font-family: 'Courier New', monospace;
      font-size: 0.85em;
      color: #666;
    }
    .col-comment {
      color: #444;
      font-size: 0.92em;
      line-height: 1.5;
    }
    .col-samples {
      font-family: 'Courier New', monospace;
      font-size: 0.82em;
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
      padding: 12px;
      background: #f0f9ff;
      border-radius: 6px;
      color: #1e40af;
      font-size: 0.9em;
      text-align: center;
      border-left: 4px solid #3b82f6;
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
    <h1>🗄️ Database Schema Documentation</h1>
    <p>Madlan Property Crawler - Complete Schema Reference (Table View)</p>
    <div>
      <span class="stats-badge">📋 ${tables.length} Tables</span>
      <span class="stats-badge">📊 ${totalColumns} Columns</span>
      <span class="stats-badge">💬 ${totalComments} Comments</span>
    </div>
  </div>

  ${tablesHTML}

  <div class="timestamp">
    Generated: ${timestamp} | Schema: schema-duckdb.sql | Data: properties.db
  </div>
</body>
</html>`;
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Run report generation
generateSchemaFromSQL().catch((error) => {
  console.error("❌ Report generation failed:", error);
  console.error(error.stack);
  process.exit(1);
});
