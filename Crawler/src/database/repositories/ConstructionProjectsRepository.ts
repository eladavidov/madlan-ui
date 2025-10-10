/**
 * Construction Projects Repository
 * Manages new_construction_projects table operations
 */

import type { DuckDBConnection } from "../connectionDuckDB.js";
import type { ConstructionProject, ConstructionProjectInput } from "../../models/Property.js";

export class ConstructionProjectsRepository {
  constructor(private db: DuckDBConnection) {}

  /**
   * Insert a single construction project record
   */
  async insert(project: ConstructionProjectInput): Promise<void> {
    const sql = `
      INSERT INTO new_construction_projects (
        property_id, project_name, project_location,
        distance_meters, project_status, completion_date
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(sql, [
      project.property_id,
      project.project_name || null,
      project.project_location || null,
      project.distance_meters || null,
      project.project_status || null,
      project.completion_date || null
    ]);
  }

  /**
   * Insert multiple construction project records (batch)
   */
  async insertMany(projects: ConstructionProjectInput[]): Promise<void> {
    for (const project of projects) {
      await this.insert(project);
    }
  }

  /**
   * Get all construction projects for a property
   */
  async findByPropertyId(propertyId: string): Promise<ConstructionProject[]> {
    const sql = `
      SELECT * FROM new_construction_projects
      WHERE property_id = ?
      ORDER BY distance_meters ASC NULLS LAST
    `;

    return await this.db.query<ConstructionProject>(sql, [propertyId]);
  }

  /**
   * Delete all construction projects for a property
   */
  async deleteByPropertyId(propertyId: string): Promise<void> {
    const sql = `DELETE FROM new_construction_projects WHERE property_id = ?`;
    await this.db.execute(sql, [propertyId]);
  }

  /**
   * Get count of construction projects for a property
   */
  async countByPropertyId(propertyId: string): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count FROM new_construction_projects
      WHERE property_id = ?
    `;

    const result = await this.db.queryOne<{ count: number }>(sql, [propertyId]);
    return result?.count || 0;
  }
}
