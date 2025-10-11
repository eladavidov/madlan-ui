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
    // Extract transaction data - section is already expanded by default
    console.log('[transactionExtractor] Extracting transaction history...');

    const transactions = await page.evaluate((propId) => {
      const results: any[] = [];

      // Find all transaction address links - they're inside the transaction history section
      // Pattern: Links that contain street names/addresses in Hebrew
      const allLinks = Array.from(document.querySelectorAll('a'));

      // Find the transaction history heading first to ensure we're in the right section
      const headings = Array.from(document.querySelectorAll('h3'));
      const transactionHeading = headings.find(h => h.textContent?.includes('היסטוריית עסקאות'));

      if (!transactionHeading) {
        console.log('[transactionExtractor] Transaction history heading not found');
        return results;
      }

      // Get the parent container of the transaction section
      let transactionSection = transactionHeading.parentElement;
      while (transactionSection && transactionSection.tagName !== 'BODY') {
        // Look for the section that contains both the heading and transaction rows
        const sectionText = transactionSection.textContent || '';
        if (sectionText.includes('ת. עסקה') && sectionText.includes('מחיר ב₪')) {
          break;
        }
        transactionSection = transactionSection.parentElement;
      }

      if (!transactionSection) {
        console.log('[transactionExtractor] Transaction section container not found');
        return results;
      }

      // Now find all links within this section that look like addresses
      const sectionLinks = Array.from(transactionSection.querySelectorAll('a'));

      for (const link of sectionLinks) {
        const linkText = link.textContent?.trim() || '';

        // Skip empty links or very short ones
        if (linkText.length < 2) continue;

        // Skip if it's a pagination or filter link
        if (linkText.match(/^\d+$/) || linkText.includes('סינון') || linkText.includes('בסביבה')) {
          continue;
        }

        // Skip "related listings" section
        if (linkText.includes('מודעות') || linkText.includes('פרויקט')) {
          continue;
        }

        // Check if parent contains transaction data markers
        let row = link.parentElement;
        let rowText = '';

        // Walk up to find the row container
        for (let i = 0; i < 5 && row; i++) {
          rowText = row.textContent || '';
          // Transaction rows have: address, bullet (•), size (מ״ר), bullet, price/sqm, bullet, rooms (חד'), bullet, floor (קומה), bullet, year (ב-)
          if (rowText.includes('מ״ר') && rowText.includes('₪') && rowText.includes('•')) {
            break;
          }
          row = row.parentElement;
        }

        if (!row || !rowText) continue;

        // Parse the row data
        const rowData: any = {
          property_id: propId,
          transaction_address: linkText
        };

        // Split by bullet points to get segments
        const segments = rowText.split('•').map(s => s.trim());

        for (const segment of segments) {
          // Date: D.M.YYYY or DD.MM.YYYY format
          const dateMatch = segment.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
          if (dateMatch) {
            const [, day, month, year] = dateMatch;
            rowData.transaction_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }

          // Size: "120 מ״ר" or just number before מ״ר
          const sizeMatch = segment.match(/(\d+)\s*מ״ר/);
          if (sizeMatch) {
            rowData.transaction_size = parseInt(sizeMatch[1]);
          }

          // Price per sqm: "14,166 ₪ למ״ר" or "‏14,166 ‏₪"
          const pricePerSqmMatch = segment.match(/([\d,]+)\s*₪\s*למ״ר/);
          if (pricePerSqmMatch) {
            rowData.transaction_price_per_sqm = parseInt(pricePerSqmMatch[1].replace(/,/g, ''));
          }

          // Rooms: "3 חד'"
          const roomsMatch = segment.match(/(\d+)\s*חד['׳]/);
          if (roomsMatch) {
            rowData.transaction_rooms = parseInt(roomsMatch[1]);
          }

          // Floor: "קומה 2" or "קרקע"
          if (segment.includes('קרקע')) {
            rowData.transaction_floor = 0;
          } else {
            const floorMatch = segment.match(/קומה\s+(\d+)/);
            if (floorMatch) {
              rowData.transaction_floor = parseInt(floorMatch[1]);
            }
          }

          // Year built: "נבנה ב-1920"
          const yearMatch = segment.match(/נבנה ב-(\d{4})/);
          if (yearMatch) {
            rowData.year_built = parseInt(yearMatch[1]);
          }

          // Price: "1.7 מ' ₪" or "600 א' ₪"
          const priceMillionsMatch = segment.match(/([\d.]+)\s*מ['׳]\s*₪/);
          const priceThousandsMatch = segment.match(/([\d.]+)\s*א['׳]\s*₪/);

          if (priceMillionsMatch) {
            rowData.transaction_price = Math.round(parseFloat(priceMillionsMatch[1]) * 1000000);
          } else if (priceThousandsMatch) {
            rowData.transaction_price = Math.round(parseFloat(priceThousandsMatch[1]) * 1000);
          }
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

      console.log(`[transactionExtractor] Found ${results.length} transactions in section`);
      return results.slice(0, 20); // Limit to first 20
    }, propertyId);

    console.log(`[transactionExtractor] Evaluated, found ${transactions.length} transactions`);
    console.log(`[transactionExtractor] Final result: ${transactions.length} transactions`);
    if (transactions.length > 0) {
      console.log(`[transactionExtractor] Sample:`, JSON.stringify(transactions[0]));
    }
    return transactions as TransactionHistoryInput[];
  } catch (error) {
    console.error('Error extracting transaction history:', error);
    return [];
  }
}
