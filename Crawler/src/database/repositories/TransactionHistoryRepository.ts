/**
 * Transaction History Repository
 * Manages transaction_history table operations
 */

import type { DuckDBConnection } from "../connectionDuckDB.js";
import type { TransactionHistory, TransactionHistoryInput } from "../../models/Property.js";

export class TransactionHistoryRepository {
  constructor(private db: DuckDBConnection) {}

  /**
   * Insert a single transaction history record
   */
  async insert(transaction: TransactionHistoryInput): Promise<void> {
    // Generate manual ID (DuckDB doesn't support sequences)
    const id = await this.getNextId();

    const sql = `
      INSERT INTO transaction_history (
        id, property_id, transaction_address, transaction_date,
        transaction_price, transaction_size, transaction_price_per_sqm,
        transaction_floor, transaction_rooms, year_built
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(sql, [
      id,
      transaction.property_id,
      transaction.transaction_address || null,
      transaction.transaction_date || null,
      transaction.transaction_price || null,
      transaction.transaction_size || null,
      transaction.transaction_price_per_sqm || null,
      transaction.transaction_floor || null,
      transaction.transaction_rooms || null,
      transaction.year_built || null
    ]);
  }

  /**
   * Get next available ID (manual ID generation for DuckDB)
   */
  private async getNextId(): Promise<number> {
    const sql = `SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM transaction_history`;
    const result = await this.db.queryOne<{ next_id: number }>(sql, []);
    return result?.next_id || 1;
  }

  /**
   * Insert multiple transaction history records (batch)
   */
  async insertMany(transactions: TransactionHistoryInput[]): Promise<void> {
    for (const transaction of transactions) {
      await this.insert(transaction);
    }
  }

  /**
   * Get all transactions for a property
   */
  async findByPropertyId(propertyId: string): Promise<TransactionHistory[]> {
    const sql = `
      SELECT * FROM transaction_history
      WHERE property_id = ?
      ORDER BY transaction_date DESC
    `;

    return await this.db.query<TransactionHistory>(sql, [propertyId]);
  }

  /**
   * Delete all transactions for a property
   */
  async deleteByPropertyId(propertyId: string): Promise<void> {
    const sql = `DELETE FROM transaction_history WHERE property_id = ?`;
    await this.db.execute(sql, [propertyId]);
  }

  /**
   * Get count of transactions for a property
   */
  async countByPropertyId(propertyId: string): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count FROM transaction_history
      WHERE property_id = ?
    `;

    const result = await this.db.queryOne<{ count: number }>(sql, [propertyId]);
    return result?.count || 0;
  }
}
