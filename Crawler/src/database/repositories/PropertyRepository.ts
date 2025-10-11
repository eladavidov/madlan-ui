/**
 * Property Repository
 * CRUD operations for properties table
 * Updated for DuckDB async operations
 */

import type { DuckDBConnection } from "../connectionDuckDB.js";
import type { Property, PropertyInput, PropertyUpdate } from "../../models/Property.js";

export class PropertyRepository {
  constructor(private db: DuckDBConnection) {}

  /**
   * Insert a new property
   */
  public async insert(property: PropertyInput): Promise<void> {
    // Filter out undefined values and convert booleans to numbers
    const cleanedProperty: any = {};
    for (const [key, value] of Object.entries(property)) {
      if (value !== undefined) {
        // Convert boolean to number for DuckDB
        if (typeof value === "boolean") {
          cleanedProperty[key] = value ? 1 : 0;
        } else {
          cleanedProperty[key] = value;
        }
      }
    }

    const fields = Object.keys(cleanedProperty);
    const placeholders = fields.map(() => "?").join(", ");
    const values = fields.map((field) => cleanedProperty[field]);

    const sql = `
      INSERT INTO properties (${fields.join(", ")})
      VALUES (${placeholders})
    `;

    await this.db.execute(sql, values);
  }

  /**
   * Upsert (insert or update) a property
   */
  public async upsert(property: PropertyInput): Promise<void> {
    const existing = await this.findById(property.id);

    if (existing) {
      // Update existing property
      const updateData: PropertyUpdate = {
        ...property,
        last_crawled_at: new Date().toISOString(),
        crawl_count: existing.crawl_count + 1,
      };
      await this.update(updateData);
    } else {
      // Insert new property
      await this.insert({
        ...property,
        first_crawled_at: new Date().toISOString(),
        last_crawled_at: new Date().toISOString(),
        crawl_count: 1,
      });
    }
  }

  /**
   * Update an existing property
   */
  public async update(property: PropertyUpdate): Promise<void> {
    const { id, ...fields } = property;

    // Filter out undefined values and convert booleans to numbers
    const cleanedFields: any = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        // Convert boolean to number for DuckDB
        if (typeof value === "boolean") {
          cleanedFields[key] = value ? 1 : 0;
        } else {
          cleanedFields[key] = value;
        }
      }
    }

    const setClause = Object.keys(cleanedFields)
      .map((field) => `${field} = ?`)
      .join(", ");
    const values = [...Object.values(cleanedFields), id];

    const sql = `
      UPDATE properties
      SET ${setClause}
      WHERE id = ?
    `;

    await this.db.execute(sql, values);
  }

  /**
   * Find property by ID
   */
  public async findById(id: string): Promise<Property | undefined> {
    return await this.db.queryOne<Property>(
      "SELECT * FROM properties WHERE id = ?",
      [id]
    );
  }

  /**
   * Find all properties
   */
  public async findAll(limit?: number, offset?: number): Promise<Property[]> {
    let sql = "SELECT * FROM properties ORDER BY first_crawled_at DESC";
    const params: any[] = [];

    if (limit) {
      sql += " LIMIT ?";
      params.push(limit);
    }

    if (offset) {
      sql += " OFFSET ?";
      params.push(offset);
    }

    return await this.db.query<Property>(sql, params);
  }

  /**
   * Find properties by city
   */
  public async findByCity(city: string, limit?: number): Promise<Property[]> {
    let sql = "SELECT * FROM properties WHERE city = ? ORDER BY first_crawled_at DESC";
    const params: any[] = [city];

    if (limit) {
      sql += " LIMIT ?";
      params.push(limit);
    }

    return await this.db.query<Property>(sql, params);
  }

  /**
   * Find properties by URL
   */
  public async findByUrl(url: string): Promise<Property | undefined> {
    return await this.db.queryOne<Property>(
      "SELECT * FROM properties WHERE url = ?",
      [url]
    );
  }

  /**
   * Count total properties
   */
  public async count(): Promise<number> {
    const result = await this.db.queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM properties"
    );
    return result?.count || 0;
  }

  /**
   * Count properties by city
   */
  public async countByCity(city: string): Promise<number> {
    const result = await this.db.queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM properties WHERE city = ?",
      [city]
    );
    return result?.count || 0;
  }

  /**
   * Delete property by ID
   */
  public async delete(id: string): Promise<void> {
    await this.db.execute("DELETE FROM properties WHERE id = ?", [id]);
  }

  /**
   * Find properties with missing data
   */
  public async findIncomplete(): Promise<Property[]> {
    return await this.db.query<Property>(
      "SELECT * FROM properties WHERE data_complete = 0 OR has_errors = 1"
    );
  }

  /**
   * Find properties needing re-crawl (older than N days)
   */
  public async findStale(days: number = 30): Promise<Property[]> {
    return await this.db.query<Property>(
      `SELECT * FROM properties
       WHERE last_crawled_at < CURRENT_TIMESTAMP - INTERVAL '${days} days'`
    );
  }
}
