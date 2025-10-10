/**
 * Crawl Session Repository
 * CRUD operations for crawl_sessions and crawl_errors tables
 * Updated for DuckDB async operations
 */

import type { DuckDBConnection } from "../connectionDuckDB.js";
import type {
  CrawlSession,
  CrawlError,
  SessionSummary,
} from "../../models/Property.js";

export class CrawlSessionRepository {
  constructor(private db: DuckDBConnection) {}

  /**
   * Start a new crawl session
   */
  public async startSession(
    sessionId: string,
    targetCity?: string,
    maxProperties?: number
  ): Promise<number> {
    // Generate next ID manually for DuckDB
    const nextIdResult = await this.db.queryOne<{ nextId: number }>(
      "SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM crawl_sessions"
    );
    const nextId = nextIdResult?.nextId || 1;

    const sql = `
      INSERT INTO crawl_sessions (
        id, session_id, target_city, max_properties, status
      )
      VALUES (?, ?, ?, ?, 'running')
    `;

    await this.db.execute(sql, [
      nextId,
      sessionId,
      targetCity || null,
      maxProperties || null,
    ]);

    return nextId;
  }

  /**
   * Update session statistics
   */
  public async updateStats(
    sessionId: string,
    stats: {
      properties_found?: number;
      properties_new?: number;
      properties_updated?: number;
      properties_failed?: number;
      images_downloaded?: number;
      images_failed?: number;
    }
  ): Promise<void> {
    const fields = Object.keys(stats);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = [...Object.values(stats), sessionId];

    const sql = `
      UPDATE crawl_sessions
      SET ${setClause}
      WHERE session_id = ?
    `;

    await this.db.execute(sql, values);
  }

  /**
   * Complete a crawl session
   */
  public async completeSession(sessionId: string, success: boolean, errorMessage?: string): Promise<void> {
    const sql = `
      UPDATE crawl_sessions
      SET status = ?,
          end_time = datetime('now'),
          error_message = ?
      WHERE session_id = ?
    `;

    await this.db.execute(sql, [
      success ? "completed" : "failed",
      errorMessage || null,
      sessionId,
    ]);
  }

  /**
   * Mark session as interrupted
   */
  public async interruptSession(sessionId: string): Promise<void> {
    const sql = `
      UPDATE crawl_sessions
      SET status = 'interrupted',
          end_time = datetime('now')
      WHERE session_id = ?
    `;

    await this.db.execute(sql, [sessionId]);
  }

  /**
   * Find session by ID
   */
  public async findBySessionId(sessionId: string): Promise<CrawlSession | undefined> {
    return await this.db.queryOne<CrawlSession>(
      "SELECT * FROM crawl_sessions WHERE session_id = ?",
      [sessionId]
    );
  }

  /**
   * Get recent sessions
   */
  public async getRecentSessions(limit: number = 10): Promise<SessionSummary[]> {
    return await this.db.query<SessionSummary>(
      "SELECT * FROM v_session_summary LIMIT ?",
      [limit]
    );
  }

  /**
   * Get session statistics
   */
  public async getSessionStats(sessionId: string): Promise<CrawlSession | undefined> {
    return await this.findBySessionId(sessionId);
  }

  /**
   * Log a crawl error
   */
  public async logError(
    sessionId: string,
    errorType: string,
    errorMessage: string,
    errorStack?: string,
    url?: string,
    propertyId?: string
  ): Promise<number> {
    // Generate next ID manually for DuckDB
    const nextIdResult = await this.db.queryOne<{ nextId: number }>(
      "SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM crawl_errors"
    );
    const nextId = nextIdResult?.nextId || 1;

    const sql = `
      INSERT INTO crawl_errors (
        id, session_id, error_type, error_message, error_stack, url, property_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(sql, [
      nextId,
      sessionId,
      errorType,
      errorMessage,
      errorStack || null,
      url || null,
      propertyId || null,
    ]);

    return nextId;
  }

  /**
   * Get errors for a session
   */
  public async getSessionErrors(sessionId: string): Promise<CrawlError[]> {
    return await this.db.query<CrawlError>(
      `SELECT * FROM crawl_errors
       WHERE session_id = ?
       ORDER BY occurred_at DESC`,
      [sessionId]
    );
  }

  /**
   * Get error statistics
   */
  public async getErrorStats(sessionId: string): Promise<Record<string, number>> {
    const errors = await this.db.query<{ error_type: string; count: number }>(
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
  public async deleteOldSessions(days: number = 90): Promise<void> {
    await this.db.execute(
      `DELETE FROM crawl_sessions
       WHERE datetime(start_time) < datetime('now', '-${days} days')`
    );
  }

  /**
   * Get overall statistics
   */
  public async getOverallStats(): Promise<{
    total_sessions: number;
    completed_sessions: number;
    failed_sessions: number;
    total_properties: number;
    total_errors: number;
  }> {
    const sessionStats = await this.db.queryOne<{
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

    const propertiesCount = await this.db.queryOne<{ total: number }>(
      "SELECT SUM(properties_found) as total FROM crawl_sessions"
    );

    const errorsCount = await this.db.queryOne<{ total: number }>(
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
