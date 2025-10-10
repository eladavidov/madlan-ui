/**
 * Schools Repository
 * Manages nearby_schools table operations
 */

import type { DuckDBConnection } from "../connectionDuckDB.js";
import type { NearbySchool, NearbySchoolInput } from "../../models/Property.js";

export class SchoolsRepository {
  constructor(private db: DuckDBConnection) {}

  /**
   * Insert a single school record
   */
  async insert(school: NearbySchoolInput): Promise<void> {
    const sql = `
      INSERT INTO nearby_schools (
        property_id, school_name, school_type,
        grades_offered, distance_meters
      ) VALUES (?, ?, ?, ?, ?)
    `;

    await this.db.execute(sql, [
      school.property_id,
      school.school_name,
      school.school_type || null,
      school.grades_offered || null,
      school.distance_meters || null
    ]);
  }

  /**
   * Insert multiple school records (batch)
   */
  async insertMany(schools: NearbySchoolInput[]): Promise<void> {
    for (const school of schools) {
      await this.insert(school);
    }
  }

  /**
   * Get all schools for a property
   */
  async findByPropertyId(propertyId: string): Promise<NearbySchool[]> {
    const sql = `
      SELECT * FROM nearby_schools
      WHERE property_id = ?
      ORDER BY distance_meters ASC NULLS LAST
    `;

    return await this.db.query<NearbySchool>(sql, [propertyId]);
  }

  /**
   * Delete all schools for a property
   */
  async deleteByPropertyId(propertyId: string): Promise<void> {
    const sql = `DELETE FROM nearby_schools WHERE property_id = ?`;
    await this.db.execute(sql, [propertyId]);
  }

  /**
   * Get count of schools for a property
   */
  async countByPropertyId(propertyId: string): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count FROM nearby_schools
      WHERE property_id = ?
    `;

    const result = await this.db.queryOne<{ count: number }>(sql, [propertyId]);
    return result?.count || 0;
  }
}
