/**
 * DuckDB Database Connection Manager
 * Handles DuckDB database initialization, migrations, and connection management
 */

import duckdb from "duckdb";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DuckDBConnection {
  private db: duckdb.Database | null = null;
  private connection: duckdb.Connection | null = null;
  private dbPath: string;

  constructor(dbPath: string = "./data/databases/properties.duckdb") {
    this.dbPath = dbPath;
  }

  /**
   * Initialize DuckDB connection and run migrations
   */
  public async initialize(): Promise<void> {
    // Ensure database directory exists
    const dbDir = dirname(this.dbPath);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    // Create DuckDB instance with promisified callback
    this.db = await new Promise<duckdb.Database>((resolve, reject) => {
      const db = new duckdb.Database(this.dbPath, (err) => {
        if (err) {
          reject(new Error(`Failed to create DuckDB database: ${err.message}`));
        } else {
          resolve(db);
        }
      });
    });

    // Get connection
    this.connection = this.db.connect();

    // Run migrations if needed
    await this.runMigrations();

    console.log(`DuckDB database initialized at: ${this.dbPath}`);
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    if (!this.connection) throw new Error("Database not connected");

    // Check if migrations table exists
    const tableCheckQuery = `
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_name = 'migrations'
    `;

    const result = await this.queryOne<{ count: number }>(tableCheckQuery);
    const migrationsTableExists = result && result.count > 0;

    if (!migrationsTableExists) {
      // Create migrations tracking table
      await this.execute(`
        CREATE TABLE migrations (
          id INTEGER PRIMARY KEY,
          name VARCHAR UNIQUE NOT NULL,
          applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Get applied migrations
    const appliedMigrations = await this.query<{ name: string }>(
      "SELECT name FROM migrations"
    );
    const appliedSet = new Set(appliedMigrations.map((m) => m.name));

    // Check for 002_duckdb_migration
    if (!appliedSet.has("002_duckdb_migration")) {
      console.log("Running migration: 002_duckdb_migration");

      // SQL files are not compiled, so read from src directory
      // In development: src/database/schema-duckdb.sql
      // In production: ../src/database/schema-duckdb.sql (from dist)
      let migrationPath = join(__dirname, "schema-duckdb.sql");
      if (!existsSync(migrationPath)) {
        // Try from src directory (when running from dist)
        migrationPath = join(__dirname, "..", "..", "src", "database", "schema-duckdb.sql");
      }

      if (!existsSync(migrationPath)) {
        throw new Error(`Migration file not found: ${migrationPath}`);
      }

      const migrationSql = readFileSync(migrationPath, "utf-8");

      // Execute the migration in two phases:
      // Phase 1: CREATE TABLE and CREATE VIEW statements
      // Phase 2: COMMENT ON statements

      // Split SQL into individual statements more carefully
      const allStatements = this.splitSqlStatements(migrationSql);

      // Phase 1: Execute CREATE statements
      const createStatements = allStatements.filter(
        (s) => s.toUpperCase().startsWith("CREATE ")
      );

      console.log(`   Executing ${createStatements.length} CREATE statements...`);
      for (const statement of createStatements) {
        try {
          await this.execute(statement);
        } catch (error: any) {
          // Ignore "already exists" errors for initial setup
          if (!error.message.includes("already exists")) {
            console.error(`Error executing CREATE: ${statement.substring(0, 100)}...`);
            throw error;
          }
        }
      }

      // Phase 2: Execute COMMENT statements
      const commentStatements = allStatements.filter(
        (s) => s.toUpperCase().startsWith("COMMENT ON")
      );

      console.log(`   Executing ${commentStatements.length} COMMENT statements...`);
      for (const statement of commentStatements) {
        try {
          await this.execute(statement);
        } catch (error: any) {
          // Log but don't fail on comment errors
          console.warn(`   Warning: Failed to add comment: ${error.message}`);
        }
      }

      // Record migration
      await this.execute(
        "INSERT INTO migrations (id, name) VALUES (?, ?)",
        [2, "002_duckdb_migration"]
      );

      console.log("Migration 002_duckdb_migration applied successfully");
    }
  }

  /**
   * Get DuckDB connection
   */
  public getConnection(): duckdb.Connection {
    if (!this.connection) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.connection;
  }

  /**
   * Close database connection
   */
  public async close(): Promise<void> {
    if (this.connection) {
      await promisify(this.connection.close.bind(this.connection))();
      this.connection = null;
    }
    if (this.db) {
      await promisify(this.db.close.bind(this.db))();
      this.db = null;
      console.log("DuckDB connection closed");
    }
  }

  /**
   * Execute a query with parameters
   */
  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.connection) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      this.connection!.all(sql, ...(params || []), (err, result) => {
        if (err) reject(err);
        else resolve(result as T[]);
      });
    });
  }

  /**
   * Execute a single-row query
   */
  public async queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
    const results = await this.query<T>(sql, params);
    return results[0];
  }

  /**
   * Execute an insert/update/delete statement
   */
  public async execute(sql: string, params?: any[]): Promise<any> {
    if (!this.connection) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      this.connection!.run(sql, ...(params || []), (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  /**
   * Begin a transaction
   */
  public async transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.connection) throw new Error("Database not initialized");

    await this.execute("BEGIN TRANSACTION");
    try {
      const result = await fn();
      await this.execute("COMMIT");
      return result;
    } catch (error) {
      await this.execute("ROLLBACK");
      throw error;
    }
  }

  /**
   * Execute raw SQL (for complex queries)
   */
  public async exec(sql: string): Promise<void> {
    if (!this.connection) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      this.connection!.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Split SQL file into individual statements
   * Handles multi-line statements properly
   */
  private splitSqlStatements(sql: string): string[] {
    const statements: string[] = [];
    let currentStatement = "";
    let inString = false;
    let stringChar = "";

    const lines = sql.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip comments and empty lines when not in a statement
      if (!currentStatement && (trimmedLine.startsWith("--") || trimmedLine.length === 0)) {
        continue;
      }

      // Track string literals to avoid splitting on semicolons inside strings
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if ((char === "'" || char === '"') && !inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar && inString && line[i - 1] !== "\\") {
          inString = false;
          stringChar = "";
        }
      }

      currentStatement += line + "\n";

      // Check if statement is complete (ends with semicolon, not in string)
      if (trimmedLine.endsWith(";") && !inString) {
        const statement = currentStatement.trim();
        if (statement.length > 1) {
          // Remove trailing semicolon and add to statements
          statements.push(statement.slice(0, -1).trim());
        }
        currentStatement = "";
      }
    }

    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }

    return statements;
  }
}

// Singleton instance
let duckDbInstance: DuckDBConnection | null = null;

/**
 * Get or create DuckDB connection instance
 */
export function getDuckDB(dbPath?: string): DuckDBConnection {
  if (!duckDbInstance) {
    duckDbInstance = new DuckDBConnection(
      dbPath || process.env.DUCKDB_PATH || "./data/databases/properties.duckdb"
    );
  }
  return duckDbInstance;
}

/**
 * Initialize DuckDB database (convenience function)
 */
export async function initDuckDB(dbPath?: string): Promise<DuckDBConnection> {
  const db = getDuckDB(dbPath);
  await db.initialize();
  return db;
}
