/**
 * Unified Database Connection Manager
 * Supports both SQLite and DuckDB via configuration
 */

import { DatabaseConnection } from "./connection.js";
import { DuckDBConnection } from "./connectionDuckDB.js";
import type { IDatabase, DatabaseType, DatabaseConfig } from "./types.js";

/**
 * Adapter to make SQLite DatabaseConnection compatible with IDatabase interface
 */
class SQLiteAdapter implements IDatabase {
  constructor(private db: DatabaseConnection) {}

  async initialize(): Promise<void> {
    await this.db.initialize();
  }

  close(): void {
    this.db.close();
  }

  query<T = any>(sql: string, params?: any[]): T[] {
    return this.db.query<T>(sql, params);
  }

  queryOne<T = any>(sql: string, params?: any[]): T | undefined {
    return this.db.queryOne<T>(sql, params);
  }

  execute(sql: string, params?: any[]): any {
    return this.db.execute(sql, params);
  }

  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn);
  }

  getConnection() {
    return this.db.getConnection();
  }
}

/**
 * Adapter to make DuckDB DuckDBConnection compatible with IDatabase interface
 */
class DuckDBAdapter implements IDatabase {
  constructor(private db: DuckDBConnection) {}

  async initialize(): Promise<void> {
    await this.db.initialize();
  }

  async close(): Promise<void> {
    await this.db.close();
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    return this.db.query<T>(sql, params);
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
    return this.db.queryOne<T>(sql, params);
  }

  async execute(sql: string, params?: any[]): Promise<any> {
    return this.db.execute(sql, params);
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.db.transaction(fn);
  }

  getConnection() {
    return this.db.getConnection();
  }
}

/**
 * Get database type from environment or config
 */
function getDatabaseType(): DatabaseType {
  const dbType = process.env.DB_TYPE?.toLowerCase();
  if (dbType === 'duckdb') return 'duckdb';
  if (dbType === 'sqlite') return 'sqlite';

  // Default to SQLite for backward compatibility
  return 'sqlite';
}

/**
 * Get database path from environment
 */
function getDatabasePath(type: DatabaseType): string {
  if (type === 'duckdb') {
    return process.env.DUCKDB_PATH || "./data/databases/properties.duckdb";
  } else {
    return process.env.DB_PATH || "./data/databases/properties.db";
  }
}

/**
 * Create database connection based on configuration
 */
export async function createDatabaseConnection(config?: DatabaseConfig): Promise<IDatabase> {
  const type = config?.type || getDatabaseType();
  const path = config?.path || getDatabasePath(type);

  if (type === 'duckdb') {
    console.log(`Creating DuckDB connection at: ${path}`);
    const db = new DuckDBConnection(path);
    await db.initialize();
    return new DuckDBAdapter(db);
  } else {
    console.log(`Creating SQLite connection at: ${path}`);
    const db = new DatabaseConnection(path);
    await db.initialize();
    return new SQLiteAdapter(db);
  }
}

// Singleton instance
let dbInstance: IDatabase | null = null;

/**
 * Get or create database connection instance (singleton)
 */
export async function getDatabase(config?: DatabaseConfig): Promise<IDatabase> {
  if (!dbInstance) {
    dbInstance = await createDatabaseConnection(config);
  }
  return dbInstance;
}

/**
 * Initialize database (convenience function)
 * This maintains backward compatibility with existing code
 */
export async function initDatabase(dbPath?: string): Promise<any> {
  const type = getDatabaseType();
  const path = dbPath || getDatabasePath(type);

  const db = await createDatabaseConnection({ type, path });

  // For backward compatibility, return the underlying connection
  if (type === 'duckdb') {
    return (db as DuckDBAdapter)['db'];
  } else {
    return (db as SQLiteAdapter)['db'];
  }
}

/**
 * Reset database connection (useful for testing)
 */
export function resetDatabaseConnection(): void {
  dbInstance = null;
}
