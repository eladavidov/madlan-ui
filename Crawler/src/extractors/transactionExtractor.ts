/**
 * Transaction History Extractor
 * Extracts historical transaction data from "היסטוריית עסקאות" (Transaction History) section
 */

import type { Page } from "playwright";
import type { TransactionHistoryInput } from "../models/Property.js";

/**
 * Extract transaction history from property page
 * Returns array of transactions (first page only, no pagination)
 */
export async function extractTransactionHistory(
  page: Page,
  propertyId: string
): Promise<TransactionHistoryInput[]> {
  try {
    console.log('[transactionExtractor] Extracting transaction history...');

    const transactions = await page.evaluate((propId) => {
      const results: any[] = [];

      // Find transaction history section by heading
      const headings = Array.from(document.querySelectorAll('h3'));
      const transactionHeading = headings.find(h => h.textContent?.includes('היסטוריית עסקאות'));

      if (!transactionHeading) {
        console.log('[transactionExtractor] Transaction history heading not found');
        return results;
      }

      // Find the table rows - they're in div[data-auto="table-row-N"] elements
      const tableRows = Array.from(document.querySelectorAll('div[data-auto^="table-row-"]'));
      console.log(`[transactionExtractor] Found ${tableRows.length} table rows`);

      for (const row of tableRows) {
        const cells = Array.from(row.querySelectorAll('.table-cell'));
        if (cells.length < 8) continue; // Need at least 8 cells for valid data

        const rowData: any = {
          property_id: propId
        };

        // Cell 0: Address (link text)
        const addressLink = cells[0]?.querySelector('a');
        if (addressLink) {
          rowData.transaction_address = addressLink.textContent?.trim() || '';
        }

        // Cell 2: Transaction date (format: D.M.YYYY or DD.MM.YYYY)
        const dateText = cells[2]?.textContent?.trim() || '';
        const dateMatch = dateText.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        if (dateMatch) {
          const [, day, month, year] = dateMatch;
          rowData.transaction_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        // Cell 3: Price (format: "1.2 מ' ₪" or "600 א' ₪")
        const priceText = cells[3]?.textContent?.trim() || '';
        const priceMillionsMatch = priceText.match(/([\d.]+)\s*מ['׳]/);
        const priceThousandsMatch = priceText.match(/([\d.]+)\s*א['׳]/);

        if (priceMillionsMatch) {
          rowData.transaction_price = Math.round(parseFloat(priceMillionsMatch[1]) * 1000000);
        } else if (priceThousandsMatch) {
          rowData.transaction_price = Math.round(parseFloat(priceThousandsMatch[1]) * 1000);
        }

        // Cell 4: Size/Area (just the number)
        const sizeText = cells[4]?.textContent?.trim() || '';
        const size = parseInt(sizeText.replace(/[^\d]/g, ''));
        if (!isNaN(size) && size > 0) {
          rowData.transaction_size = size;
        }

        // Cell 5: Price per sqm (format: "‏13,750 ‏₪")
        const priceSqmText = cells[5]?.textContent?.trim() || '';
        const priceSqmMatch = priceSqmText.match(/([\d,]+)/);
        if (priceSqmMatch) {
          rowData.transaction_price_per_sqm = parseInt(priceSqmMatch[1].replace(/,/g, ''));
        }

        // Cell 6: Rooms (just the number)
        const roomsText = cells[6]?.textContent?.trim() || '';
        const rooms = parseInt(roomsText.replace(/[^\d]/g, ''));
        if (!isNaN(rooms) && rooms > 0) {
          rowData.transaction_rooms = rooms;
        }

        // Cell 7: Floor (number or "קרקע")
        const floorText = cells[7]?.textContent?.trim() || '';
        if (floorText.includes('קרקע')) {
          rowData.transaction_floor = 0;
        } else {
          const floor = parseInt(floorText.replace(/[^\d]/g, ''));
          if (!isNaN(floor)) {
            rowData.transaction_floor = floor;
          }
        }

        // Cell 8: Year built (just the number)
        const yearText = cells[8]?.textContent?.trim() || '';
        const year = parseInt(yearText.replace(/[^\d]/g, ''));
        if (!isNaN(year) && year > 1800 && year < 2100) {
          rowData.year_built = year;
        }

        // Calculate price per sqm if we have price and size but no price_per_sqm
        if (rowData.transaction_price && rowData.transaction_size && !rowData.transaction_price_per_sqm) {
          rowData.transaction_price_per_sqm = Math.round(rowData.transaction_price / rowData.transaction_size);
        }

        // Only add if we have minimum required data (address + date OR price)
        if (rowData.transaction_address && (rowData.transaction_date || rowData.transaction_price)) {
          console.log(`[transactionExtractor] Adding transaction: ${rowData.transaction_address}`);
          results.push(rowData);
        }
      }

      console.log(`[transactionExtractor] Final result: ${results.length} transactions`);
      return results.slice(0, 20); // Limit to first 20
    }, propertyId);

    console.log(`[transactionExtractor] Extracted ${transactions.length} transactions`);
    if (transactions.length > 0) {
      console.log(`[transactionExtractor] Sample:`, JSON.stringify(transactions[0]));
    }
    return transactions as TransactionHistoryInput[];
  } catch (error) {
    console.error('Error extracting transaction history:', error);
    return [];
  }
}
