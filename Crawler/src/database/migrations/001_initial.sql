-- Migration: 001_initial
-- Description: Initial database schema for Madlan property crawler
-- Created: 2025-10-08
-- Author: Claude Code AI Assistant

-- This migration creates the initial database schema including:
-- - properties table (main property data)
-- - property_images table (image URLs and metadata)
-- - crawl_sessions table (crawling session tracking)
-- - crawl_errors table (error logging)
-- - property_history table (change tracking)
-- - Supporting views and indexes

BEGIN TRANSACTION;

-- ============================================================================
-- PROPERTIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY NOT NULL,
  url TEXT UNIQUE NOT NULL,
  source_url TEXT,
  price INTEGER,
  rooms REAL,
  size REAL,
  floor INTEGER,
  total_floors INTEGER,
  address TEXT,
  neighborhood TEXT,
  city TEXT NOT NULL,
  property_type TEXT,
  description TEXT,
  has_parking BOOLEAN DEFAULT 0,
  parking_spaces INTEGER,
  has_elevator BOOLEAN DEFAULT 0,
  has_balcony BOOLEAN DEFAULT 0,
  balcony_size REAL,
  has_air_conditioning BOOLEAN DEFAULT 0,
  has_security_door BOOLEAN DEFAULT 0,
  has_bars BOOLEAN DEFAULT 0,
  has_storage BOOLEAN DEFAULT 0,
  has_shelter BOOLEAN DEFAULT 0,
  is_accessible BOOLEAN DEFAULT 0,
  is_renovated BOOLEAN DEFAULT 0,
  is_furnished BOOLEAN DEFAULT 0,
  entry_date TEXT,
  listing_date TEXT,
  last_updated TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_agency TEXT,
  first_crawled_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_crawled_at TEXT NOT NULL DEFAULT (datetime('now')),
  crawl_count INTEGER NOT NULL DEFAULT 1,
  data_complete BOOLEAN DEFAULT 1,
  has_errors BOOLEAN DEFAULT 0,
  error_notes TEXT
);

CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_rooms ON properties(rooms);
CREATE INDEX idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_first_crawled ON properties(first_crawled_at);
CREATE INDEX idx_properties_last_crawled ON properties(last_crawled_at);

-- ============================================================================
-- PROPERTY_IMAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS property_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_order INTEGER NOT NULL DEFAULT 0,
  is_main_image BOOLEAN DEFAULT 0,
  image_type TEXT,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  is_downloaded BOOLEAN DEFAULT 0,
  local_path TEXT,
  download_date TEXT,
  download_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE INDEX idx_images_property_id ON property_images(property_id);
CREATE INDEX idx_images_is_main ON property_images(is_main_image);
CREATE INDEX idx_images_order ON property_images(property_id, image_order);

-- ============================================================================
-- CRAWL_SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS crawl_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,
  start_time TEXT NOT NULL DEFAULT (datetime('now')),
  end_time TEXT,
  target_city TEXT,
  max_properties INTEGER,
  properties_found INTEGER DEFAULT 0,
  properties_new INTEGER DEFAULT 0,
  properties_updated INTEGER DEFAULT 0,
  properties_failed INTEGER DEFAULT 0,
  images_downloaded INTEGER DEFAULT 0,
  images_failed INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  error_message TEXT,
  user_agent TEXT,
  ip_address TEXT,
  notes TEXT
);

CREATE INDEX idx_sessions_start_time ON crawl_sessions(start_time);
CREATE INDEX idx_sessions_status ON crawl_sessions(status);

-- ============================================================================
-- CRAWL_ERRORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS crawl_errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  url TEXT,
  property_id TEXT,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES crawl_sessions(session_id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

CREATE INDEX idx_errors_session ON crawl_errors(session_id);
CREATE INDEX idx_errors_type ON crawl_errors(error_type);
CREATE INDEX idx_errors_occurred ON crawl_errors(occurred_at);

-- ============================================================================
-- PROPERTY_HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS property_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  session_id TEXT,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES crawl_sessions(session_id)
);

CREATE INDEX idx_history_property ON property_history(property_id);
CREATE INDEX idx_history_changed ON property_history(changed_at);

-- ============================================================================
-- VIEWS
-- ============================================================================
CREATE VIEW IF NOT EXISTS v_recent_properties AS
SELECT
  p.*,
  pi.image_url as main_image_url
FROM properties p
LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.is_main_image = 1
ORDER BY p.first_crawled_at DESC;

CREATE VIEW IF NOT EXISTS v_properties_with_stats AS
SELECT
  p.*,
  COUNT(pi.id) as image_count,
  SUM(CASE WHEN pi.is_downloaded = 1 THEN 1 ELSE 0 END) as images_downloaded
FROM properties p
LEFT JOIN property_images pi ON p.id = pi.property_id
GROUP BY p.id;

CREATE VIEW IF NOT EXISTS v_session_summary AS
SELECT
  s.*,
  COUNT(DISTINCT e.id) as error_count
FROM crawl_sessions s
LEFT JOIN crawl_errors e ON s.session_id = e.session_id
GROUP BY s.id
ORDER BY s.start_time DESC;

COMMIT;
