/**
 * Crawl Session Repository
 * CRUD operations for crawl_sessions and crawl_errors tables
 */

import type { DatabaseConnection } from "../connection.js";
import type {
  CrawlSession,
  CrawlError,
  SessionSummary,
} from "../../models/Property.js";

export class CrawlSessionRepository {
  constructor(private db: DatabaseConnection) {}

  /**
   * Start a new crawl session
   */
  public startSession(
    sessionId: string,
    targetCity?: string,
    maxProperties?: number
  ): number {
    const sql = `
      INSERT INTO crawl_sessions (
        session_id, target_city, max_properties, status
      )
      VALUES (?, ?, ?, 'running')
    `;

    const result = this.db.execute(sql, [
      sessionId,
      targetCity || null,
      maxProperties || null,
    ]);

    return result.lastInsertRowid as number;
  }

  /**
   * Update session statistics
   */
  public updateStats(
    sessionId: string,
    stats: {
      properties_found?: number;
      properties_new?: number;
      properties_updated?: number;
      properties_failed?: number;
      images_downloaded?: number;
      images_failed?: number;
    }
  ): void {
    const fields = Object.keys(stats);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = [...Object.values(stats), sessionId];

    const sql = `
      UPDATE crawl_sessions
      SET ${setClause}
      WHERE session_id = ?
    `;

    this.db.execute(sql, values);
  }

  /**
   * Complete a crawl session
   */
  public completeSession(sessionId: string, success: boolean, errorMessage?: string): void {
    const sql = `
      UPDATE crawl_sessions
      SET status = ?,
          end_time = datetime('now'),
          error_message = ?
      WHERE session_id = ?
    `;

    this.db.execute(sql, [
      success ? "completed" : "failed",
      errorMessage || null,
      sessionId,
    ]);
  }

  /**
   * Mark session as interrupted
   */
  public interruptSession(sessionId: string): void {
    const sql = `
      UPDATE crawl_sessions
      SET status = 'interrupted',
          end_time = datetime('now')
      WHERE session_id = ?
    `;

    this.db.execute(sql, [sessionId]);
  }

  /**
   * Find session by ID
   */
  public findBySessionId(sessionId: string): CrawlSession | undefined {
    return this.db.queryOne<CrawlSession>(
      "SELECT * FROM crawl_sessions WHERE session_id = ?",
      [sessionId]
    );
  }

  /**
   * Get recent sessions
   */
  public getRecentSessions(limit: number = 10): SessionSummary[] {
    return this.db.query<SessionSummary>(
      "SELECT * FROM v_session_summary LIMIT ?",
      [limit]
    );
  }

  /**
   * Get session statistics
   */
  public getSessionStats(sessionId: string): CrawlSession | undefined {
    return this.findBySessionId(sessionId);
  }

  /**
   * Log a crawl error
   */
  public logError(
    sessionId: string,
    errorType: string,
    errorMessage: string,
    errorStack?: string,
    url?: string,
    propertyId?: string
  ): number {
    const sql = `
      INSERT INTO crawl_errors (
        session_id, error_type, error_message, error_stack, url, property_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = this.db.execute(sql, [
      sessionId,
      errorType,
      errorMessage,
      errorStack || null,
      url || null,
      propertyId || null,
    ]);

    return result.lastInsertRowid as number;
  }

  /**
   * Get errors for a session
   */
  public getSessionErrors(sessionId: string): CrawlError[] {
    return this.db.query<CrawlError>(
      `SELECT * FROM crawl_errors
       WHERE session_id = ?
       ORDER BY occurred_at DESC`,
      [sessionId]
    );
  }

  /**
   * Get error statistics
   */
  public getErrorStats(sessionId: string): Record<string, number> {
    const errors = this.db.query<{ error_type: string; count: number }>(
      `SELECT error_type, COUNT(*) as count
       FROM crawl_errors
       WHERE session_id = ?
       GROUP BY error_type`,
      [sessionId]
    );

    return errors.reduce(
      (acc, { error_type, count }) => {
        acc[error_type] = count;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Delete old sessions (older than N days)
   */
  public deleteOldSessions(days: number = 90): void {
    this.db.execute(
      `DELETE FROM crawl_sessions
       WHERE datetime(start_time) < datetime('now', '-${days} days')`
    );
  }

  /**
   * Get overall statistics
   */
  public getOverallStats(): {
    total_sessions: number;
    completed_sessions: number;
    failed_sessions: number;
    total_properties: number;
    total_errors: number;
  } {
    const sessionStats = this.db.queryOne<{
      total: number;
      completed: number;
      failed: number;
    }>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM crawl_sessions
    `);

    const propertiesCount = this.db.queryOne<{ total: number }>(
      "SELECT SUM(properties_found) as total FROM crawl_sessions"
    );

    const errorsCount = this.db.queryOne<{ total: number }>(
      "SELECT COUNT(*) as total FROM crawl_errors"
    );

    return {
      total_sessions: sessionStats?.total || 0,
      completed_sessions: sessionStats?.completed || 0,
      failed_sessions: sessionStats?.failed || 0,
      total_properties: propertiesCount?.total || 0,
      total_errors: errorsCount?.total || 0,
    };
  }
}
