# Madlan Crawler - Database Schema Documentation

**Created**: 2025-10-08
**Database**: SQLite
**Version**: 1.0.0
**Status**: Phase 1.2 Complete

---

## Overview

This document describes the database schema for the Madlan Property Crawler. The schema is designed to store property listings from Madlan.co.il, including property details, images, crawl session tracking, and error logging.

### Design Principles

1. **Comprehensive Coverage**: Captures all fields discovered during research (Phase 1.1)
2. **Nullable Fields**: Many fields are nullable to handle missing data gracefully
3. **Extensibility**: Designed for future expansion (other cities, property types)
4. **Change Tracking**: Property history table for tracking changes over time
5. **Error Handling**: Dedicated error logging for debugging and monitoring
6. **Performance**: Indexes on common query patterns

---

## Database Tables

### 1. properties

**Purpose**: Main table storing property listing data

**Primary Key**: `id` (TEXT) - Unique property identifier from Madlan

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | TEXT | NOT NULL | - | Primary key, property ID from Madlan |
| `url` | TEXT | NOT NULL | - | Property listing URL (UNIQUE) |
| `source_url` | TEXT | NULL | - | Original source URL if different |
| `price` | INTEGER | NULL | - | Price in ₪ (shekels) |
| `rooms` | REAL | NULL | - | Number of rooms (0.5 increments) |
| `size` | REAL | NULL | - | Size in square meters |
| `floor` | INTEGER | NULL | - | Floor number (negative for basement, 0 for ground) |
| `total_floors` | INTEGER | NULL | - | Total floors in building |
| `address` | TEXT | NULL | - | Full street address (Hebrew) |
| `neighborhood` | TEXT | NULL | - | Neighborhood name (Hebrew) |
| `city` | TEXT | NOT NULL | - | City name (Hebrew) - required for filtering |
| `property_type` | TEXT | NULL | - | Type: דירה, פנטהאוז, דירת גן, etc. |
| `description` | TEXT | NULL | - | Full property description (Hebrew) |
| `has_parking` | BOOLEAN | NULL | 0 | Has parking spot |
| `parking_spaces` | INTEGER | NULL | - | Number of parking spots |
| `has_elevator` | BOOLEAN | NULL | 0 | Building has elevator |
| `has_balcony` | BOOLEAN | NULL | 0 | Has balcony |
| `balcony_size` | REAL | NULL | - | Balcony size in m² |
| `has_air_conditioning` | BOOLEAN | NULL | 0 | Has A/C |
| `has_security_door` | BOOLEAN | NULL | 0 | Has security door (דלת פלדה) |
| `has_bars` | BOOLEAN | NULL | 0 | Has window bars (סורגים) |
| `has_storage` | BOOLEAN | NULL | 0 | Has storage room (מחסן) |
| `has_shelter` | BOOLEAN | NULL | 0 | Has safe room (ממ"ד) |
| `is_accessible` | BOOLEAN | NULL | 0 | Wheelchair accessible (נגיש לנכים) |
| `is_renovated` | BOOLEAN | NULL | 0 | Recently renovated (משופץ) |
| `is_furnished` | BOOLEAN | NULL | 0 | Furnished (מרוהט) |
| `entry_date` | TEXT | NULL | - | Move-in date (תאריך כניסה) |
| `listing_date` | TEXT | NULL | - | When first listed on Madlan |
| `last_updated` | TEXT | NULL | - | Last update timestamp from Madlan |
| `contact_name` | TEXT | NULL | - | Agent/owner name |
| `contact_phone` | TEXT | NULL | - | Contact phone number |
| `contact_agency` | TEXT | NULL | - | Real estate agency |
| `first_crawled_at` | TEXT | NOT NULL | datetime('now') | When first discovered by crawler |
| `last_crawled_at` | TEXT | NOT NULL | datetime('now') | Most recent crawl timestamp |
| `crawl_count` | INTEGER | NOT NULL | 1 | Number of times crawled |
| `data_complete` | BOOLEAN | NULL | 1 | Flag if all expected data was extracted |
| `has_errors` | BOOLEAN | NULL | 0 | Flag if errors occurred during extraction |
| `error_notes` | TEXT | NULL | - | Error notes from extraction |

**Indexes**:
- `idx_properties_city` on `city`
- `idx_properties_price` on `price`
- `idx_properties_rooms` on `rooms`
- `idx_properties_neighborhood` on `neighborhood`
- `idx_properties_property_type` on `property_type`
- `idx_properties_first_crawled` on `first_crawled_at`
- `idx_properties_last_crawled` on `last_crawled_at`

**Constraints**:
- `url` must be UNIQUE
- `city` is required (NOT NULL)

---

### 2. property_images

**Purpose**: Stores image URLs and metadata for property galleries

**Primary Key**: `id` (INTEGER AUTOINCREMENT)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | NOT NULL | AUTOINCREMENT | Auto-increment primary key |
| `property_id` | TEXT | NOT NULL | - | Foreign key to properties table |
| `image_url` | TEXT | NOT NULL | - | Full image URL |
| `image_order` | INTEGER | NOT NULL | 0 | Order in gallery (0 = main) |
| `is_main_image` | BOOLEAN | NULL | 0 | Flag for primary listing image |
| `image_type` | TEXT | NULL | - | Type: thumbnail, full, etc. |
| `width` | INTEGER | NULL | - | Image width in pixels |
| `height` | INTEGER | NULL | - | Image height in pixels |
| `file_size` | INTEGER | NULL | - | File size in bytes |
| `is_downloaded` | BOOLEAN | NULL | 0 | Whether image is downloaded locally |
| `local_path` | TEXT | NULL | - | Local filesystem path |
| `download_date` | TEXT | NULL | - | When image was downloaded |
| `download_error` | TEXT | NULL | - | Error message if download failed |
| `created_at` | TEXT | NOT NULL | datetime('now') | When record was created |

**Indexes**:
- `idx_images_property_id` on `property_id`
- `idx_images_is_main` on `is_main_image`
- `idx_images_order` on `(property_id, image_order)`

**Foreign Keys**:
- `property_id` REFERENCES `properties(id)` ON DELETE CASCADE

---

### 3. crawl_sessions

**Purpose**: Tracks crawling sessions and their statistics

**Primary Key**: `id` (INTEGER AUTOINCREMENT)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | NOT NULL | AUTOINCREMENT | Auto-increment primary key |
| `session_id` | TEXT | NOT NULL | - | Unique session identifier (UNIQUE) |
| `start_time` | TEXT | NOT NULL | datetime('now') | Session start timestamp |
| `end_time` | TEXT | NULL | - | Session end timestamp |
| `target_city` | TEXT | NULL | - | Target city for this session |
| `max_properties` | INTEGER | NULL | - | Max properties to crawl |
| `properties_found` | INTEGER | NOT NULL | 0 | Total properties discovered |
| `properties_new` | INTEGER | NOT NULL | 0 | New properties added |
| `properties_updated` | INTEGER | NOT NULL | 0 | Existing properties updated |
| `properties_failed` | INTEGER | NOT NULL | 0 | Properties that failed to process |
| `images_downloaded` | INTEGER | NOT NULL | 0 | Images successfully downloaded |
| `images_failed` | INTEGER | NOT NULL | 0 | Image downloads that failed |
| `status` | TEXT | NOT NULL | 'running' | Status: running, completed, failed, interrupted |
| `error_message` | TEXT | NULL | - | Error message if session failed |
| `user_agent` | TEXT | NULL | - | Browser user agent used |
| `ip_address` | TEXT | NULL | - | IP address used for crawling |
| `notes` | TEXT | NULL | - | Additional session notes |

**Indexes**:
- `idx_sessions_start_time` on `start_time`
- `idx_sessions_status` on `status`

**Constraints**:
- `session_id` must be UNIQUE

---

### 4. crawl_errors

**Purpose**: Logs errors encountered during crawling

**Primary Key**: `id` (INTEGER AUTOINCREMENT)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | NOT NULL | AUTOINCREMENT | Auto-increment primary key |
| `session_id` | TEXT | NULL | - | Foreign key to crawl_sessions |
| `error_type` | TEXT | NOT NULL | - | Type: navigation, extraction, validation, network |
| `error_message` | TEXT | NOT NULL | - | Error message |
| `error_stack` | TEXT | NULL | - | Stack trace if available |
| `url` | TEXT | NULL | - | URL where error occurred |
| `property_id` | TEXT | NULL | - | Property ID being processed |
| `occurred_at` | TEXT | NOT NULL | datetime('now') | Error timestamp |

**Indexes**:
- `idx_errors_session` on `session_id`
- `idx_errors_type` on `error_type`
- `idx_errors_occurred` on `occurred_at`

**Foreign Keys**:
- `session_id` REFERENCES `crawl_sessions(session_id)`
- `property_id` REFERENCES `properties(id)`

---

### 5. property_history

**Purpose**: Tracks changes to property data over time (optional, for future use)

**Primary Key**: `id` (INTEGER AUTOINCREMENT)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | NOT NULL | AUTOINCREMENT | Auto-increment primary key |
| `property_id` | TEXT | NOT NULL | - | Foreign key to properties |
| `field_name` | TEXT | NOT NULL | - | Name of field that changed |
| `old_value` | TEXT | NULL | - | Previous value (JSON string) |
| `new_value` | TEXT | NULL | - | New value (JSON string) |
| `changed_at` | TEXT | NOT NULL | datetime('now') | Change timestamp |
| `session_id` | TEXT | NULL | - | Session ID when change occurred |

**Indexes**:
- `idx_history_property` on `property_id`
- `idx_history_changed` on `changed_at`

**Foreign Keys**:
- `property_id` REFERENCES `properties(id)` ON DELETE CASCADE
- `session_id` REFERENCES `crawl_sessions(session_id)`

---

## Database Views

### v_recent_properties

**Purpose**: Recent properties with their main image URL

```sql
SELECT
  p.*,
  pi.image_url as main_image_url
FROM properties p
LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.is_main_image = 1
ORDER BY p.first_crawled_at DESC;
```

### v_properties_with_stats

**Purpose**: Properties with image statistics

```sql
SELECT
  p.*,
  COUNT(pi.id) as image_count,
  SUM(CASE WHEN pi.is_downloaded = 1 THEN 1 ELSE 0 END) as images_downloaded
FROM properties p
LEFT JOIN property_images pi ON p.id = pi.property_id
GROUP BY p.id;
```

### v_session_summary

**Purpose**: Crawl sessions with error counts

```sql
SELECT
  s.*,
  COUNT(DISTINCT e.id) as error_count
FROM crawl_sessions s
LEFT JOIN crawl_errors e ON s.session_id = e.session_id
GROUP BY s.id
ORDER BY s.start_time DESC;
```

---

## Data Types & Validation Rules

### Property Fields

#### price (INTEGER)
- **Range**: 100,000 - 50,000,000 ₪
- **Validation**: Must be positive
- **Null Handling**: Acceptable for properties without listed price

#### rooms (REAL)
- **Range**: 0.5 - 15
- **Increments**: 0.5 (e.g., 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5...)
- **Validation**: Must be >= 0.5
- **Null Handling**: Acceptable if not specified

#### size (REAL)
- **Range**: 20 - 1000 m²
- **Validation**: Must be positive
- **Null Handling**: Acceptable if not specified

#### floor (INTEGER)
- **Range**: -2 to 50+
- **Special Values**:
  - Negative: Basement levels
  - 0: Ground floor
  - Positive: Upper floors
- **Null Handling**: Acceptable for houses/cottages

#### property_type (TEXT)
**Valid Values** (Hebrew):
- `דירה` - Apartment
- `פנטהאוז` - Penthouse
- `דירת גן` - Garden apartment
- `דופלקס` - Duplex
- `סטודיו` - Studio
- `מיני פנטהאוז` - Mini penthouse
- `טריפלקס` - Triplex
- `דירת גג` - Rooftop apartment
- `בית פרטי` - Private house
- `קוטג'` - Cottage

### Boolean Fields

All amenity fields (`has_*`, `is_*`) default to `0` (false) and can be `NULL` if information is unavailable.

### Date/Time Fields

All timestamps stored as TEXT in SQLite datetime format: `YYYY-MM-DD HH:MM:SS`

---

## Field Mapping (Madlan → Database)

Based on RESEARCH.md and properties.json analysis:

| Madlan Field (Hebrew) | Database Column | Type | Notes |
|----------------------|-----------------|------|-------|
| מחיר | price | INTEGER | In ₪ |
| חדרים | rooms | REAL | 0.5 increments |
| מ"ר | size | REAL | Square meters |
| קומה | floor | INTEGER | Can be negative |
| כתובת | address | TEXT | Full address |
| שכונה | neighborhood | TEXT | Neighborhood |
| עיר | city | TEXT | City name |
| סוג נכס | property_type | TEXT | Property type |
| תיאור | description | TEXT | Description |
| חניה | has_parking | BOOLEAN | Has parking |
| מעלית | has_elevator | BOOLEAN | Has elevator |
| מרפסת | has_balcony | BOOLEAN | Has balcony |
| מזגן | has_air_conditioning | BOOLEAN | Has A/C |
| ממ"ד | has_shelter | BOOLEAN | Safe room |
| משופץ | is_renovated | BOOLEAN | Renovated |
| מרוהט | is_furnished | BOOLEAN | Furnished |

---

## Common Queries

### Find properties in a city
```sql
SELECT * FROM properties WHERE city = 'חיפה' ORDER BY price;
```

### Find properties in price range
```sql
SELECT * FROM properties
WHERE price BETWEEN 1000000 AND 2000000
ORDER BY price;
```

### Find properties with specific room count
```sql
SELECT * FROM properties WHERE rooms = 3.5;
```

### Properties with main image
```sql
SELECT * FROM v_recent_properties LIMIT 10;
```

### Get session statistics
```sql
SELECT * FROM v_session_summary WHERE status = 'completed';
```

### Find properties needing images
```sql
SELECT p.id, p.address, COUNT(pi.id) as image_count
FROM properties p
LEFT JOIN property_images pi ON p.id = pi.property_id
GROUP BY p.id
HAVING image_count = 0;
```

---

## DuckDB Integration

The SQLite database can be queried using DuckDB for analytics:

```sql
-- Attach SQLite database in DuckDB
ATTACH 'data/databases/properties.db' AS sqlite_db (TYPE sqlite);

-- Query from DuckDB
SELECT * FROM sqlite_db.properties;

-- Analytics example: Average price by neighborhood
SELECT
  neighborhood,
  COUNT(*) as property_count,
  AVG(price) as avg_price,
  MIN(price) as min_price,
  MAX(price) as max_price
FROM sqlite_db.properties
WHERE city = 'חיפה'
GROUP BY neighborhood
ORDER BY avg_price DESC;
```

---

## Migration Strategy

1. **Initial Setup** (001_initial.sql):
   - Create all tables
   - Create indexes
   - Create views

2. **Future Migrations** (if needed):
   - `002_add_field.sql` - Add new fields
   - `003_alter_index.sql` - Modify indexes
   - Format: `{number}_{description}.sql`

---

## Backup & Maintenance

### Backup Strategy
```bash
# Backup SQLite database
sqlite3 data/databases/properties.db ".backup data/backups/properties_$(date +%Y%m%d).db"

# Export to JSON
npm run export:json
```

### Vacuum (Optimize)
```sql
-- Reclaim unused space and optimize
VACUUM;

-- Analyze for query optimization
ANALYZE;
```

---

## Next Steps (Phase 2)

1. Implement database connection layer (`src/database/connection.ts`)
2. Create repository classes for each table
3. Test schema with sample data from `properties.json`
4. Verify all field mappings during actual crawling

---

**Schema Version**: 1.0.0
**Last Updated**: 2025-10-08
**Status**: Ready for Phase 2 Implementation
