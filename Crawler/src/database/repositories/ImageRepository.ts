/**
 * Image Repository
 * CRUD operations for property_images table
 */

import type { DatabaseConnection } from "../connection.js";
import type { PropertyImage } from "../../models/Property.js";

export class ImageRepository {
  constructor(private db: DatabaseConnection) {}

  /**
   * Insert a new image
   */
  public insert(image: Omit<PropertyImage, "id" | "created_at">): number {
    const sql = `
      INSERT INTO property_images (
        property_id, image_url, image_order, is_main_image,
        image_type, width, height, file_size
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = this.db.execute(sql, [
      image.property_id,
      image.image_url,
      image.image_order,
      image.is_main_image ? 1 : 0,
      image.image_type ?? null,
      image.width ?? null,
      image.height ?? null,
      image.file_size ?? null,
    ]);

    return result.lastInsertRowid as number;
  }

  /**
   * Insert multiple images for a property
   */
  public insertMany(images: Omit<PropertyImage, "id" | "created_at">[]): void {
    this.db.transaction(() => {
      for (const image of images) {
        this.insert(image);
      }
    });
  }

  /**
   * Find all images for a property
   */
  public findByPropertyId(propertyId: string): PropertyImage[] {
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
  public findMainImage(propertyId: string): PropertyImage | undefined {
    return this.db.queryOne<PropertyImage>(
      `SELECT * FROM property_images
       WHERE property_id = ? AND is_main_image = 1
       LIMIT 1`,
      [propertyId]
    );
  }

  /**
   * Update download status
   */
  public updateDownloadStatus(
    id: number,
    success: boolean,
    localPath?: string,
    error?: string
  ): void {
    const sql = `
      UPDATE property_images
      SET is_downloaded = ?,
          local_path = ?,
          download_date = datetime('now'),
          download_error = ?
      WHERE id = ?
    `;

    this.db.execute(sql, [
      success ? 1 : 0,
      localPath || null,
      error || null,
      id,
    ]);
  }

  /**
   * Find images that need downloading
   */
  public findPendingDownloads(limit?: number): PropertyImage[] {
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
  public countByPropertyId(propertyId: string): number {
    const result = this.db.queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM property_images WHERE property_id = ?",
      [propertyId]
    );
    return result?.count || 0;
  }

  /**
   * Count downloaded images for a property
   */
  public countDownloadedByPropertyId(propertyId: string): number {
    const result = this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM property_images
       WHERE property_id = ? AND is_downloaded = 1`,
      [propertyId]
    );
    return result?.count || 0;
  }

  /**
   * Delete all images for a property
   */
  public deleteByPropertyId(propertyId: string): void {
    this.db.execute("DELETE FROM property_images WHERE property_id = ?", [
      propertyId,
    ]);
  }

  /**
   * Get image statistics
   */
  public getStats(): {
    total: number;
    downloaded: number;
    pending: number;
    failed: number;
  } {
    const result = this.db.queryOne<{
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
