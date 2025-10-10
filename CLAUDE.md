c# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

**📚 MASTER DOCUMENT**: See **`Crawler/PROJECT-PLAN.md`** - **START HERE**

**Current Status**: ✅ **PRODUCTION READY** - Phases 0-5 Complete + All Critical Bugs Fixed
**Breakthrough Date**: 2025-10-09 - **Anti-blocking solved with 100% success rate!**
**Latest Update**: 2025-10-10 - **Production crawl in progress (500 properties)**

**🎉 Major Achievement - Anti-Blocking Solution**:
- **Solution**: Fresh browser per property with random delays (60-120s) + HEADLESS=false
- **Test Results**: 100% success rate validated (100-property test: 34/34, HEADLESS test: 2/2)
- **Status**: Production-ready and actively crawling (Night 1: 500 properties)
- **Implementation**: `src/crawlers/singleBrowserCrawler.ts`

**Key Capabilities**:
- ✅ 100% anti-blocking success rate - bypasses PerimeterX protection completely
- ✅ Property extraction (38 fields + 11 amenities) with validated accuracy
- ✅ Image downloading with caching and retry logic
- ✅ Resume capability (skips already-crawled properties)
- ✅ Live progress updates (every 15 seconds)
- ✅ HTTP retry logic for server errors (520/502/503)

**Production Scaling**:
- **2000 properties**: 2-4 nights (sequential overnight batches, 500/night)
- **Performance**: ~0.4-0.7 property/minute with production delays
- **Current Progress**: Night 1 crawl running (500 properties)

**Known Issues**: None - All critical issues resolved ✅

**Recent Fixes (2025-10-09 to 2025-10-10)**:
- ✅ Rooms extraction bug fixed (multi-strategy extraction with validation)
- ✅ Progress stats now updating live (every 15 seconds)
- ✅ HTTP retry logic implemented (520/502/503 errors)
- ✅ Headless detection solved (HEADLESS=false + enhanced browser flags)

**📖 Complete Documentation**:
- **`Crawler/PROJECT-PLAN.md`** - **START HERE** - Master plan with session continuity, breakthrough details, and next steps
- `Crawler/docs/SOLUTION-IMPLEMENTED.md` - Technical implementation details
- `Crawler/docs/ANTI-BLOCKING.md` - Anti-blocking strategy documentation
- `Crawler/docs/PRD.md` - Product Requirements Document
- `Crawler/docs/RESEARCH.md` - Website structure research