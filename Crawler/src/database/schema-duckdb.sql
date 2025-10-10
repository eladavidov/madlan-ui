-- ============================================================================
-- Madlan Property Crawler - DuckDB Database Schema
-- ============================================================================
-- Database: DuckDB (chosen for full schema documentation support)
-- Created: 2025-10-10
-- Purpose: Store comprehensive property data from Madlan.co.il
-- Features: Full COMMENT ON TABLE and COMMENT ON COLUMN documentation
-- ============================================================================

-- ============================================================================
-- PROPERTIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS properties (
  -- Primary Key
  id VARCHAR PRIMARY KEY,

  -- Source Information
  url VARCHAR UNIQUE NOT NULL,
  source_url VARCHAR,

  -- Basic Property Information
  price INTEGER,
  rooms DECIMAL(3,1),
  size DECIMAL(6,2),
  floor INTEGER,
  total_floors INTEGER,

  -- NEW: Enhanced Property Metrics
  price_per_sqm INTEGER,
  expected_yield DECIMAL(5,2),

  -- Location Information
  address VARCHAR,
  neighborhood VARCHAR,
  city VARCHAR NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  -- Property Type & Details
  property_type VARCHAR,
  description TEXT,
  neighborhood_description TEXT,

  -- Amenities (Boolean flags)
  has_parking BOOLEAN DEFAULT FALSE,
  parking_spaces INTEGER,
  has_elevator BOOLEAN DEFAULT FALSE,
  has_balcony BOOLEAN DEFAULT FALSE,
  balcony_size DECIMAL(5,2),
  has_air_conditioning BOOLEAN DEFAULT FALSE,
  has_security_door BOOLEAN DEFAULT FALSE,
  has_bars BOOLEAN DEFAULT FALSE,
  has_storage BOOLEAN DEFAULT FALSE,
  has_shelter BOOLEAN DEFAULT FALSE,
  is_accessible BOOLEAN DEFAULT FALSE,
  is_renovated BOOLEAN DEFAULT FALSE,
  is_furnished BOOLEAN DEFAULT FALSE,

  -- Additional Fields
  entry_date VARCHAR,
  listing_date DATE,
  last_updated DATE,

  -- Contact Information
  contact_name VARCHAR,
  contact_phone VARCHAR,
  contact_agency VARCHAR,

  -- Metadata
  first_crawled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_crawled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  crawl_count INTEGER NOT NULL DEFAULT 1,

  -- Data Quality Flags
  data_complete BOOLEAN DEFAULT TRUE,
  has_errors BOOLEAN DEFAULT FALSE,
  error_notes TEXT
);

COMMENT ON TABLE properties IS 'Main table storing comprehensive property listings data from Madlan.co.il including basic info, amenities, location, and pricing details';

COMMENT ON COLUMN properties.id IS 'Unique property identifier extracted from Madlan URL (e.g., "LNkcTRJRods")';
COMMENT ON COLUMN properties.url IS 'Full Madlan property page URL';
COMMENT ON COLUMN properties.source_url IS 'Original listing URL if different from Madlan URL';
COMMENT ON COLUMN properties.price IS 'Property price in Israeli Shekels (₪)';
COMMENT ON COLUMN properties.rooms IS 'Number of rooms including half rooms (e.g., 3.5, 4.0, 5.5)';
COMMENT ON COLUMN properties.size IS 'Property size in square meters (m²)';
COMMENT ON COLUMN properties.floor IS 'Floor number (negative for basement, 0 for ground floor)';
COMMENT ON COLUMN properties.total_floors IS 'Total number of floors in the building';
COMMENT ON COLUMN properties.price_per_sqm IS 'Price per square meter in ₪ (calculated: price / size)';
COMMENT ON COLUMN properties.expected_yield IS 'Expected rental yield percentage (תשואה %)';
COMMENT ON COLUMN properties.address IS 'Street address (e.g., "שער הגיא 11")';
COMMENT ON COLUMN properties.neighborhood IS 'Neighborhood name in Hebrew (e.g., "אחוזה", "כרמל")';
COMMENT ON COLUMN properties.city IS 'City name in Hebrew (e.g., "חיפה", "תל אביב")';
COMMENT ON COLUMN properties.latitude IS 'Geographic latitude coordinate for map location';
COMMENT ON COLUMN properties.longitude IS 'Geographic longitude coordinate for map location';
COMMENT ON COLUMN properties.property_type IS 'Type of property in Hebrew (דירה, פנטהאוז, דירת גן, דופלקס, etc.)';
COMMENT ON COLUMN properties.description IS 'Full property description text from listing (Hebrew)';
COMMENT ON COLUMN properties.neighborhood_description IS 'Description of life in the neighborhood (החיים בשכונה)';
COMMENT ON COLUMN properties.has_parking IS 'TRUE if property has parking space(s)';
COMMENT ON COLUMN properties.parking_spaces IS 'Number of parking spaces available';
COMMENT ON COLUMN properties.has_elevator IS 'TRUE if building has elevator (מעלית)';
COMMENT ON COLUMN properties.has_balcony IS 'TRUE if property has balcony/balconies (מרפסת)';
COMMENT ON COLUMN properties.balcony_size IS 'Total balcony size in square meters';
COMMENT ON COLUMN properties.has_air_conditioning IS 'TRUE if property has air conditioning (מזגן)';
COMMENT ON COLUMN properties.has_security_door IS 'TRUE if property has security door (דלת בטחון)';
COMMENT ON COLUMN properties.has_bars IS 'TRUE if property has window bars (סורגים)';
COMMENT ON COLUMN properties.has_storage IS 'TRUE if property has storage room (מחסן)';
COMMENT ON COLUMN properties.has_shelter IS 'TRUE if property has safe room/shelter (ממ"ד)';
COMMENT ON COLUMN properties.is_accessible IS 'TRUE if property is wheelchair accessible (נגיש לנכים)';
COMMENT ON COLUMN properties.is_renovated IS 'TRUE if property has been renovated (משופץ)';
COMMENT ON COLUMN properties.is_furnished IS 'TRUE if property comes furnished (מרוהט)';
COMMENT ON COLUMN properties.entry_date IS 'When tenant can move in (תאריך כניסה, e.g., "גמיש", "מיידי")';
COMMENT ON COLUMN properties.listing_date IS 'Date when property was first listed on Madlan';
COMMENT ON COLUMN properties.last_updated IS 'Date when listing was last updated on Madlan';
COMMENT ON COLUMN properties.contact_name IS 'Name of property contact person/agent';
COMMENT ON COLUMN properties.contact_phone IS 'Phone number of property contact';
COMMENT ON COLUMN properties.contact_agency IS 'Real estate agency name if applicable';
COMMENT ON COLUMN properties.first_crawled_at IS 'Timestamp when property was first crawled by our system';
COMMENT ON COLUMN properties.last_crawled_at IS 'Timestamp when property was last crawled';
COMMENT ON COLUMN properties.crawl_count IS 'Number of times this property has been crawled';
COMMENT ON COLUMN properties.data_complete IS 'TRUE if all expected fields were successfully extracted';
COMMENT ON COLUMN properties.has_errors IS 'TRUE if errors occurred during extraction';
COMMENT ON COLUMN properties.error_notes IS 'Description of any errors encountered during extraction';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_rooms ON properties(rooms);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_price_per_sqm ON properties(price_per_sqm);
CREATE INDEX IF NOT EXISTS idx_properties_first_crawled ON properties(first_crawled_at);

-- ============================================================================
-- PROPERTY_IMAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_images (
  id INTEGER PRIMARY KEY,
  property_id VARCHAR NOT NULL,

  image_url VARCHAR NOT NULL,
  image_order INTEGER NOT NULL DEFAULT 0,
  is_main_image BOOLEAN DEFAULT FALSE,

  image_type VARCHAR,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,

  is_downloaded BOOLEAN DEFAULT FALSE,
  local_path VARCHAR,
  download_date TIMESTAMP,
  download_error TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (property_id) REFERENCES properties(id)
);

COMMENT ON TABLE property_images IS 'Stores image URLs and metadata for property photos, including download status and local file paths';

COMMENT ON COLUMN property_images.id IS 'Auto-incrementing primary key for image records';
COMMENT ON COLUMN property_images.property_id IS 'Foreign key to properties table - which property this image belongs to';
COMMENT ON COLUMN property_images.image_url IS 'Full URL to the image on Madlan CDN';
COMMENT ON COLUMN property_images.image_order IS 'Order of image in property gallery (0 = first/main image)';
COMMENT ON COLUMN property_images.is_main_image IS 'TRUE if this is the primary thumbnail image for the property';
COMMENT ON COLUMN property_images.image_type IS 'Image type/format (e.g., "thumbnail", "full", "webp", "jpg")';
COMMENT ON COLUMN property_images.width IS 'Image width in pixels';
COMMENT ON COLUMN property_images.height IS 'Image height in pixels';
COMMENT ON COLUMN property_images.file_size IS 'Image file size in bytes';
COMMENT ON COLUMN property_images.is_downloaded IS 'TRUE if image has been downloaded to local storage';
COMMENT ON COLUMN property_images.local_path IS 'Relative path to downloaded image file (e.g., "data/images/LNkcTRJRods/0.webp")';
COMMENT ON COLUMN property_images.download_date IS 'Timestamp when image was successfully downloaded';
COMMENT ON COLUMN property_images.download_error IS 'Error message if image download failed';
COMMENT ON COLUMN property_images.created_at IS 'Timestamp when this image record was created';

CREATE INDEX IF NOT EXISTS idx_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_images_order ON property_images(property_id, image_order);

-- ============================================================================
-- TRANSACTION_HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS transaction_history (
  id INTEGER PRIMARY KEY,
  property_id VARCHAR NOT NULL,

  transaction_address VARCHAR,
  transaction_date DATE,
  transaction_price INTEGER,
  transaction_size DECIMAL(6,2),
  transaction_price_per_sqm INTEGER,
  transaction_floor INTEGER,
  transaction_rooms DECIMAL(3,1),
  year_built INTEGER,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (property_id) REFERENCES properties(id)
);

COMMENT ON TABLE transaction_history IS 'Historical real estate transactions for the property or nearby properties (from "חשוב לדעת" section) - helps understand pricing trends';

COMMENT ON COLUMN transaction_history.id IS 'Auto-incrementing primary key for transaction records';
COMMENT ON COLUMN transaction_history.property_id IS 'Foreign key to properties table - related property';
COMMENT ON COLUMN transaction_history.transaction_address IS 'Address where transaction occurred (may be same property or nearby)';
COMMENT ON COLUMN transaction_history.transaction_date IS 'Date when the real estate transaction completed';
COMMENT ON COLUMN transaction_history.transaction_price IS 'Sale price in Israeli Shekels (₪)';
COMMENT ON COLUMN transaction_history.transaction_size IS 'Property size in square meters at time of sale';
COMMENT ON COLUMN transaction_history.transaction_price_per_sqm IS 'Price per square meter for this transaction';
COMMENT ON COLUMN transaction_history.transaction_floor IS 'Floor number of property that was sold';
COMMENT ON COLUMN transaction_history.transaction_rooms IS 'Number of rooms in property that was sold';
COMMENT ON COLUMN transaction_history.year_built IS 'Year the building was constructed';
COMMENT ON COLUMN transaction_history.created_at IS 'Timestamp when transaction record was added to database';

CREATE INDEX IF NOT EXISTS idx_transactions_property ON transaction_history(property_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transaction_history(transaction_date);

-- ============================================================================
-- NEARBY_SCHOOLS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS nearby_schools (
  id INTEGER PRIMARY KEY,
  property_id VARCHAR NOT NULL,

  school_name VARCHAR NOT NULL,
  school_type VARCHAR,
  grades_offered VARCHAR,
  distance_meters INTEGER,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (property_id) REFERENCES properties(id)
);

COMMENT ON TABLE nearby_schools IS 'Schools near the property (from "בתי ספר" section) - important for families with children';

COMMENT ON COLUMN nearby_schools.id IS 'Auto-incrementing primary key for school records';
COMMENT ON COLUMN nearby_schools.property_id IS 'Foreign key to properties table - which property this school is near';
COMMENT ON COLUMN nearby_schools.school_name IS 'Full name of the school in Hebrew';
COMMENT ON COLUMN nearby_schools.school_type IS 'Type of school (בית ספר יסודי, תיכון, גן ילדים, etc.)';
COMMENT ON COLUMN nearby_schools.grades_offered IS 'Grades/classes offered (e.g., "א-ו", "ז-יב")';
COMMENT ON COLUMN nearby_schools.distance_meters IS 'Walking distance from property in meters';
COMMENT ON COLUMN nearby_schools.created_at IS 'Timestamp when school record was added to database';

CREATE INDEX IF NOT EXISTS idx_schools_property ON nearby_schools(property_id);

-- ============================================================================
-- NEIGHBORHOOD_RATINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS neighborhood_ratings (
  id INTEGER PRIMARY KEY,
  property_id VARCHAR NOT NULL UNIQUE,

  community_feeling INTEGER,
  cleanliness_maintenance INTEGER,
  schools_quality INTEGER,
  public_transport INTEGER,
  shopping_convenience INTEGER,
  entertainment_leisure INTEGER,
  overall_rating DECIMAL(3,1),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (property_id) REFERENCES properties(id)
);

COMMENT ON TABLE neighborhood_ratings IS 'Community ratings for the neighborhood (from "דירוגי השכנים" section) - ratings on scale of 1-10 for various quality-of-life metrics';

COMMENT ON COLUMN neighborhood_ratings.id IS 'Auto-incrementing primary key for rating records';
COMMENT ON COLUMN neighborhood_ratings.property_id IS 'Foreign key to properties table (one rating set per property/neighborhood)';
COMMENT ON COLUMN neighborhood_ratings.community_feeling IS 'Community feeling rating 1-10 (תחושת קהילה) - how welcoming and connected the neighborhood feels';
COMMENT ON COLUMN neighborhood_ratings.cleanliness_maintenance IS 'Cleanliness and maintenance rating 1-10 (נקיון ותחזוקה) - how well-maintained streets and buildings are';
COMMENT ON COLUMN neighborhood_ratings.schools_quality IS 'Schools quality rating 1-10 (בתי ספר) - quality of local educational institutions';
COMMENT ON COLUMN neighborhood_ratings.public_transport IS 'Public transportation rating 1-10 (תחבורה ציבורית) - availability and convenience of buses, trains';
COMMENT ON COLUMN neighborhood_ratings.shopping_convenience IS 'Shopping convenience rating 1-10 (קניות וסידורים) - proximity to stores, supermarkets, services';
COMMENT ON COLUMN neighborhood_ratings.entertainment_leisure IS 'Entertainment and leisure rating 1-10 (בילוי ופנאי) - availability of restaurants, cafes, cultural activities';
COMMENT ON COLUMN neighborhood_ratings.overall_rating IS 'Overall neighborhood rating (weighted average or separate overall score)';
COMMENT ON COLUMN neighborhood_ratings.created_at IS 'Timestamp when ratings were recorded';

CREATE INDEX IF NOT EXISTS idx_ratings_property ON neighborhood_ratings(property_id);

-- ============================================================================
-- PRICE_COMPARISONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS price_comparisons (
  id INTEGER PRIMARY KEY,
  property_id VARCHAR NOT NULL,

  room_count INTEGER NOT NULL,
  average_price INTEGER,
  old_price INTEGER,
  new_price INTEGER,
  price_trend VARCHAR,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (property_id) REFERENCES properties(id)
);

COMMENT ON TABLE price_comparisons IS 'Price comparison data by room count (from "מחירי דירות" section) - shows average prices and trends for similar properties';

COMMENT ON COLUMN price_comparisons.id IS 'Auto-incrementing primary key for price comparison records';
COMMENT ON COLUMN price_comparisons.property_id IS 'Foreign key to properties table - which property these comparisons relate to';
COMMENT ON COLUMN price_comparisons.room_count IS 'Number of rooms for this price comparison (3, 4, 5, etc.)';
COMMENT ON COLUMN price_comparisons.average_price IS 'Average price in ₪ for properties with this room count in the neighborhood';
COMMENT ON COLUMN price_comparisons.old_price IS 'Previous average price (if trend data available)';
COMMENT ON COLUMN price_comparisons.new_price IS 'Current/recent average price (if trend data available)';
COMMENT ON COLUMN price_comparisons.price_trend IS 'Price trend direction (up/down/stable) or percentage change';
COMMENT ON COLUMN price_comparisons.created_at IS 'Timestamp when price comparison was recorded';

CREATE INDEX IF NOT EXISTS idx_price_comparisons_property ON price_comparisons(property_id);
CREATE INDEX IF NOT EXISTS idx_price_comparisons_rooms ON price_comparisons(room_count);

-- ============================================================================
-- NEW_CONSTRUCTION_PROJECTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS new_construction_projects (
  id INTEGER PRIMARY KEY,
  property_id VARCHAR NOT NULL,

  project_name VARCHAR,
  project_location VARCHAR,
  distance_meters INTEGER,
  project_status VARCHAR,
  completion_date VARCHAR,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (property_id) REFERENCES properties(id)
);

COMMENT ON TABLE new_construction_projects IS 'New construction projects near the property (from "בניה חדשה" section) - can impact property value and neighborhood development';

COMMENT ON COLUMN new_construction_projects.id IS 'Auto-incrementing primary key for construction project records';
COMMENT ON COLUMN new_construction_projects.property_id IS 'Foreign key to properties table - which property these projects are near';
COMMENT ON COLUMN new_construction_projects.project_name IS 'Name of the construction project in Hebrew';
COMMENT ON COLUMN new_construction_projects.project_location IS 'Location/address of construction project';
COMMENT ON COLUMN new_construction_projects.distance_meters IS 'Distance from property in meters';
COMMENT ON COLUMN new_construction_projects.project_status IS 'Project status (planned/תוכנית, under construction/בבניה, completed/הושלם)';
COMMENT ON COLUMN new_construction_projects.completion_date IS 'Expected or actual completion date';
COMMENT ON COLUMN new_construction_projects.created_at IS 'Timestamp when project record was added to database';

CREATE INDEX IF NOT EXISTS idx_construction_property ON new_construction_projects(property_id);

-- ============================================================================
-- CRAWL_SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS crawl_sessions (
  id INTEGER PRIMARY KEY,
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

COMMENT ON TABLE crawl_sessions IS 'Tracks crawler execution sessions with statistics and status - used for monitoring and debugging crawler runs';

COMMENT ON COLUMN crawl_sessions.id IS 'Auto-incrementing primary key for session records';
COMMENT ON COLUMN crawl_sessions.session_id IS 'Unique identifier for this crawler session (UUID or timestamp-based)';
COMMENT ON COLUMN crawl_sessions.start_time IS 'When the crawler session started';
COMMENT ON COLUMN crawl_sessions.end_time IS 'When the crawler session ended (NULL if still running)';
COMMENT ON COLUMN crawl_sessions.target_city IS 'City targeted for this crawl session (e.g., "חיפה")';
COMMENT ON COLUMN crawl_sessions.max_properties IS 'Maximum number of properties configured for this session';
COMMENT ON COLUMN crawl_sessions.properties_found IS 'Total number of properties discovered during crawl';
COMMENT ON COLUMN crawl_sessions.properties_new IS 'Number of new properties added to database';
COMMENT ON COLUMN crawl_sessions.properties_updated IS 'Number of existing properties updated';
COMMENT ON COLUMN crawl_sessions.properties_failed IS 'Number of properties that failed to crawl';
COMMENT ON COLUMN crawl_sessions.images_downloaded IS 'Total number of images successfully downloaded';
COMMENT ON COLUMN crawl_sessions.images_failed IS 'Number of images that failed to download';
COMMENT ON COLUMN crawl_sessions.status IS 'Session status (running/completed/failed/interrupted)';
COMMENT ON COLUMN crawl_sessions.error_message IS 'Error message if session failed';
COMMENT ON COLUMN crawl_sessions.user_agent IS 'Browser user agent string used for this session';
COMMENT ON COLUMN crawl_sessions.ip_address IS 'IP address used for crawling (useful for debugging blocks)';
COMMENT ON COLUMN crawl_sessions.notes IS 'Any additional notes about this session';

CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON crawl_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON crawl_sessions(status);

-- ============================================================================
-- CRAWL_ERRORS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS crawl_errors (
  id INTEGER PRIMARY KEY,
  session_id VARCHAR,

  error_type VARCHAR NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,

  url VARCHAR,
  property_id VARCHAR,

  occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES crawl_sessions(session_id)
);

COMMENT ON TABLE crawl_errors IS 'Logs all errors encountered during crawling for debugging and quality monitoring';

COMMENT ON COLUMN crawl_errors.id IS 'Auto-incrementing primary key for error records';
COMMENT ON COLUMN crawl_errors.session_id IS 'Foreign key to crawl_sessions - which session this error occurred in';
COMMENT ON COLUMN crawl_errors.error_type IS 'Category of error (navigation/extraction/validation/network/blocking/timeout)';
COMMENT ON COLUMN crawl_errors.error_message IS 'Human-readable error message';
COMMENT ON COLUMN crawl_errors.error_stack IS 'Full stack trace for debugging (if available)';
COMMENT ON COLUMN crawl_errors.url IS 'URL where the error occurred';
COMMENT ON COLUMN crawl_errors.property_id IS 'Property ID being processed when error occurred (if applicable)';
COMMENT ON COLUMN crawl_errors.occurred_at IS 'Timestamp when error occurred';

CREATE INDEX IF NOT EXISTS idx_errors_session ON crawl_errors(session_id);
CREATE INDEX IF NOT EXISTS idx_errors_type ON crawl_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_errors_occurred ON crawl_errors(occurred_at);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Note: Views commented out temporarily due to DuckDB GROUP BY strictness
-- TODO: Rewrite views to be compatible with DuckDB requirements

-- -- View: Recent properties with main image and full address
-- CREATE VIEW IF NOT EXISTS v_recent_properties AS
-- SELECT
--   p.*,
--   pi.image_url as main_image_url,
--   pi.local_path as main_image_path,
--   p.address || ', ' || p.neighborhood || ', ' || p.city as full_address
-- FROM properties p
-- LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.is_main_image = TRUE
-- ORDER BY p.first_crawled_at DESC;

-- -- View: Properties with comprehensive statistics
-- CREATE VIEW IF NOT EXISTS v_properties_with_stats AS
-- SELECT
--   p.id,
--   COUNT(pi.id) as image_count,
--   SUM(CASE WHEN pi.is_downloaded THEN 1 ELSE 0 END) as images_downloaded,
--   COUNT(th.id) as transaction_count,
--   COUNT(ns.id) as schools_count,
--   CASE WHEN nr.id IS NOT NULL THEN TRUE ELSE FALSE END as has_ratings
-- FROM properties p
-- LEFT JOIN property_images pi ON p.id = pi.property_id
-- LEFT JOIN transaction_history th ON p.id = th.property_id
-- LEFT JOIN nearby_schools ns ON p.id = ns.property_id
-- LEFT JOIN neighborhood_ratings nr ON p.id = nr.property_id
-- GROUP BY p.id;

-- -- View: Crawl session summary with error counts
-- CREATE VIEW IF NOT EXISTS v_session_summary AS
-- SELECT
--   s.id,
--   s.session_id,
--   s.start_time,
--   s.end_time,
--   s.status,
--   COUNT(DISTINCT e.id) as error_count,
--   ROUND((s.properties_new::DECIMAL / NULLIF(s.properties_found, 0)) * 100, 2) as success_rate_pct
-- FROM crawl_sessions s
-- LEFT JOIN crawl_errors e ON s.session_id = e.session_id
-- GROUP BY s.id, s.session_id, s.start_time, s.end_time, s.status, s.properties_new, s.properties_found
-- ORDER BY s.start_time DESC;
