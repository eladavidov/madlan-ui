c# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🚨 GIT WORKFLOW POLICY - READ THIS FIRST 🚨

**CRITICAL: Manual Git Control Only**

- ❌ **NEVER commit changes automatically** - User controls all git operations
- ❌ **NEVER run git commands** unless user explicitly requests AND confirms
- ✅ **ALWAYS print commit messages** for user to copy and execute manually
- ✅ **Keep commit messages concise** - Focus on the key changes (3-5 lines typical)
- ✅ **User preference**: Manual git control for all operations

**Exception**: Only handle git directly if user has a major problem AND explicitly says "commit this" or "yes, commit"

**Default behavior for all code changes**:
1. Implement the changes
2. Print a short commit message at the end
3. User copies and commits manually

---

## Project Overview

This repository contains **two related projects**:

### 1. Madlan.co.il AI Enhancement Demo (Main Next.js App)
A React-based real estate website clone with AI chat functionality. Demonstrates how conversational AI search could enhance the Madlan property search experience.

**This is a unified Next.js application** that combines both homepage and property search functionality:
- **Homepage** (`/`): Main Madlan homepage clone with property listings, projects, and blog sections
- **Search Results** (`/search-results`): Property search results page with map integration and filtering
- **Navigation**: Seamless routing between pages with search functionality

Original separate applications are preserved in `reference/static-pages-src/` for reference.

### 2. Madlan Property Crawler (Crawler/ Directory)
A production-ready web crawler built with **Crawlee + Playwright** to scrape property listings from the live Madlan.co.il website.

**Purpose**: Gather real property data from Madlan to populate the demo application.

**Key Files**:
- `Crawler/docs/PRD.md` - Product Requirements Document
- `Crawler/PROJECT-PLAN.md` - Step-by-step implementation plan
- `Crawler/docs/ANTI-BLOCKING.md` - Anti-blocking strategy
- `Crawler/docs/RESEARCH.md` - Website structure research (Phase 1)

**Technology Stack**:
- **Crawlee** - Web scraping framework (wraps Playwright)
- **Playwright** - Browser automation
- **SQLite** - Primary database for property data
- **DuckDB** - Analytical database for queries/reports
- **TypeScript** - Type-safe development

**Status**: ✅ Phases 0-5 Complete - **Production Ready** (Anti-blocking solved!)

## Development Commands

### Main Application (run from root directory):
```bash
npm run dev          # Start development server (typically http://localhost:3001) with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run TypeScript check and Next.js ESLint
npm run format       # Format code with Biome
```

## 🔗 Testing Links (Development Server)

**Always test changes using these links after making modifications:**

### Primary Pages:
- **Homepage (Main/Default)**: http://localhost:3001
  - Test: AI chat button, hero section, property listings, navigation
- **Search Results Page**: http://localhost:3001/search-results
  - Test: Property search, map integration, filters
- **Search Results with Sample Query**: http://localhost:3001/search-results?location=חיפה&type=buy
  - Test: Pre-populated search results

### Testing Workflow:
**MANDATORY: Use Chrome MCP to verify ALL changes before declaring completion**

1. **After ANY UI change** → Use Chrome MCP to test: http://localhost:3001
   - Take screenshot to verify visual layout
   - Test interactive elements (buttons, inputs, navigation)
   - Verify responsive behavior at different screen sizes

2. **After search/results changes** → Test: http://localhost:3001/search-results
   - Verify map integration and property filtering
   - Test search functionality with sample queries

3. **After AI chat changes** → Test AI chat functionality on: http://localhost:3001
   - Click "שוחח עם AI" button to open chat panel
   - Verify 33% right-side layout with 67% main content on left
   - Test resizable splitter (drag between 30%-80% width range)
   - Test closing chat panel (button changes to "סגור צ'אט")
   - Verify Hebrew RTL layout and sample questions display
   - Take screenshots of both open and closed states

4. **After responsive changes** → Test all links at different screen sizes:
   - **Desktop (>1024px)**: 67% main, 33% chat with resizable splitter
   - **Tablet (768-1024px)**: 60% main, 40% chat with resizable splitter
   - **Mobile (<768px)**: Collapsible bottom chat panel with drag-to-resize
   - Use Chrome MCP resize_page or evaluate_script to test breakpoints

**🚨 CRITICAL: Never announce task completion without Chrome MCP verification**

### 📋 MANDATORY: Always End Responses with Testing Links
**When completing any task, ALWAYS end your response with these testing links:**

#### 🔗 Test Your Changes:
- **Homepage (Main)**: http://localhost:3001
- **Search Results**: http://localhost:3001/search-results
- **Search with Sample Data**: http://localhost:3001/search-results?location=חיפה&type=buy

**This should be the LAST part of every response after implementing changes.**

### Original Reference Projects (for development reference only):
The original reference projects are preserved in `reference/static-pages-src/` but contain only build artifacts for historical reference.

The main application uses npm as the package manager and includes Turbopack for faster development builds.

## Architecture & Tech Stack

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom RTL support for Hebrew
- **UI Components**: Radix UI primitives (Homepage), Lucide React icons
- **Maps**: Mapbox for interactive property maps
- **Code Quality**: Biome for formatting and linting, ESLint for additional rules

### Project Structure
```
├── src/                    # 🎯 MAIN APPLICATION SOURCE
│   ├── app/               # Next.js app router pages
│   │   ├── page.tsx       # Homepage (/)
│   │   └── search-results/ # Search results page (/search-results)
│   ├── components/        # Shared UI components
│   │   ├── Header.tsx     # Main site header
│   │   ├── Footer.tsx     # Site footer
│   │   ├── HeroSection.tsx      # Homepage hero with search
│   │   ├── PropertyCard*.tsx    # Property listing cards
│   │   ├── FilterBar.tsx        # Search filters
│   │   └── Map.tsx              # Interactive property map
│   ├── data/             # Property data (JSON files) and DAL
│   │   ├── dal/          # Data Access Layer
│   │   ├── properties.json # Property listings data
│   │   └── projects.json   # Project listings data
│   └── lib/              # Utility functions
├── reference/            # Reference materials and original sources
│   ├── chat-ux-demo.html # UI demo and reference file
│   ├── docs/            # Project documentation
│   ├── screenshots/     # Comparison screenshots and testing
│   └── static-pages-src/ # Original reference projects
│       ├── Homepage/    # Original homepage source
│       └── Haifa/      # Original Haifa page source
├── package.json          # Dependencies and scripts
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── eslint.config.mjs     # ESLint configuration
├── biome.json           # Biome formatter configuration
├── components.json      # UI components configuration
├── postcss.config.mjs   # PostCSS configuration
├── netlify.toml         # Netlify deployment configuration
├── CLAUDE.md           # Project instructions for Claude Code
└── node_modules/       # Dependencies (generated)
```

### Key Components
- **Property Cards**: Consistent property listing display across both projects
- **Map Integration**: Interactive property map using Mapbox
- **RTL Layout**: Full Hebrew RTL support with proper text direction
- **Responsive Design**: Mobile-first approach with breakpoint-specific layouts
- **Data Layer**: Property and project data stored in JSON files with TypeScript DAL

## Important Implementation Details

### Hebrew RTL Support
- All text content is in Hebrew with proper RTL layout
- CSS classes use RTL-aware positioning (mr/ml swapped appropriately)
- Text direction is properly handled in all components

### Property Data Structure
Properties follow this interface pattern:
```typescript
interface Property {
  id: string
  price: number
  rooms: number
  size: number
  floor?: number
  address: string
  neighborhood: string
  city: string
  image: string
  type: string
  parking?: boolean
  elevator?: boolean
  balcony?: boolean
}
```

### Current Features
- **Unified Navigation**: Seamless routing between homepage and property search
- **Search Integration**: Homepage search button navigates to search results page
- **Pixel-Perfect UI**: Exact visual match with original Madlan design
- **Interactive Map**: Property locations displayed on Mapbox map
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **✅ AI Chat Panel**: Fully implemented and tested chat interface that:
  - Slides in from the right side (33% width on desktop)
  - Integrated layout (not overlay) with main content on left (67% width)
  - **✅ Resizable Splitter**: Drag-to-resize between 30%-80% width range
  - Shows sample Hebrew property search queries with RTL layout
  - Professional header with close button ("סגור צ'אט" when open)
  - Interactive sample questions and chat input field
  - Smooth transitions and hover effects on splitter
  - **✅ Verified with Chrome MCP**: All functionality tested and working

### Responsive Design Implementation
- **✅ Desktop Layout** (>1024px): 67% main content, 33% chat panel with resizable splitter
- **✅ Tablet Layout** (768-1024px): 60% main content, 40% chat panel with resizable splitter
- **✅ Mobile Layout** (<768px): Collapsible bottom chat panel with drag-to-resize functionality
  - **✅ Collapse/Expand**: Chat panel collapses to small bar instead of disappearing
  - **✅ Touch Drag**: Vertical drag-to-resize between 10%-80% of screen height
  - **✅ Persistent Access**: Chat remains accessible after closing (doesn't disappear)
- **✅ Breakpoint Detection**: Automatic layout switching using window resize detection
- **✅ Tested Layouts**: All three responsive states verified with Chrome MCP

### Planned Enhancements
- **Results Integration**: Connect chat interactions to filter property results
- **Advanced Chat Features**: Conversation history and improved responses

### Code Quality Standards
- Biome configuration disables many accessibility rules for rapid prototyping
- TypeScript strict mode is enabled
- ESLint with Next.js config provides additional linting
- Double quotes are preferred for JavaScript/TypeScript strings

---

## Crawler Project (Crawler/ Directory)

### Required MCP Servers

**CRITICAL**: The crawler project requires MCP (Model Context Protocol) servers for browser automation and research.

#### Chrome DevTools MCP (Primary - For Research)
**Purpose**: AI-assisted website research and testing

**Configuration** (add to Claude Code MCP settings):
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"]
    }
  }
}
```

**Verification**:
```bash
claude mcp list
# Should show: chrome-devtools: ✓ Connected
```

**Available Tools** (after restart):
- `mcp__chrome-devtools__new_page` - Open new browser page
- `mcp__chrome-devtools__navigate_page` - Navigate to URL
- `mcp__chrome-devtools__take_screenshot` - Capture screenshots
- `mcp__chrome-devtools__click` - Click elements
- `mcp__chrome-devtools__evaluate_script` - Run JavaScript
- `mcp__chrome-devtools__list_console_messages` - View console logs

#### Playwright MCP (Alternative)
**Purpose**: Additional browser automation capabilities

**Configuration**:
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

### MCP Setup Workflow

**Before starting crawler work:**

1. **Add MCP Configuration** (see above)
2. **Restart Claude Code** completely
3. **Verify Connection**:
   ```bash
   claude mcp list
   ```
4. **Test Tools**: Claude should be able to use `mcp__chrome-devtools__new_page`

**If tools not available after restart:**
- Check MCP server output for errors
- Verify Node.js is installed (required for `npx`)
- Try manual installation: `npm install -g chrome-devtools-mcp@latest`

### Crawler Development Commands

**From Crawler/ directory** (once Phase 2 complete):
```bash
npm install              # Install dependencies
npm run crawl            # Run full crawl
npm run crawl:test       # Test on 5-10 properties
npm run export:json      # Export to JSON
npm run analyze          # Run DuckDB analytics
```

### Crawler Project Status

**📚 MASTER DOCUMENT**: See **`Crawler/PROJECT-PLAN.md`** - **START HERE FOR ALL SESSIONS**

**🚨 CRITICAL ISSUE DISCOVERED (2025-10-14)**:
- **Retry Mechanism Gap**: Only retries failed **properties**, NOT failed **search pages**
- **Impact**: ~34 properties lost per blocked search page (~3-4% data loss projected)
- **Action Required**: Implement search page retry after Step 3 completes
- **Status**: Step 3 in progress, implementation scheduled after completion

**Quick Status** (2025-10-14):
- ✅ **Step 2 Complete**: 201 properties crawled (98% success rate)
- 🚧 **Step 3 IN PROGRESS**: 500 properties target, 15 search pages
- ⚠️ **Known Issues**: 1+ search pages with extraction failures detected
- 🔧 **Next Action**: Implement search page retry mechanism (see PROJECT-PLAN.md)

**Session Resumption** (for Claude Code):
1. **Always read** `Crawler/PROJECT-PLAN.md` at session start
2. **CHECK "🚨 CRITICAL: Retry Mechanism Gap" section** - top priority
3. **Check crawler status**: Is it running? Show database state
4. **If Step 3 complete**: Implement search page retry before Step 4
5. **Follow guide**: See PROJECT-PLAN.md "Session Resumption Guide" section

**Key Accomplishments**:
- Fresh browser per search page (0% blocking)
- Fresh browser per property (98% success)
- Automatic retry mechanism (permanent feature)
- 201 properties with full Phase 5B data in database

**📖 Documentation**:
- `Crawler/PROJECT-PLAN.md` - Master status document (read at every session start)
- `Crawler/docs/PRD.md` - Product Requirements Document
- `Crawler/docs/ANTI-BLOCKING.md` - Anti-blocking strategy
- `Crawler/docs/SOLUTION-IMPLEMENTED.md` - Technical implementation
- `Crawler/docs/RESEARCH.md` - Website structure research
- `Crawler/docs/SCHEMA.md` - Database schema
- `Crawler/docs/SCRAPING-TIMEOUTS.md` - Time estimates

**💬 Monitoring Live Crawls**:
When a production crawl is running, user can type **"status"** for compact updates:
```
X/TARGET complete (Z%) | ⏱️  Time elapsed | ✅ Success rate | ❌ Failures
Rate: ~X.X properties/min | ETA: ~X hours
```

---

## Old Session Notes (Pre-2025-10-14)

<details>
<summary>Click to expand historical development notes</summary>

**Note**: The details below are from earlier development sessions and are kept for historical reference only. For current status, always refer to `Crawler/PROJECT-PLAN.md`.

**Session 2025-10-13 Afternoon**:
1. ✅ **Fixed search results pagination** - Fresh browser per search page (not per property)
   - **Problem**: PerimeterX blocked pagination even with 60-120s delays (reusing same browser session)
   - **Solution**: Complete refactor to launch fresh browser for each search page
   - **Architecture**: `createSinglePageCrawler()` + orchestrator loop with delays
   - **Test Results**: 3 pages crawled with 102 URLs extracted (34+34+34), **0% blocking rate**
   - **Config**: Added SEARCH_PAGE_DELAY_MIN/MAX environment variables (60-120s default)
   - **Implementation**: `src/crawlers/searchCrawler.ts` (345 lines, complete rewrite)
2. ✅ **Repository cleanup** - Removed temporary files and old test artifacts
   - Deleted: `test-pagination.ts`, `check-backup.ts`, `debug-screenshots/`, `storage/`, old test scripts
   - Kept: `schema-report-with-data.html`, `verify-database.ts`
3. ✅ **Updated documentation** - CLAUDE.md git policy + PROJECT-PLAN.md streamlined

**🎉 Major Achievement - Anti-Blocking Solution**:
- **Solution**: Fresh browser per property with random delays (60-120s) + HEADLESS=false
- **Test Results**: 100% success rate validated (100-property test: 34/34, HEADLESS test: 2/2)
- **Status**: Production-ready with DuckDB-only architecture
- **Implementation**: `src/crawlers/singleBrowserCrawler.ts`

**Key Capabilities**:
- ✅ 100% anti-blocking success rate - bypasses PerimeterX protection completely
- ✅ **DuckDB-only architecture** - Simplified from dual SQLite+DuckDB to single database (Phase 5C)
- ✅ **Manual ID generation** - Fixed DuckDB schema (removed sequences, using manual IDs)
- ✅ **Enhanced extraction** (38+ fields + 11 amenities + panel data)
- ✅ Image downloading with caching and retry logic
- ✅ Resume capability (upserts existing properties, skips already-downloaded images)
- ✅ **Live progress updates** (every 15 seconds) - Verified working
- ✅ HTTP retry logic for server errors (520/502/503)

**Production Scaling**:
- **3000 properties**: 2-4 nights (sequential overnight batches, 500-1000/night)
- **Performance**: ~0.4-0.7 property/minute with production delays (60-120s)
- **Ready for deployment**: All systems verified and tested

**Known Issues**:
- ⚠️ **BLOB image storage**: Optimization needed for bulk image downloads (may hang on large batches)
- **Workaround**: Can disable image downloads for initial large crawl, add images later in smaller batches

**🚀 READY FOR PRODUCTION CRAWL (2025-10-11 Evening)**:

**Pre-Production Checklist**:
- ✅ Database cleaned (fresh start for production)
- ✅ Schema report enhanced with intelligent column sampling
- ✅ Anti-blocking verified (70% success with test delays, expect 80-90% with production 60-120s delays)
- ✅ All Phase 5B extractors integrated and working

**Production Crawling Workflow**:
1. **Start Small**: Begin with 50-property test batch
2. **Verify Database**: Check table counts after EACH batch
3. **Stop if Issues**: If tables are empty or blocking detected, STOP and fix code
4. **Incremental Scale**: 50 → 200 → 500 → full 3,600 properties

**Database Verification Command** (run after each batch):
```bash
cd Crawler && npx ts-node src/scripts/check-table-counts.ts
```

**Expected Data Coverage** (at minimum):
- ✅ **properties**: Should have records for all crawled properties
- ✅ **neighborhood_ratings**: Most properties should have ratings (80%+)
- ✅ **price_comparisons**: Most properties should have price data (80%+)
- ⚠️ **transaction_history, schools, construction**: May be empty (not all properties have this data)
- ❌ **property_images**: Will be empty if using --no-images flag

**🚨 CRITICAL: Stop Crawling If**:
- Properties table is empty after crawling
- Success rate drops below 50%
- Major blocking issues detected (403 errors, CAPTCHAs)

**Schema Report**: [file:///C:/Src/Madlan/Crawler/tests/schema-report-with-data.html](file:///C:/Src/Madlan/Crawler/tests/schema-report-with-data.html)
**Property Data Review**: [file:///C:/Src/Madlan/Crawler/tests/property-data-review.html](file:///C:/Src/Madlan/Crawler/tests/property-data-review.html)

**Latest: Phase 5B Extractor Fixes (2025-10-11 Late Evening)**:
- ✅ **Transaction Extractor Complete Rewrite** (`src/extractors/transactionExtractor.ts`):
  - **Problem**: Was returning 0 results when 5+ transactions visible on page
  - **Solution**: Complete rewrite with proper DOM traversal and bullet-point parsing
  - **Key Changes**:
    - Find "היסטוריית עסקאות" heading → walk up DOM to find container
    - Parse row data by splitting on bullet points (•)
    - Extract 8 fields using regex patterns (address, date, size, price/sqm, rooms, floor, year, price)
  - **Result**: Now extracts 9 transactions with all fields correctly populated
- ✅ **Schools Extractor HTML Structure Parsing** (`src/extractors/schoolsExtractor.ts`):
  - **Problem**: School names were concatenating all text without proper field separation
  - **Solution**: Parse HTML structure using CSS class selectors
  - **Key Changes**:
    - `.css-1wi4udx` → School name
    - `.css-pewcrd` → Address
    - `.css-1vf85xs` → Type and grades
  - **Result**: 10 schools with clean separated fields (name: "מוריה", address: "מרדכי אנילביץ' 14, חיפה", type: "ממלכתי דתי", grades: "א-ו")
- ✅ **Construction Projects Extractor Complete Rewrite** (`src/extractors/constructionExtractor.ts`) **(2025-10-12)**:
  - **Problem**: Extractor was looking in wrong section - "בניה חדשה" h3 section is often empty
  - **Root Cause**: Construction projects are in "פרויקטים חדשים בסביבה" (New Projects in the Area) section at bottom of page
  - **Solution**: Complete rewrite to extract from project link cards
  - **Key Changes**:
    - Find all links with "חד׳" AND "קומות" AND city name
    - Parse concatenated text using regex patterns
    - Extract: project name, room range, floors, starting price, location
    - Clean up "פרויקט חדש" prefix from names
  - **Result**: Successfully extracting 70 projects from 9 properties (~7.8 per property)
  - **✅ ALL 7 DATA SECTIONS NOW WORKING**: Properties, Transactions, Schools, Ratings, Price Comparisons, Construction Projects, Neighborhood Data
- ✅ **Project Cleanup Complete**:
  - Deleted all log files from root and `logs/` directory
  - Removed old test scripts (kept only comprehensive versions)
  - Deleted old Crawlee `storage/` directory (using DuckDB-only architecture)
  - Generated comprehensive Hebrew RTL property data review page
  - All Phase 5B extractors verified working with actual property data

**Previous: Phase 5B Integration Test Results (2025-10-11 Afternoon)**:
- ✅ **3-Property Test Crawl**: 3/3 success (100%)
- ✅ **Phase 5B Data Extraction Working**:
  - Neighborhood ratings: 2 records saved
  - Price comparisons: 4 records saved (1+1+2 from 3 properties)
  - Transaction history, schools, construction: No data available on these properties (normal - not all properties have this data)
- ✅ **Repository Integration**: All 5 Phase 5B repositories working with manual ID generation
- ✅ **Extractor Integration**: All extractors successfully integrated into main crawler
- ✅ **TypeScript Compilation**: Build successful with all Phase 5B code
- ✅ **Production Ready**: All enhanced data extraction working as expected

**Recent Fixes & Updates (2025-10-11 Morning - DuckDB DateTime + Haifa Target)**:
- ✅ **DuckDB DateTime Compatibility** - Fixed 4 critical bugs (SQLite → DuckDB migration):
  - Fixed `CrawlSessionRepository.completeSession()`: `datetime('now')` → `CURRENT_TIMESTAMP`
  - Fixed `CrawlSessionRepository.interruptSession()`: `datetime('now')` → `CURRENT_TIMESTAMP`
  - Fixed `CrawlSessionRepository.deleteOldSessions()`: Fixed interval syntax
  - Fixed `PropertyRepository.findStale()`: Fixed interval syntax
- ✅ **Foreign Key Constraint Handling** - Wrapped session completion in try-catch blocks (graceful error handling)
- ✅ **Schema Report Generation** - Created `tests/schema-report-with-data.html` with:
  - Complete table/column documentation (135+ COMMENT statements)
  - Sample data display from actual database
  - Production deployment information
- ✅ **Haifa Production Target** - Updated PROJECT-PLAN.md:
  - Target: ~3,600 Haifa properties for sale
  - Search URL: https://www.madlan.co.il/for-sale/%D7%97%D7%99%D7%A4%D7%94-%D7%99%D7%A9%D7%A8%D7%90%D7%9C?tracking_search_source=new_search&marketplace=residential
  - All datetime fixes documented
  - Ready for production deployment

**Previous Updates (2025-10-11 Afternoon - Phase 5B Integration)**:
- ✅ Phase 5B Integration: Integrated all Phase 5B extractors into main crawler
- ✅ Fixed Manual ID Generation: Added getNextId() to 5 Phase 5B repositories (RatingsRepository, PriceComparisonRepository, ConstructionProjectsRepository, SchoolsRepository, TransactionHistoryRepository)
- ✅ Repository Integration: All Phase 5B repositories integrated with DuckDB-only architecture
- ✅ Extractor Integration: All extractors (transaction, schools, ratings, price comparison, construction) added to singleBrowserCrawler.ts
- ✅ Testing Complete: 3-property test crawl with 100% success, Phase 5B data extraction verified
- ✅ TypeScript Build: Successful compilation with all Phase 5B code

**Previous Updates (2025-10-10 Evening)**:
- ✅ Phase 5C: Removed SQLite support (DuckDB-only architecture)
- ✅ Fixed DuckDB schema (removed sequences, using manual ID generation)
- ✅ Updated all repositories for manual ID generation
- ✅ Verified monitoring capabilities (progress updates, logging, session tracking)
- ✅ Verified resume capability (upserts properties, skips images)
- ✅ Cleaned up Crawler directory (removed obsolete files, logs, storage)

**📖 Complete Documentation**:
- **`Crawler/PROJECT-PLAN.md`** - **START HERE** - Master plan with session continuity, breakthrough details, and next steps
- `Crawler/docs/SOLUTION-IMPLEMENTED.md` - Technical implementation details
- `Crawler/docs/ANTI-BLOCKING.md` - Anti-blocking strategy documentation
- `Crawler/docs/SCRAPING-TIMEOUTS.md` - **NEW**: Comprehensive timeout documentation and time estimates
- `Crawler/tests/enhanced-quality-report.html` - **NEW**: Enhanced quality report with DuckDB schema
- `Crawler/docs/PRD.md` - Product Requirements Document
- `Crawler/docs/RESEARCH.md` - Website structure research

**💬 Monitoring Live Crawls**:
When a production crawl is running, the user can type **"status"** for a compact progress update:
```
[N]/34 complete (X%) | ⏱️ Xm elapsed | ✅ 100% success | ❌ 0 failed
Now: Property N
Rate: ~0.47 properties/min | Remaining: ~Xm | Finish ETA: ~HH:MM
```
This provides quick, non-intrusive updates without verbose logs.</details>
