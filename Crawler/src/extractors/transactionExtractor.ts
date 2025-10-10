/**
 * Transaction History Extractor
 * Extracts historical transaction data from "חשוב לדעת" (Important to Know) section
 */

import type { Page } from "playwright";
import type { TransactionHistoryInput } from "../models/Property.js";
import { expandPanelByText, waitForPanelContent } from "../utils/panelExpander.js";

/**
 * Extract transaction history from property page
 * Returns array of transactions (first page only, no pagination)
 */
export async function extractTransactionHistory(
  page: Page,
  propertyId: string
): Promise<TransactionHistoryInput[]> {
  try {
    // Try to expand the panel if it's collapsed
    const panelExpanded = await expandPanelByText(page, "חשוב לדעת");

    if (panelExpanded) {
      // Wait for table content to load
      await waitForPanelContent(page, 'table, [class*="table"]', 3000);
    }

    // Extract transaction data from table
    const transactions = await page.evaluate((propId) => {
      const results: any[] = [];

      // Strategy 1: Look for table with transaction data
      const tables = document.querySelectorAll('table');

      for (const table of tables) {
        // Check if this table contains transaction data
        const headerText = table.textContent || '';
        if (headerText.includes('כתובת') || headerText.includes('תאריך') || headerText.includes('מחיר')) {
          const rows = Array.from(table.querySelectorAll('tbody tr, tr'));

          for (const row of rows) {
            const cells = Array.from(row.querySelectorAll('td, th'));

            if (cells.length < 3) continue; // Skip header or invalid rows

            // Try to extract data from cells
            // Common patterns: Address, Date, Price, Size, Floor, Rooms, Year Built
            const rowData: any = {
              property_id: propId
            };

            // Parse each cell - order may vary
            let cellIndex = 0;
            for (const cell of cells) {
              const text = cell.textContent?.trim() || '';

              // Skip empty cells or header cells
              if (!text || text.includes('כתובת') || text.includes('תאריך') || text.includes('מחיר')) {
                cellIndex++;
                continue;
              }

              // Detect what type of data this cell contains
              // Address: contains street name (Hebrew text, might have numbers)
              if (cellIndex === 0 || text.match(/^[א-ת\s\d]+$/)) {
                if (!rowData.transaction_address && text.length > 3) {
                  rowData.transaction_address = text;
                }
              }

              // Date: DD/MM/YYYY or DD.MM.YYYY
              if (text.match(/\d{1,2}[\/\.]\d{1,2}[\/\.]\d{2,4}/)) {
                const dateParts = text.split(/[\/\.]/);
                if (dateParts.length === 3) {
                  const day = dateParts[0].padStart(2, '0');
                  const month = dateParts[1].padStart(2, '0');
                  let year = dateParts[2];
                  // Convert 2-digit year to 4-digit
                  if (year.length === 2) {
                    year = (parseInt(year) > 50 ? '19' : '20') + year;
                  }
                  rowData.transaction_date = `${year}-${month}-${day}`;
                }
              }

              // Price: Large number (₪1,500,000 or 1500000)
              const priceMatch = text.match(/[\d,]+/);
              if (priceMatch && !rowData.transaction_price) {
                const num = parseInt(priceMatch[0].replace(/,/g, ''));
                if (num > 100000 && num < 100000000) { // Reasonable price range
                  rowData.transaction_price = num;
                }
              }

              // Size: Number followed by מ"ר or m²
              if (text.includes('מ"ר') || text.includes('m²')) {
                const sizeMatch = text.match(/(\d+\.?\d*)/);
                if (sizeMatch) {
                  rowData.transaction_size = parseFloat(sizeMatch[1]);
                }
              }

              // Floor: קומה or just a small number (0-100)
              if ((text.includes('קומה') || (!isNaN(Number(text)) && Number(text) >= -2 && Number(text) <= 100)) && !rowData.transaction_floor) {
                const floorMatch = text.match(/-?\d+/);
                if (floorMatch) {
                  const floor = parseInt(floorMatch[0]);
                  if (floor >= -2 && floor <= 100) {
                    rowData.transaction_floor = floor;
                  }
                }
              }

              // Rooms: Small decimal number (0.5-20)
              if (!rowData.transaction_rooms) {
                const roomMatch = text.match(/^(\d+\.?\d*)$/);
                if (roomMatch) {
                  const rooms = parseFloat(roomMatch[1]);
                  if (rooms >= 0.5 && rooms <= 20) {
                    rowData.transaction_rooms = rooms;
                  }
                }
              }

              // Year built: 4-digit year (1900-2030)
              const yearMatch = text.match(/\b(19\d{2}|20[0-3]\d)\b/);
              if (yearMatch && !rowData.year_built) {
                rowData.year_built = parseInt(yearMatch[1]);
              }

              cellIndex++;
            }

            // Calculate price per sqm if we have both price and size
            if (rowData.transaction_price && rowData.transaction_size) {
              rowData.transaction_price_per_sqm = Math.round(rowData.transaction_price / rowData.transaction_size);
            }

            // Only add if we have minimum data (at least address or date and price)
            if ((rowData.transaction_address || rowData.transaction_date) && rowData.transaction_price) {
              results.push(rowData);
            }
          }

          // If we found data in this table, stop looking
          if (results.length > 0) {
            break;
          }
        }
      }

      // Strategy 2: Look for structured divs with transaction data (if no table found)
      if (results.length === 0) {
        // Look for transaction cards or list items
        const transactionElements = document.querySelectorAll('[class*="transaction"], [class*="history"]');

        for (const element of transactionElements) {
          // Similar parsing logic as above but for div-based layouts
          // This would need to be customized based on actual Madlan HTML structure
          // For now, we'll rely on table extraction

          // Check if element has meaningful content before processing
          if (element.textContent && element.textContent.length > 10) {
            // TODO: Add div-based extraction logic if needed
          }
        }
      }

      return results;
    }, propertyId);

    return transactions as TransactionHistoryInput[];
  } catch (error) {
    console.error('Error extracting transaction history:', error);
    return [];
  }
}
