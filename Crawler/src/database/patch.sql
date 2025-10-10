-- Fix property_images table
DROP TABLE IF EXISTS property_images CASCADE;
DROP SEQUENCE IF EXISTS seq_property_images_id;
CREATE SEQUENCE seq_property_images_id START 1;

CREATE TABLE property_images (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_property_images_id'),
  property_id VARCHAR NOT NULL,
  image_url VARCHAR NOT NULL,
  image_order INTEGER NOT NULL DEFAULT 0,
  is_main_image BOOLEAN DEFAULT FALSE,
  image_type VARCHAR,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  is_downloaded BOOLEAN DEFAULT FALSE,
  image_data BLOB,
  download_date TIMESTAMP,
  download_error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- Fix crawl_sessions table
DROP TABLE IF EXISTS crawl_sessions CASCADE;
DROP SEQUENCE IF EXISTS seq_crawl_sessions_id;
CREATE SEQUENCE seq_crawl_sessions_id START 1;

CREATE TABLE crawl_sessions (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_crawl_sessions_id'),
  session_id VARCHAR UNIQUE NOT NULL,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  target_city VARCHAR,
  max_properties INTEGER,
  properties_found INTEGER DEFAULT 0,
  properties_new INTEGER DEFAULT 0,
  properties_updated INTEGER DEFAULT 0,
  properties_failed INTEGER DEFAULT 0,
  images_downloaded INTEGER DEFAULT 0,
  images_failed INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'running',
  error_message TEXT,
  user_agent VARCHAR,
  ip_address VARCHAR,
  notes TEXT
);

-- Fix crawl_errors table
DROP TABLE IF EXISTS crawl_errors CASCADE;
DROP SEQUENCE IF EXISTS seq_crawl_errors_id;
CREATE SEQUENCE seq_crawl_errors_id START 1;

CREATE TABLE crawl_errors (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_crawl_errors_id'),
  session_id VARCHAR,
  error_type VARCHAR NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  url VARCHAR,
  property_id VARCHAR,
  occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES crawl_sessions(session_id)
);
