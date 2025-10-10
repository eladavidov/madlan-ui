/**
 * Database Interface Types
 * Unified interface for both SQLite and DuckDB connections
 */

export interface IDatabase {
  initialize(): Promise<void>;
  close(): Promise<void> | void;
  query<T = any>(sql: string, params?: any[]): Promise<T[]> | T[];
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined> | T | undefined;
  execute(sql: string, params?: any[]): Promise<any> | any;
  transaction<T>(fn: () => T | Promise<T>): T | Promise<T>;
}

export type DatabaseType = 'sqlite' | 'duckdb';

export interface DatabaseConfig {
  type: DatabaseType;
  path?: string;
}
