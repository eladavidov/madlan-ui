/**
 * Price Comparison Repository
 * Manages price_comparisons table operations
 */

import type { DuckDBConnection } from "../connectionDuckDB.js";
import type { PriceComparison, PriceComparisonInput } from "../../models/Property.js";

export class PriceComparisonRepository {
  constructor(private db: DuckDBConnection) {}

  /**
   * Insert a single price comparison record
   */
  async insert(comparison: PriceComparisonInput): Promise<void> {
    const sql = `
      INSERT INTO price_comparisons (
        property_id, room_count, average_price,
        old_price, new_price, price_trend
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(sql, [
      comparison.property_id,
      comparison.room_count,
      comparison.average_price || null,
      comparison.old_price || null,
      comparison.new_price || null,
      comparison.price_trend || null
    ]);
  }

  /**
   * Insert multiple price comparison records (batch)
   */
  async insertMany(comparisons: PriceComparisonInput[]): Promise<void> {
    for (const comparison of comparisons) {
      await this.insert(comparison);
    }
  }

  /**
   * Get all price comparisons for a property
   */
  async findByPropertyId(propertyId: string): Promise<PriceComparison[]> {
    const sql = `
      SELECT * FROM price_comparisons
      WHERE property_id = ?
      ORDER BY room_count ASC
    `;

    return await this.db.query<PriceComparison>(sql, [propertyId]);
  }

  /**
   * Delete all price comparisons for a property
   */
  async deleteByPropertyId(propertyId: string): Promise<void> {
    const sql = `DELETE FROM price_comparisons WHERE property_id = ?`;
    await this.db.execute(sql, [propertyId]);
  }

  /**
   * Get count of price comparisons for a property
   */
  async countByPropertyId(propertyId: string): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count FROM price_comparisons
      WHERE property_id = ?
    `;

    const result = await this.db.queryOne<{ count: number }>(sql, [propertyId]);
    return result?.count || 0;
  }
}
