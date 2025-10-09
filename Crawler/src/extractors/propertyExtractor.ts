/**
 * Property Data Extractor
 * Extracts property data from Madlan property pages
 */

import type { Page } from "playwright";
import type { PropertyInput } from "../models/Property.js";
import { PROPERTY_PAGE_SELECTORS } from "../config/selectors.js";

/**
 * Extract property data from a property detail page
 */
export async function extractPropertyData(
  page: Page,
  url: string
): Promise<PropertyInput | null> {
  try {
    // Extract property ID from URL
    // URL format: https://www.madlan.co.il/listings/{id} or /bulletin/{id}
    const urlMatch = url.match(/\/(listings|bulletin)\/([^/?]+)/);
    if (!urlMatch) {
      console.error("Could not extract property ID from URL:", url);
      return null;
    }

    const propertyId = urlMatch[2];

    // Extract price
    const price = await extractNumber(page, PROPERTY_PAGE_SELECTORS.price);

    // Extract rooms, floor, size (context-based - same CSS class but different labels)
    const rooms = await extractNumberByLabel(page, 'חדרים');
    const floor = await extractNumberByLabel(page, 'קומה');
    const size = await extractNumberByLabel(page, 'מ״ר');
    const totalFloors = await extractNumberByLabel(page, 'קומות בבניין');

    // Extract address (H1 contains full location)
    const addressFull = await extractText(page, PROPERTY_PAGE_SELECTORS.address);
    // Parse address: "רענן , כרמל ותיק, חיפה" -> street, neighborhood, city
    const addressParts = addressFull?.split(',').map(s => s.trim()) || [];
    const address = addressParts[0] || null;
    const neighborhood = addressParts[1] || null;
    const city = addressParts[2] || addressParts[addressParts.length - 1] || 'חיפה';

    // Extract property type
    const propertyTypeRaw = await extractText(page, PROPERTY_PAGE_SELECTORS.propertyType);

    // Extract description
    const description = await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2')).find(h2 =>
        h2.textContent?.includes('תיאור הנכס')
      );
      return heading?.nextElementSibling?.textContent?.trim() || null;
    });

    // Extract amenities (text-based detection)
    const hasParking = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.parking);
    const hasElevator = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.elevator);
    const hasBalcony = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.balcony);
    const hasAirConditioning = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.airConditioning);
    const hasSecurityDoor = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.securityDoor);
    const hasBars = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.bars);
    const hasStorage = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.storage);
    const hasShelter = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.shelter);
    const isAccessible = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.accessible);
    const isRenovated = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.renovated);
    const isFurnished = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.furnished);

    // Extract contact info
    const contactName = await extractText(page, PROPERTY_PAGE_SELECTORS.contactName);
    const contactPhone = await extractText(page, PROPERTY_PAGE_SELECTORS.contactPhone);
    const contactAgency = await extractText(page, PROPERTY_PAGE_SELECTORS.contactAgency);

    // Extract dates
    const listingDate = await extractText(page, PROPERTY_PAGE_SELECTORS.listingDate);
    const entryDate = await extractText(page, PROPERTY_PAGE_SELECTORS.entryDate);

    // Build property object
    const property: PropertyInput = {
      id: propertyId,
      url: url,
      city: city || "חיפה", // Default to Haifa if not found
      price: price ?? undefined,
      rooms: rooms ?? undefined,
      size: size ?? undefined,
      floor: floor ?? undefined,
      total_floors: totalFloors ?? undefined,
      address: address ?? undefined,
      neighborhood: neighborhood ?? undefined,
      property_type: (propertyTypeRaw as any) ?? undefined,
      description: description ?? undefined,
      has_parking: hasParking ?? undefined,
      has_elevator: hasElevator ?? undefined,
      has_balcony: hasBalcony ?? undefined,
      has_air_conditioning: hasAirConditioning ?? undefined,
      has_security_door: hasSecurityDoor ?? undefined,
      has_bars: hasBars ?? undefined,
      has_storage: hasStorage ?? undefined,
      has_shelter: hasShelter ?? undefined,
      is_accessible: isAccessible ?? undefined,
      is_renovated: isRenovated ?? undefined,
      is_furnished: isFurnished ?? undefined,
      contact_name: contactName ?? undefined,
      contact_phone: contactPhone ?? undefined,
      contact_agency: contactAgency ?? undefined,
      listing_date: listingDate ?? undefined,
      entry_date: entryDate ?? undefined,
    };

    return property;
  } catch (error) {
    console.error("Error extracting property data:", error);
    return null;
  }
}

/**
 * Extract image URLs from property page
 */
export async function extractImageUrls(page: Page): Promise<string[]> {
  try {
    // Try to find all images in the gallery
    const images = await page.$$eval(
      PROPERTY_PAGE_SELECTORS.images,
      (imgs) => imgs.map((img) => (img as HTMLImageElement).src).filter(Boolean)
    );

    return images;
  } catch (error) {
    console.error("Error extracting images:", error);
    return [];
  }
}

/**
 * Helper: Extract text from element using CSS selector
 */
async function extractText(page: Page, selector: string): Promise<string | null> {
  try {
    // Split selector by comma (multiple selectors)
    const selectors = selector.split(",").map((s) => s.trim());

    for (const sel of selectors) {
      const element = await page.$(sel);
      if (element) {
        const text = await element.textContent();
        if (text) {
          return text.trim();
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Helper: Extract number from element (parse from text)
 */
async function extractNumber(page: Page, selector: string): Promise<number | null> {
  const text = await extractText(page, selector);
  if (!text) return null;

  // Remove non-numeric characters except decimal point
  const cleaned = text.replace(/[^\d.]/g, "");
  const number = parseFloat(cleaned);

  return isNaN(number) ? null : number;
}

/**
 * Helper: Check if text exists anywhere on page (for text-based amenities)
 */
async function checkTextExists(page: Page, searchText: string): Promise<boolean> {
  try {
    const found = await page.evaluate((text) => {
      return document.body.textContent?.includes(text) || false;
    }, searchText);
    return found;
  } catch (error) {
    return false;
  }
}

/**
 * Helper: Extract number by adjacent label text
 * Example: Find "5" next to "חדרים" (rooms)
 */
async function extractNumberByLabel(page: Page, labelText: string): Promise<number | null> {
  try {
    const value = await page.evaluate((label) => {
      // Find all elements
      const elements = Array.from(document.querySelectorAll('*'));

      // Find element with label text
      const labelEl = elements.find(el =>
        el.textContent?.trim() === label && el.children.length === 0
      );

      if (!labelEl) return null;

      // Check previous sibling for value
      const prevSibling = labelEl.previousElementSibling;
      if (prevSibling && prevSibling.children.length === 0) {
        const text = prevSibling.textContent?.trim();
        if (text) return text;
      }

      // Check if value is in same parent container
      const parent = labelEl.parentElement;
      if (parent) {
        const valueEl = Array.from(parent.children).find(child =>
          child !== labelEl &&
          child.children.length === 0 &&
          /^\d+\.?\d*$/.test(child.textContent?.trim() || '')
        );
        if (valueEl) return valueEl.textContent?.trim() || null;
      }

      return null;
    }, labelText);

    if (!value) return null;

    // Parse number
    const cleaned = value.replace(/[^\d.]/g, "");
    const number = parseFloat(cleaned);
    return isNaN(number) ? null : number;
  } catch (error) {
    return null;
  }
}
