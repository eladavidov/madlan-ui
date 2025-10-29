/**
 * Property URL Cache Repository
 * CRUD operations for property_urls_cache table
 * Enables fast Phase 1 resume by caching discovered URLs
 */

import type { DuckDBConnection } from "../connectionDuckDB.js";

export interface PropertyUrlCache {
  id: number;
  url: string;
  search_page: number;
  city: string;
  discovered_at: Date;
  processed: boolean;
  processed_at?: Date;
  crawl_successful?: boolean;
  error_message?: string;
}

export interface CacheStats {
  total: number;
  processed: number;
  unprocessed: number;
  successful: number;
  failed: number;
  lastPage: number;
}

export class PropertyUrlCacheRepository {
  constructor(private db: DuckDBConnection) {}

  /**
   * Get next ID for manual insertion
   */
  private async getNextId(): Promise<number> {
    const result = await this.db.queryOne<{ nextId: number }>(
      "SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM property_urls_cache"
    );
    return result?.nextId || 1;
  }

  /**
   * Save a batch of URLs from a search page
   */
  public async saveBatch(
    urls: string[],
    searchPage: number,
    city: string
  ): Promise<number> {
    if (urls.length === 0) return 0;

    let inserted = 0;
    for (const url of urls) {
      try {
        const nextId = await this.getNextId();
        await this.db.execute(
          `
          INSERT INTO property_urls_cache (id, url, search_page, city)
          VALUES (?, ?, ?, ?)
          ON CONFLICT (url) DO NOTHING
        `,
          [nextId, url, searchPage, city]
        );
        inserted++;
      } catch (error: any) {
        // Ignore duplicates
        if (!error.message.includes("UNIQUE") && !error.message.includes("Constraint")) {
          console.error(`Error saving URL to cache: ${url}`, error);
        }
      }
    }

    return inserted;
  }

  /**
   * Get all unprocessed URLs for a city
   */
  public async getUnprocessedUrls(city: string): Promise<string[]> {
    const results = await this.db.query<{ url: string }>(
      `
      SELECT url
      FROM property_urls_cache
      WHERE city = ? AND processed = FALSE
      ORDER BY search_page, id
    `,
      [city]
    );

    return results.map((r) => r.url);
  }

  /**
   * Get all URLs for a city (processed or not)
   */
  public async getAllUrls(city: string): Promise<string[]> {
    const results = await this.db.query<{ url: string }>(
      `
      SELECT url
      FROM property_urls_cache
      WHERE city = ?
      ORDER BY search_page, id
    `,
      [city]
    );

    return results.map((r) => r.url);
  }

  /**
   * Mark a URL as processed
   */
  public async markProcessed(
    url: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await this.db.execute(
      `
      UPDATE property_urls_cache
      SET processed = TRUE,
          processed_at = CURRENT_TIMESTAMP,
          crawl_successful = ?,
          error_message = ?
      WHERE url = ?
    `,
      [success, errorMessage || null, url]
    );
  }

  /**
   * Get cache statistics for a city
   */
  public async getStats(city: string): Promise<CacheStats> {
    const result = await this.db.queryOne<{
      total: number;
      processed: number;
      successful: number;
      failed: number;
      lastPage: number;
    }>(
      `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN processed THEN 1 ELSE 0 END) as processed,
        SUM(CASE WHEN crawl_successful = TRUE THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN crawl_successful = FALSE THEN 1 ELSE 0 END) as failed,
        MAX(search_page) as lastPage
      FROM property_urls_cache
      WHERE city = ?
    `,
      [city]
    );

    return {
      total: Number(result?.total || 0),
      processed: Number(result?.processed || 0),
      unprocessed: Number(result?.total || 0) - Number(result?.processed || 0),
      successful: Number(result?.successful || 0),
      failed: Number(result?.failed || 0),
      lastPage: Number(result?.lastPage || 0),
    };
  }

  /**
   * Check if Phase 1 is complete for a city
   */
  public async isPhase1Complete(city: string, expectedPages: number): Promise<boolean> {
    const stats = await this.getStats(city);
    return stats.lastPage >= expectedPages;
  }

  /**
   * Get the last completed search page for a city
   */
  public async getLastCompletedPage(city: string): Promise<number> {
    const result = await this.db.queryOne<{ lastPage: number }>(
      `
      SELECT MAX(search_page) as lastPage
      FROM property_urls_cache
      WHERE city = ?
    `,
      [city]
    );

    return result?.lastPage || 0;
  }

  /**
   * Clear cache for a city (useful for fresh start)
   */
  public async clearCache(city: string): Promise<number> {
    const result = await this.db.queryOne<{ deleted: number }>(
      `
      DELETE FROM property_urls_cache
      WHERE city = ?
      RETURNING COUNT(*) as deleted
    `,
      [city]
    );

    return result?.deleted || 0;
  }

  /**
   * Clear all cache (all cities)
   */
  public async clearAllCache(): Promise<number> {
    const result = await this.db.queryOne<{ deleted: number }>(
      `
      DELETE FROM property_urls_cache
      RETURNING COUNT(*) as deleted
    `
    );

    return result?.deleted || 0;
  }

  /**
   * Get cache entries for a specific search page
   */
  public async getUrlsByPage(city: string, searchPage: number): Promise<string[]> {
    const results = await this.db.query<{ url: string }>(
      `
      SELECT url
      FROM property_urls_cache
      WHERE city = ? AND search_page = ?
      ORDER BY id
    `,
      [city, searchPage]
    );

    return results.map((r) => r.url);
  }
}
