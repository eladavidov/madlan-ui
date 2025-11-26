/**
 * Image Repository
 * CRUD operations for property_images table
 * Updated to support BLOB storage in DuckDB
 */

import type { DuckDBConnection } from "../connectionDuckDB.js";
import type { PropertyImage } from "../../models/Property.js";

export class ImageRepository {
  constructor(private db: DuckDBConnection) {}

  /**
   * Insert a new image with optional BLOB data
   */
  public async insert(image: Omit<PropertyImage, "id" | "created_at"> & { image_data?: Buffer }): Promise<number> {
    // Generate next ID manually for DuckDB
    const nextIdResult = await this.db.queryOne<{ nextId: number }>(
      "SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM property_images"
    );
    const nextId = nextIdResult?.nextId || 1;

    const sql = `
      INSERT INTO property_images (
        id, property_id, image_url, image_order, is_main_image,
        image_type, width, height, file_size
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(sql, [
      nextId,
      image.property_id,
      image.image_url,
      image.image_order,
      image.is_main_image ? 1 : 0,
      image.image_type ?? null,
      image.width ?? null,
      image.height ?? null,
      image.file_size ?? null,
    ]);

    return nextId;
  }

  /**
   * Insert multiple images for a property
   */
  public async insertMany(images: (Omit<PropertyImage, "id" | "created_at"> & { image_data?: Buffer })[]): Promise<void> {
    await this.db.transaction(async () => {
      for (const image of images) {
        await this.insert(image);
      }
    });
  }

  /**
   * Find all images for a property
   */
  public async findByPropertyId(propertyId: string): Promise<PropertyImage[]> {
    return this.db.query<PropertyImage>(
      `SELECT * FROM property_images
       WHERE property_id = ?
       ORDER BY image_order ASC`,
      [propertyId]
    );
  }

  /**
   * Find main image for a property
   */
  public async findMainImage(propertyId: string): Promise<PropertyImage | undefined> {
    return this.db.queryOne<PropertyImage>(
      `SELECT * FROM property_images
       WHERE property_id = ? AND is_main_image = 1
       LIMIT 1`,
      [propertyId]
    );
  }

  /**
   * Update download status with local path
   */
  public async updateDownloadStatus(
    id: number,
    success: boolean,
    localPath?: string,
    error?: string
  ): Promise<void> {
    const sql = `
      UPDATE property_images
      SET is_downloaded = ?,
          local_path = ?,
          download_date = CURRENT_TIMESTAMP,
          download_error = ?
      WHERE id = ?
    `;

    await this.db.execute(sql, [
      success ? 1 : 0,
      localPath || null,
      error || null,
      id,
    ]);
  }

  /**
   * Find images that need downloading
   */
  public async findPendingDownloads(limit?: number): Promise<PropertyImage[]> {
    let sql = `
      SELECT * FROM property_images
      WHERE is_downloaded = 0
      ORDER BY id ASC
    `;

    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    return this.db.query<PropertyImage>(sql);
  }

  /**
   * Count images for a property
   */
  public async countByPropertyId(propertyId: string): Promise<number> {
    const result = await this.db.queryOne<{ count: number | bigint }>(
      "SELECT COUNT(*) as count FROM property_images WHERE property_id = ?",
      [propertyId]
    );
    return result?.count ? Number(result.count) : 0;
  }

  /**
   * Count downloaded images for a property
   */
  public async countDownloadedByPropertyId(propertyId: string): Promise<number> {
    const result = await this.db.queryOne<{ count: number | bigint }>(
      `SELECT COUNT(*) as count FROM property_images
       WHERE property_id = ? AND is_downloaded = 1`,
      [propertyId]
    );
    return result?.count ? Number(result.count) : 0;
  }

  /**
   * Delete all images for a property
   */
  public async deleteByPropertyId(propertyId: string): Promise<void> {
    await this.db.execute("DELETE FROM property_images WHERE property_id = ?", [
      propertyId,
    ]);
  }

  /**
   * Get image statistics
   */
  public async getStats(): Promise<{
    total: number;
    downloaded: number;
    pending: number;
    failed: number;
  }> {
    const result = await this.db.queryOne<{
      total: number;
      downloaded: number;
      failed: number;
    }>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_downloaded = 1 THEN 1 ELSE 0 END) as downloaded,
        SUM(CASE WHEN download_error IS NOT NULL THEN 1 ELSE 0 END) as failed
      FROM property_images
    `);

    return {
      total: result?.total || 0,
      downloaded: result?.downloaded || 0,
      pending: (result?.total || 0) - (result?.downloaded || 0),
      failed: result?.failed || 0,
    };
  }
}
