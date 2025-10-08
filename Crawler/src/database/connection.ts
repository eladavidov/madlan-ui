/**
 * Database Connection Manager
 * Handles SQLite database initialization, migrations, and connection management
 */

import Database from "better-sqlite3";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DatabaseConnection {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(dbPath: string = "./data/databases/properties.db") {
    this.dbPath = dbPath;
  }

  /**
   * Initialize database connection and run migrations
   */
  public async initialize(): Promise<void> {
    // Ensure database directory exists
    const dbDir = dirname(this.dbPath);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    // Connect to database
    this.db = new Database(this.dbPath);

    // Enable foreign keys
    this.db.pragma("foreign_keys = ON");

    // Run migrations if needed
    await this.runMigrations();

    console.log(`Database initialized at: ${this.dbPath}`);
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error("Database not connected");

    // Check if migrations table exists
    const migrationsTableExists = this.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'"
      )
      .get();

    if (!migrationsTableExists) {
      // Create migrations tracking table
      this.db.exec(`
        CREATE TABLE migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
    }

    // Get applied migrations
    const appliedMigrations = this.db
      .prepare("SELECT name FROM migrations")
      .all() as { name: string }[];

    const appliedSet = new Set(appliedMigrations.map((m) => m.name));

    // Check for 001_initial migration
    if (!appliedSet.has("001_initial")) {
      console.log("Running migration: 001_initial");
      const migrationPath = join(__dirname, "migrations", "001_initial.sql");

      if (!existsSync(migrationPath)) {
        throw new Error(`Migration file not found: ${migrationPath}`);
      }

      const migrationSql = readFileSync(migrationPath, "utf-8");
      this.db.exec(migrationSql);

      // Record migration
      this.db
        .prepare("INSERT INTO migrations (name) VALUES (?)")
        .run("001_initial");

      console.log("Migration 001_initial applied successfully");
    }
  }

  /**
   * Get database connection
   */
  public getConnection(): Database.Database {
    if (!this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log("Database connection closed");
    }
  }

  /**
   * Execute a query with parameters
   */
  public query<T = any>(sql: string, params?: any[]): T[] {
    if (!this.db) throw new Error("Database not initialized");
    const stmt = this.db.prepare(sql);
    return (params && params.length > 0 ? stmt.all(...params) : stmt.all()) as T[];
  }

  /**
   * Execute a single-row query
   */
  public queryOne<T = any>(sql: string, params?: any[]): T | undefined {
    if (!this.db) throw new Error("Database not initialized");
    const stmt = this.db.prepare(sql);
    return (params && params.length > 0 ? stmt.get(...params) : stmt.get()) as T | undefined;
  }

  /**
   * Execute an insert/update/delete statement
   */
  public execute(sql: string, params?: any[]): Database.RunResult {
    if (!this.db) throw new Error("Database not initialized");
    const stmt = this.db.prepare(sql);
    return params && params.length > 0 ? stmt.run(...params) : stmt.run();
  }

  /**
   * Begin a transaction
   */
  public transaction<T>(fn: () => T): T {
    if (!this.db) throw new Error("Database not initialized");
    return this.db.transaction(fn)();
  }
}

// Singleton instance
let dbInstance: DatabaseConnection | null = null;

/**
 * Get or create database connection instance
 */
export function getDatabase(dbPath?: string): DatabaseConnection {
  if (!dbInstance) {
    dbInstance = new DatabaseConnection(
      dbPath || process.env.DB_PATH || "./data/databases/properties.db"
    );
  }
  return dbInstance;
}

/**
 * Initialize database (convenience function)
 */
export async function initDatabase(dbPath?: string): Promise<DatabaseConnection> {
  const db = getDatabase(dbPath);
  await db.initialize();
  return db;
}
