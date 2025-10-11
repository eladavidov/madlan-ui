/**
 * Ratings Repository
 * Manages neighborhood_ratings table operations
 */

import type { DuckDBConnection } from "../connectionDuckDB.js";
import type { NeighborhoodRatings, NeighborhoodRatingsInput } from "../../models/Property.js";

export class RatingsRepository {
  constructor(private db: DuckDBConnection) {}

  /**
   * Insert or update ratings for a property (upsert)
   */
  async upsert(ratings: NeighborhoodRatingsInput): Promise<void> {
    // First, try to delete existing ratings
    await this.deleteByPropertyId(ratings.property_id);

    // Generate manual ID (DuckDB doesn't support sequences)
    const id = await this.getNextId();

    // Then insert new ratings
    const sql = `
      INSERT INTO neighborhood_ratings (
        id, property_id, community_feeling, cleanliness_maintenance,
        schools_quality, public_transport, shopping_convenience,
        entertainment_leisure, overall_rating
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(sql, [
      id,
      ratings.property_id,
      ratings.community_feeling || null,
      ratings.cleanliness_maintenance || null,
      ratings.schools_quality || null,
      ratings.public_transport || null,
      ratings.shopping_convenience || null,
      ratings.entertainment_leisure || null,
      ratings.overall_rating || null
    ]);
  }

  /**
   * Get next available ID (manual ID generation for DuckDB)
   */
  private async getNextId(): Promise<number> {
    const sql = `SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM neighborhood_ratings`;
    const result = await this.db.queryOne<{ next_id: number }>(sql, []);
    return result?.next_id || 1;
  }

  /**
   * Get ratings for a property
   */
  async findByPropertyId(propertyId: string): Promise<NeighborhoodRatings | null> {
    const sql = `
      SELECT * FROM neighborhood_ratings
      WHERE property_id = ?
    `;

    const result = await this.db.queryOne<NeighborhoodRatings>(sql, [propertyId]);
    return result || null;
  }

  /**
   * Delete ratings for a property
   */
  async deleteByPropertyId(propertyId: string): Promise<void> {
    const sql = `DELETE FROM neighborhood_ratings WHERE property_id = ?`;
    await this.db.execute(sql, [propertyId]);
  }
}
