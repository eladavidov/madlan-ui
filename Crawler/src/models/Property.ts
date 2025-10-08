/**
 * TypeScript interfaces for Madlan Property Crawler
 * These interfaces match the database schema exactly
 * Created: 2025-10-08
 */

/**
 * Main Property interface - matches properties table
 */
export interface Property {
  // Primary Key
  id: string;

  // Source Information
  url: string;
  source_url?: string | null;

  // Basic Property Information
  price?: number | null; // In ₪ (shekels)
  rooms?: number | null; // Supports 0.5 increments (1, 1.5, 2, 2.5, etc.)
  size?: number | null; // Square meters
  floor?: number | null; // Can be negative for basement, 0 for ground
  total_floors?: number | null;

  // Location Information
  address?: string | null;
  neighborhood?: string | null;
  city: string; // Required

  // Property Type & Details
  property_type?: PropertyType | null;
  description?: string | null;

  // Amenities (Boolean flags)
  has_parking?: boolean | null;
  parking_spaces?: number | null;
  has_elevator?: boolean | null;
  has_balcony?: boolean | null;
  balcony_size?: number | null;
  has_air_conditioning?: boolean | null;
  has_security_door?: boolean | null;
  has_bars?: boolean | null;
  has_storage?: boolean | null;
  has_shelter?: boolean | null;
  is_accessible?: boolean | null;
  is_renovated?: boolean | null;
  is_furnished?: boolean | null;

  // Additional Fields
  entry_date?: string | null;
  listing_date?: string | null;
  last_updated?: string | null;

  // Contact Information
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_agency?: string | null;

  // Metadata
  first_crawled_at: string;
  last_crawled_at: string;
  crawl_count: number;

  // Data Quality Flags
  data_complete?: boolean | null;
  has_errors?: boolean | null;
  error_notes?: string | null;
}

/**
 * Property Type enum - Hebrew property types
 */
export type PropertyType =
  | 'דירה' // Apartment
  | 'פנטהאוז' // Penthouse
  | 'דירת גן' // Garden apartment
  | 'דופלקס' // Duplex
  | 'סטודיו' // Studio
  | 'מיני פנטהאוז' // Mini penthouse
  | 'טריפלקס' // Triplex
  | 'דירת גג' // Rooftop apartment
  | 'בית פרטי' // Private house
  | "קוטג'"; // Cottage

/**
 * Property Image interface - matches property_images table
 */
export interface PropertyImage {
  id?: number; // Auto-increment, optional for new records
  property_id: string;
  image_url: string;
  image_order: number; // 0 = main image
  is_main_image?: boolean | null;
  image_type?: string | null; // thumbnail, full, etc.
  width?: number | null;
  height?: number | null;
  file_size?: number | null;
  is_downloaded?: boolean | null;
  local_path?: string | null;
  download_date?: string | null;
  download_error?: string | null;
  created_at?: string;
}

/**
 * Crawl Session interface - matches crawl_sessions table
 */
export interface CrawlSession {
  id?: number; // Auto-increment, optional for new records
  session_id: string;
  start_time?: string;
  end_time?: string | null;
  target_city?: string | null;
  max_properties?: number | null;
  properties_found?: number;
  properties_new?: number;
  properties_updated?: number;
  properties_failed?: number;
  images_downloaded?: number;
  images_failed?: number;
  status?: CrawlSessionStatus;
  error_message?: string | null;
  user_agent?: string | null;
  ip_address?: string | null;
  notes?: string | null;
}

/**
 * Crawl Session Status enum
 */
export type CrawlSessionStatus = 'running' | 'completed' | 'failed' | 'interrupted';

/**
 * Crawl Error interface - matches crawl_errors table
 */
export interface CrawlError {
  id?: number; // Auto-increment, optional for new records
  session_id?: string | null;
  error_type: ErrorType;
  error_message: string;
  error_stack?: string | null;
  url?: string | null;
  property_id?: string | null;
  occurred_at?: string;
}

/**
 * Error Type enum
 */
export type ErrorType =
  | 'navigation' // Page navigation errors
  | 'extraction' // Data extraction errors
  | 'validation' // Data validation errors
  | 'network' // Network/HTTP errors
  | 'timeout' // Timeout errors
  | 'captcha' // CAPTCHA encountered
  | 'parse' // HTML/data parsing errors
  | 'database' // Database errors
  | 'download' // Image download errors
  | 'unknown'; // Uncategorized errors

/**
 * Property History interface - matches property_history table
 */
export interface PropertyHistory {
  id?: number; // Auto-increment, optional for new records
  property_id: string;
  field_name: string;
  old_value?: string | null; // JSON string
  new_value?: string | null; // JSON string
  changed_at?: string;
  session_id?: string | null;
}

/**
 * View: Recent Properties with main image
 */
export interface RecentProperty extends Property {
  main_image_url?: string | null;
}

/**
 * View: Properties with statistics
 */
export interface PropertyWithStats extends Property {
  image_count: number;
  images_downloaded: number;
}

/**
 * View: Session summary with error count
 */
export interface SessionSummary extends CrawlSession {
  error_count: number;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Property creation input (for insert)
 * Only required fields, all others optional
 */
export type PropertyInput = Pick<Property, 'id' | 'url' | 'city'> & Partial<Omit<Property, 'id' | 'url' | 'city'>>;

/**
 * Property update input (for update)
 * All fields optional except id
 */
export type PropertyUpdate = Pick<Property, 'id'> & Partial<Omit<Property, 'id'>>;
