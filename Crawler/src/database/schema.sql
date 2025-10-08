-- Madlan Property Crawler - Database Schema
-- SQLite Database Schema for Property Data
-- Created: 2025-10-08
-- Based on: RESEARCH.md findings and properties.json analysis

-- ============================================================================
-- PROPERTIES TABLE
-- ============================================================================
-- Stores main property listing data
CREATE TABLE IF NOT EXISTS properties (
  -- Primary Key
  id TEXT PRIMARY KEY NOT NULL,

  -- Source Information
  url TEXT UNIQUE NOT NULL,
  source_url TEXT, -- Original listing URL if different

  -- Basic Property Information
  price INTEGER, -- Price in ₪ (shekels)
  rooms REAL, -- Number of rooms (supports 0.5 increments: 1, 1.5, 2, 2.5, etc.)
  size REAL, -- Size in square meters
  floor INTEGER, -- Floor number (can be negative for basement, 0 for ground)
  total_floors INTEGER, -- Total floors in building

  -- Location Information
  address TEXT, -- Full street address
  neighborhood TEXT, -- Neighborhood name (Hebrew)
  city TEXT NOT NULL, -- City name (Hebrew)

  -- Property Type & Details
  property_type TEXT, -- דירה, פנטהאוז, דירת גן, דופלקס, סטודיו, etc.
  description TEXT, -- Full property description (Hebrew)

  -- Amenities (Boolean flags)
  has_parking BOOLEAN DEFAULT 0,
  parking_spaces INTEGER, -- Number of parking spots
  has_elevator BOOLEAN DEFAULT 0,
  has_balcony BOOLEAN DEFAULT 0,
  balcony_size REAL, -- Balcony size in m² if available
  has_air_conditioning BOOLEAN DEFAULT 0,
  has_security_door BOOLEAN DEFAULT 0,
  has_bars BOOLEAN DEFAULT 0, -- סורגים (window bars)
  has_storage BOOLEAN DEFAULT 0, -- מחסן
  has_shelter BOOLEAN DEFAULT 0, -- ממ"ד (safe room)
  is_accessible BOOLEAN DEFAULT 0, -- נגיש לנכים
  is_renovated BOOLEAN DEFAULT 0, -- משופץ
  is_furnished BOOLEAN DEFAULT 0, -- מרוהט

  -- Additional Fields (discovered during research)
  entry_date TEXT, -- תאריך כניסה (move-in date)
  listing_date TEXT, -- When property was first listed
  last_updated TEXT, -- Last update on Madlan

  -- Contact Information (if available)
  contact_name TEXT,
  contact_phone TEXT,
  contact_agency TEXT,

  -- Metadata
  first_crawled_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_crawled_at TEXT NOT NULL DEFAULT (datetime('now')),
  crawl_count INTEGER NOT NULL DEFAULT 1,

  -- Data Quality Flags
  data_complete BOOLEAN DEFAULT 1, -- Flag if data extraction was complete
  has_errors BOOLEAN DEFAULT 0, -- Flag if errors occurred during extraction
  error_notes TEXT -- Any error notes during extraction
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_rooms ON properties(rooms);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_first_crawled ON properties(first_crawled_at);
CREATE INDEX IF NOT EXISTS idx_properties_last_crawled ON properties(last_crawled_at);

-- ============================================================================
-- PROPERTY_IMAGES TABLE
-- ============================================================================
-- Stores image URLs and metadata for each property
CREATE TABLE IF NOT EXISTS property_images (
  -- Primary Key
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Foreign Key to properties
  property_id TEXT NOT NULL,

  -- Image Information
  image_url TEXT NOT NULL,
  image_order INTEGER NOT NULL DEFAULT 0, -- Order in gallery (0 = main image)

  -- Image Metadata
  is_main_image BOOLEAN DEFAULT 0, -- Flag for primary listing image
  image_type TEXT, -- thumbnail, full, etc.
  width INTEGER,
  height INTEGER,
  file_size INTEGER, -- Size in bytes

  -- Download Status
  is_downloaded BOOLEAN DEFAULT 0,
  local_path TEXT, -- Local file path if downloaded
  download_date TEXT,
  download_error TEXT,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Indexes for image queries
CREATE INDEX IF NOT EXISTS idx_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_images_is_main ON property_images(is_main_image);
CREATE INDEX IF NOT EXISTS idx_images_order ON property_images(property_id, image_order);

-- ============================================================================
-- CRAWL_SESSIONS TABLE
-- ============================================================================
-- Tracks crawling sessions and statistics
CREATE TABLE IF NOT EXISTS crawl_sessions (
  -- Primary Key
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Session Information
  session_id TEXT UNIQUE NOT NULL,
  start_time TEXT NOT NULL DEFAULT (datetime('now')),
  end_time TEXT,

  -- Session Configuration
  target_city TEXT,
  max_properties INTEGER,

  -- Statistics
  properties_found INTEGER DEFAULT 0,
  properties_new INTEGER DEFAULT 0,
  properties_updated INTEGER DEFAULT 0,
  properties_failed INTEGER DEFAULT 0,
  images_downloaded INTEGER DEFAULT 0,
  images_failed INTEGER DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed, interrupted
  error_message TEXT,

  -- Metadata
  user_agent TEXT,
  ip_address TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON crawl_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON crawl_sessions(status);

-- ============================================================================
-- CRAWL_ERRORS TABLE
-- ============================================================================
-- Logs errors encountered during crawling
CREATE TABLE IF NOT EXISTS crawl_errors (
  -- Primary Key
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Session Reference
  session_id TEXT,

  -- Error Details
  error_type TEXT NOT NULL, -- navigation, extraction, validation, network, etc.
  error_message TEXT NOT NULL,
  error_stack TEXT, -- Stack trace if available

  -- Context
  url TEXT, -- URL where error occurred
  property_id TEXT, -- Property being processed if applicable

  -- Timestamp
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (session_id) REFERENCES crawl_sessions(session_id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

CREATE INDEX IF NOT EXISTS idx_errors_session ON crawl_errors(session_id);
CREATE INDEX IF NOT EXISTS idx_errors_type ON crawl_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_errors_occurred ON crawl_errors(occurred_at);

-- ============================================================================
-- PROPERTY_HISTORY TABLE
-- ============================================================================
-- Tracks changes to property data over time (optional for future expansion)
CREATE TABLE IF NOT EXISTS property_history (
  -- Primary Key
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Property Reference
  property_id TEXT NOT NULL,

  -- Changed Fields
  field_name TEXT NOT NULL, -- Which field changed
  old_value TEXT, -- Previous value (as JSON string)
  new_value TEXT, -- New value (as JSON string)

  -- Change Metadata
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  session_id TEXT,

  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES crawl_sessions(session_id)
);

CREATE INDEX IF NOT EXISTS idx_history_property ON property_history(property_id);
CREATE INDEX IF NOT EXISTS idx_history_changed ON property_history(changed_at);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Recent properties with main image
CREATE VIEW IF NOT EXISTS v_recent_properties AS
SELECT
  p.*,
  pi.image_url as main_image_url
FROM properties p
LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.is_main_image = 1
ORDER BY p.first_crawled_at DESC;

-- View: Properties with image count
CREATE VIEW IF NOT EXISTS v_properties_with_stats AS
SELECT
  p.*,
  COUNT(pi.id) as image_count,
  SUM(CASE WHEN pi.is_downloaded = 1 THEN 1 ELSE 0 END) as images_downloaded
FROM properties p
LEFT JOIN property_images pi ON p.id = pi.property_id
GROUP BY p.id;

-- View: Crawl session summary
CREATE VIEW IF NOT EXISTS v_session_summary AS
SELECT
  s.*,
  COUNT(DISTINCT e.id) as error_count
FROM crawl_sessions s
LEFT JOIN crawl_errors e ON s.session_id = e.session_id
GROUP BY s.id
ORDER BY s.start_time DESC;
