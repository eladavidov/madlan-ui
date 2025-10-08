/**
 * Property Repository
 * CRUD operations for properties table
 */

import type { DatabaseConnection } from "../connection.js";
import type { Property, PropertyInput, PropertyUpdate } from "../../models/Property.js";

export class PropertyRepository {
  constructor(private db: DatabaseConnection) {}

  /**
   * Insert a new property
   */
  public insert(property: PropertyInput): void {
    // Filter out undefined values and convert booleans to numbers
    const cleanedProperty: any = {};
    for (const [key, value] of Object.entries(property)) {
      if (value !== undefined) {
        // Convert boolean to number for SQLite
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

    this.db.execute(sql, values);
  }

  /**
   * Upsert (insert or update) a property
   */
  public upsert(property: PropertyInput): void {
    const existing = this.findById(property.id);

    if (existing) {
      // Update existing property
      const updateData: PropertyUpdate = {
        ...property,
        last_crawled_at: new Date().toISOString(),
        crawl_count: existing.crawl_count + 1,
      };
      this.update(updateData);
    } else {
      // Insert new property
      this.insert({
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
  public update(property: PropertyUpdate): void {
    const { id, ...fields } = property;

    // Filter out undefined values and convert booleans to numbers
    const cleanedFields: any = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        // Convert boolean to number for SQLite
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

    this.db.execute(sql, values);
  }

  /**
   * Find property by ID
   */
  public findById(id: string): Property | undefined {
    return this.db.queryOne<Property>(
      "SELECT * FROM properties WHERE id = ?",
      [id]
    );
  }

  /**
   * Find all properties
   */
  public findAll(limit?: number, offset?: number): Property[] {
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

    return this.db.query<Property>(sql, params);
  }

  /**
   * Find properties by city
   */
  public findByCity(city: string, limit?: number): Property[] {
    let sql = "SELECT * FROM properties WHERE city = ? ORDER BY first_crawled_at DESC";
    const params: any[] = [city];

    if (limit) {
      sql += " LIMIT ?";
      params.push(limit);
    }

    return this.db.query<Property>(sql, params);
  }

  /**
   * Find properties by URL
   */
  public findByUrl(url: string): Property | undefined {
    return this.db.queryOne<Property>(
      "SELECT * FROM properties WHERE url = ?",
      [url]
    );
  }

  /**
   * Count total properties
   */
  public count(): number {
    const result = this.db.queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM properties"
    );
    return result?.count || 0;
  }

  /**
   * Count properties by city
   */
  public countByCity(city: string): number {
    const result = this.db.queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM properties WHERE city = ?",
      [city]
    );
    return result?.count || 0;
  }

  /**
   * Delete property by ID
   */
  public delete(id: string): void {
    this.db.execute("DELETE FROM properties WHERE id = ?", [id]);
  }

  /**
   * Find properties with missing data
   */
  public findIncomplete(): Property[] {
    return this.db.query<Property>(
      "SELECT * FROM properties WHERE data_complete = 0 OR has_errors = 1"
    );
  }

  /**
   * Find properties needing re-crawl (older than N days)
   */
  public findStale(days: number = 30): Property[] {
    return this.db.query<Property>(
      `SELECT * FROM properties
       WHERE datetime(last_crawled_at) < datetime('now', '-${days} days')`
    );
  }
}
