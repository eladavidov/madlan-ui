/**
 * Database Connection Manager
 * DuckDB-only implementation (SQLite support removed)
 */

import { DuckDBConnection } from "./connectionDuckDB.js";

/**
 * Get database path from environment
 */
function getDatabasePath(): string {
  return process.env.DUCKDB_PATH || "./data/databases/properties.duckdb";
}

/**
 * Create DuckDB database connection
 */
export async function createDatabaseConnection(path?: string): Promise<DuckDBConnection> {
  const dbPath = path || getDatabasePath();
  console.log(`Creating DuckDB connection at: ${dbPath}`);

  const db = new DuckDBConnection(dbPath);
  await db.initialize();
  return db;
}

// Singleton instance
let dbInstance: DuckDBConnection | null = null;

/**
 * Get or create database connection instance (singleton)
 */
export async function getDatabase(path?: string): Promise<DuckDBConnection> {
  if (!dbInstance) {
    dbInstance = await createDatabaseConnection(path);
  }
  return dbInstance;
}

/**
 * Initialize database (convenience function)
 * Maintains backward compatibility with existing code
 */
export async function initDatabase(dbPath?: string): Promise<DuckDBConnection> {
  const path = dbPath || getDatabasePath();
  const db = await createDatabaseConnection(path);
  return db;
}

/**
 * Reset database connection (useful for testing)
 */
export function resetDatabaseConnection(): void {
  dbInstance = null;
}
