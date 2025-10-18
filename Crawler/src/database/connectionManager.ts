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
let dbPath: string | null = null;

/**
 * Get or create database connection instance (singleton)
 */
export async function getDatabase(path?: string): Promise<DuckDBConnection> {
  const requestedPath = path || getDatabasePath();

  // If requesting a different path, close existing and create new
  if (dbInstance && dbPath && dbPath !== requestedPath) {
    await dbInstance.close();
    dbInstance = null;
  }

  if (!dbInstance) {
    dbInstance = await createDatabaseConnection(requestedPath);
    dbPath = requestedPath;
  }
  return dbInstance;
}

/**
 * Initialize database (convenience function)
 * Maintains backward compatibility with existing code
 * Uses singleton pattern to prevent multiple connections
 */
export async function initDatabase(dbPath?: string): Promise<DuckDBConnection> {
  return await getDatabase(dbPath);
}

/**
 * Close database connection (useful for cleanup)
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    dbPath = null;
  }
}

/**
 * Reset database connection (useful for testing)
 */
export function resetDatabaseConnection(): void {
  dbInstance = null;
  dbPath = null;
}
