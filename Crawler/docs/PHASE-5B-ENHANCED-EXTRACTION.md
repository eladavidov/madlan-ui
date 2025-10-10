# Phase 5B: Enhanced Data Extraction & DuckDB Migration

**Status**: 🔄 In Progress
**Start Date**: 2025-10-10
**Prerequisites**: Phase 5 complete
**Goal**: Extract ALL available data from property pages (including collapsed panels) and migrate to DuckDB with full schema documentation

---

## 📋 Overview

This phase adds comprehensive data extraction for all fields visible on Madlan property pages, including data hidden in collapsed/expandable panels. We're also migrating from SQLite to DuckDB to support detailed schema documentation with table and column descriptions.

### New Data Elements to Extract

1. **Price per sqm** (מחיר למ"ר) - Easy
2. **Expected yield** (תשואה) - Easy
3. **Transaction history** (חשוב לדעת) - Medium (table parsing, first page only)
4. **Price comparisons** (מחירי דירות) - Medium (chart data)
5. **Schools nearby** (בתי ספר) - Medium-High (requires panel expansion)
6. **Neighborhood ratings** (דירוגי השכנים) - Medium-High (requires panel expansion)
7. **Life in neighborhood** (החיים בשכונה) - Low (text extraction)
8. **New construction** (בניה חדשה) - Medium (requires panel expansion)
9. **Map location** (coordinates) - Low (already available)

### Database Migration: SQLite → DuckDB

**Why DuckDB?**
- ✅ Supports `COMMENT ON TABLE` and `COMMENT ON COLUMN` for detailed documentation
- ✅ Better analytics capabilities (built-in analytical functions)
- ✅ SQL-compatible (easy migration from SQLite)
- ✅ Embedded database (no server needed)
- ✅ Better performance for analytical queries

---

## 🗂️ Step 5B.1: DuckDB Migration & Enhanced Schema

**Estimated Time**: 2-3 hours
**Status**: ⏳ Pending

### Tasks - Install DuckDB

- [ ] DuckDB already installed (from Phase 2)
- [ ] Update connection.ts to support DuckDB
- [ ] Create DuckDB database file

### Tasks - Enhanced Schema Design

- [ ] Add new tables for enhanced data:
  - [ ] `transaction_history` - Historical transactions from "חשוב לדעת" section
  - [ ] `nearby_schools` - Schools in the neighborhood
  - [ ] `neighborhood_ratings` - Community ratings (7 different metrics)
  - [ ] `price_comparisons` - Price comparison data by room count
  - [ ] `new_construction_projects` - Nearby construction projects
- [ ] Add new fields to `properties` table:
  - [ ] `price_per_sqm` (DECIMAL) - Price per square meter
  - [ ] `expected_yield` (DECIMAL) - Expected rental yield percentage
  - [ ] `neighborhood_description` (TEXT) - "החיים בשכונה" text
  - [ ] `latitude` (DECIMAL) - Map latitude coordinate
  - [ ] `longitude` (DECIMAL) - Map longitude coordinate
- [ ] Add detailed COMMENT ON TABLE for each table
- [ ] Add detailed COMMENT ON COLUMN for each column

### Tasks - Create Enhanced Schema

- [ ] Create `src/database/schema-duckdb.sql` with:
  - [ ] All tables with detailed comments
  - [ ] All columns with detailed comments
  - [ ] Foreign key relationships
  - [ ] Indexes for performance
- [ ] Create migration script `src/database/migrations/002_duckdb_migration.sql`
- [ ] Document schema in `docs/SCHEMA-DUCKDB.md`

### Tasks - Update Connection Layer

- [ ] Modify `src/database/connection.ts`:
  - [ ] Add DuckDB connection support
  - [ ] Keep SQLite support for backward compatibility
  - [ ] Add config flag: `DB_TYPE=duckdb|sqlite`
- [ ] Update all repositories to work with DuckDB
- [ ] Test database operations (insert, query, upsert)

### Deliverables

- ✅ DuckDB database with full schema documentation
- ✅ Enhanced schema with 5 new tables
- ✅ Migration script from SQLite → DuckDB
- ✅ Updated connection layer supporting both databases

---

## 🔍 Step 5B.2: Panel Expansion Logic

**Estimated Time**: 2-3 hours
**Status**: ⏳ Pending

### Tasks - Generic Panel Expansion

- [ ] Create `src/utils/panelExpander.ts`:
  - [ ] `expandAllPanels(page)` - Find and expand all collapsed sections
  - [ ] `expandPanelByText(page, text)` - Expand specific panel by heading text
  - [ ] `waitForPanelContent(page, selector)` - Wait for content to load after expansion
  - [ ] Handle animation delays (wait for CSS transitions)
  - [ ] Handle AJAX-loaded content
- [ ] Implement selectors for common panel types:
  - [ ] Accordion panels
  - [ ] Collapsible sections
  - [ ] Tab panels
  - [ ] "Show more" buttons

### Tasks - Specific Panel Extractors

- [ ] Create `src/extractors/panelExtractors.ts`:
  - [ ] `expandSchoolsPanel(page)` - Expand schools section
  - [ ] `expandRatingsPanel(page)` - Expand neighborhood ratings
  - [ ] `expandConstructionPanel(page)` - Expand new construction section
  - [ ] `expandTransactionHistoryPanel(page)` - Expand transaction history
- [ ] Add error handling for missing panels
- [ ] Add timeout handling (don't block if panel doesn't exist)

### Deliverables

- ✅ Generic panel expansion utility
- ✅ Specific panel extractors
- ✅ Error handling for missing/failed panels

---

## 📊 Step 5B.3: Enhanced Data Extractors

**Estimated Time**: 4-6 hours
**Status**: ⏳ Pending

### Tasks - Easy Extractions (No Panel Expansion)

- [ ] Extract price per sqm:
  - [ ] Selector: Find "מחיר למ"ר" label
  - [ ] Parse numeric value
  - [ ] Add to property data
- [ ] Extract expected yield:
  - [ ] Selector: Find "תשואה" label
  - [ ] Parse percentage value
  - [ ] Add to property data
- [ ] Extract neighborhood description:
  - [ ] Selector: Find "החיים בשכונה" section
  - [ ] Extract full text content
  - [ ] Add to property data
- [ ] Extract map coordinates:
  - [ ] Parse latitude/longitude from map component
  - [ ] Add to property data

### Tasks - Transaction History Extraction

- [ ] Create `src/extractors/transactionExtractor.ts`:
  - [ ] Expand transaction history panel (if collapsed)
  - [ ] Parse table structure:
    - [ ] Address
    - [ ] Date
    - [ ] Price
    - [ ] Area (sqm)
    - [ ] Price per sqm
    - [ ] Floor
    - [ ] Rooms
    - [ ] Year built
  - [ ] Extract first page only (no pagination)
  - [ ] Return array of transaction objects
- [ ] Create `TransactionHistory` TypeScript interface
- [ ] Add repository method: `TransactionHistoryRepository.insertMany()`

### Tasks - Schools Extraction

- [ ] Create `src/extractors/schoolsExtractor.ts`:
  - [ ] Expand schools panel
  - [ ] Wait for content to load
  - [ ] Parse school list:
    - [ ] School name
    - [ ] School type (בית ספר יסודי, תיכון, etc.)
    - [ ] Distance from property
    - [ ] Grades offered
  - [ ] Extract first page only (no pagination)
  - [ ] Return array of school objects
- [ ] Create `NearbySchool` TypeScript interface
- [ ] Add repository method: `SchoolsRepository.insertMany()`

### Tasks - Neighborhood Ratings Extraction

- [ ] Create `src/extractors/ratingsExtractor.ts`:
  - [ ] Expand ratings panel ("דירוגי השכנים")
  - [ ] Wait for content to load
  - [ ] Extract all ratings (X/10 format):
    - [ ] Community feeling (תחושת קהילה)
    - [ ] Cleanliness (נקיון ותחזוקה)
    - [ ] Schools (בתי ספר)
    - [ ] Public transport (תחבורה ציבורית)
    - [ ] Shopping (קניות וסידורים)
    - [ ] Entertainment (בילוי ופנאי)
    - [ ] Overall rating
  - [ ] Parse numeric ratings (1-10 scale)
  - [ ] Return ratings object
- [ ] Create `NeighborhoodRatings` TypeScript interface
- [ ] Add repository method: `RatingsRepository.upsert()`

### Tasks - Price Comparisons Extraction

- [ ] Create `src/extractors/priceComparisonExtractor.ts`:
  - [ ] Find "מחירי דירות" section
  - [ ] Parse price comparison data:
    - [ ] Average price by room count (3, 4, 5+ rooms)
    - [ ] Old prices (if available)
    - [ ] New prices
  - [ ] Extract trend data (if chart data available)
  - [ ] Return price comparison object
- [ ] Create `PriceComparison` TypeScript interface
- [ ] Add repository method: `PriceComparisonRepository.insertMany()`

### Tasks - New Construction Extraction

- [ ] Create `src/extractors/constructionExtractor.ts`:
  - [ ] Expand "בניה חדשה" panel
  - [ ] Wait for content to load
  - [ ] Parse construction projects:
    - [ ] Project name
    - [ ] Location/address
    - [ ] Distance from property
    - [ ] Status (planned/under construction/completed)
  - [ ] Extract first page only (no pagination)
  - [ ] Return array of construction project objects
- [ ] Create `ConstructionProject` TypeScript interface
- [ ] Add repository method: `ConstructionProjectsRepository.insertMany()`

### Deliverables

- ✅ 8 new data extractors implemented
- ✅ All TypeScript interfaces created
- ✅ Repository methods for all new data types
- ✅ Enhanced property data with ALL fields

---

## 🔗 Step 5B.4: Integration & Testing

**Estimated Time**: 2-3 hours
**Status**: ⏳ Pending

### Tasks - Integrate Enhanced Extractors

- [ ] Update `src/extractors/propertyExtractor.ts`:
  - [ ] Call panel expansion utility at start
  - [ ] Call all new extractors
  - [ ] Collect all enhanced data
  - [ ] Return enhanced property object
- [ ] Update property crawler:
  - [ ] Save enhanced property data
  - [ ] Save transaction history
  - [ ] Save schools data
  - [ ] Save ratings data
  - [ ] Save price comparisons
  - [ ] Save construction projects
- [ ] Add configuration flags:
  - [ ] `EXTRACT_TRANSACTION_HISTORY=true/false`
  - [ ] `EXTRACT_SCHOOLS=true/false`
  - [ ] `EXTRACT_RATINGS=true/false`
  - [ ] `EXTRACT_PRICE_COMPARISONS=true/false`
  - [ ] `EXTRACT_CONSTRUCTION=true/false`

### Tasks - Testing

- [ ] Create `src/tests/test-enhanced-extraction.ts`:
  - [ ] Test panel expansion on local HTML file
  - [ ] Test each extractor individually
  - [ ] Test full integration with property page
  - [ ] Verify all data saved to DuckDB
- [ ] Run quality assessment on enhanced data
- [ ] Compare with backed-up HTML files

### Deliverables

- ✅ Enhanced property extractor integrated
- ✅ All tests passing
- ✅ Enhanced data stored in DuckDB
- ✅ Configuration flags working

---

## 📈 Success Metrics

### Data Completeness

- [ ] All 8 new data categories extracted successfully
- [ ] Price per sqm: 100% accuracy
- [ ] Expected yield: 95%+ extraction rate
- [ ] Transaction history: First page extracted (5-10 transactions)
- [ ] Schools: All schools listed on first page
- [ ] Ratings: All 6-7 rating categories extracted
- [ ] Price comparisons: Average prices by room count
- [ ] Construction projects: All projects on first page
- [ ] Neighborhood description: Full text extracted

### Database Quality

- [ ] DuckDB migration successful
- [ ] All tables have detailed COMMENT ON TABLE
- [ ] All columns have detailed COMMENT ON COLUMN
- [ ] Foreign key relationships working
- [ ] Queries return expected results
- [ ] No data loss during migration

### Performance

- [ ] Panel expansion adds < 5 seconds per property
- [ ] Total extraction time < 30 seconds per property
- [ ] No blocking/CAPTCHA issues from panel expansion
- [ ] Memory usage stable

---

## 🎯 Implementation Order (Incremental Approach)

### Round 1: Database Migration (2-3 hours)

1. Create DuckDB schema with comments
2. Update connection layer
3. Test basic operations
4. Migrate existing SQLite data

### Round 2: Easy Extractions (1-2 hours)

1. Price per sqm
2. Expected yield
3. Neighborhood description
4. Map coordinates

### Round 3: Panel Expansion (2-3 hours)

1. Generic panel expansion utility
2. Test on local HTML files
3. Implement specific panel extractors

### Round 4: Complex Extractions (4-6 hours)

1. Transaction history extractor
2. Schools extractor
3. Ratings extractor
4. Price comparisons extractor
5. Construction projects extractor

### Round 5: Integration & Testing (2-3 hours)

1. Integrate all extractors
2. End-to-end testing
3. Quality assessment report
4. Fix any issues

**Total Estimated Time**: 11-17 hours

---

## 🚨 Known Challenges & Solutions

### Challenge 1: Panel Expansion Detection Risk

**Risk**: More interactions might trigger anti-blocking
**Solution**:
- Test panel expansion on single property first
- Monitor for 403 errors
- Add delays after panel expansion
- Make panel extraction optional via config flags

### Challenge 2: Dynamic Content Loading

**Risk**: Content might load via AJAX after panel expansion
**Solution**:
- Wait for specific selectors after expansion
- Add timeout handling
- Verify content is present before extraction

### Challenge 3: Data Availability

**Risk**: Not all properties have all enhanced data
**Solution**:
- Make all new fields nullable
- Add existence checks before extraction
- Log missing data as warnings (not errors)
- Track data completeness per property

### Challenge 4: Migration Complexity

**Risk**: SQLite → DuckDB migration might lose data
**Solution**:
- Keep SQLite backup before migration
- Test migration on small dataset first
- Verify row counts match after migration
- Implement rollback capability

---

**Last Updated**: 2025-10-10
**Updated By**: Claude Code AI Assistant
**Status**: Ready to start implementation
