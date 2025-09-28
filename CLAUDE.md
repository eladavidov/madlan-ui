# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains the Madlan.co.il AI Enhancement Demo - a React-based real estate website clone with AI chat functionality. The project demonstrates how conversational AI search could enhance the Madlan property search experience.

**This is a unified Next.js application** that combines both homepage and property search functionality:
- **Homepage** (`/`): Main Madlan homepage clone with property listings, projects, and blog sections
- **Haifa** (`/haifa`): Property search results page specifically for Haifa listings with map integration
- **Navigation**: Seamless routing between pages with search functionality

Original separate applications are preserved in `static-pages-src/` and `original-sources/` for reference.

## Development Commands

### Main Application (run from root directory):
```bash
npm run dev          # Start development server on http://localhost:3000 with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run TypeScript check and Next.js ESLint
npm run format       # Format code with Biome
```

### Original Reference Projects (for development reference only):
```bash
# Homepage reference
cd static-pages-src/Homepage
npm run dev          # Start on http://localhost:3000

# Haifa reference  
cd static-pages-src/Haifa
npm run dev          # Start on http://localhost:3000
```

The main application uses npm as the package manager and includes Turbopack for faster development builds.

## Architecture & Tech Stack

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom RTL support for Hebrew
- **UI Components**: Radix UI primitives (Homepage), Lucide React icons
- **Maps**: React Leaflet for Haifa project
- **Code Quality**: Biome for formatting and linting, ESLint for additional rules

### Project Structure
```
├── src/                    # 🎯 MAIN APPLICATION SOURCE
│   ├── app/               # Next.js app router pages
│   │   ├── page.tsx       # Homepage (/)
│   │   └── haifa/         # Haifa search page (/haifa)
│   ├── components/        # Shared UI components
│   │   ├── Header.tsx     # Main site header
│   │   ├── Footer.tsx     # Site footer
│   │   ├── HeroSection.tsx      # Homepage hero with search
│   │   ├── PropertyCard*.tsx    # Property listing cards
│   │   ├── FilterBar.tsx        # Search filters
│   │   └── Map.tsx              # Interactive property map
│   ├── data/             # Property data and interfaces
│   └── lib/              # Utility functions
├── docs/                 # Project documentation
├── package.json          # Dependencies and scripts
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── node_modules/         # Dependencies
├── static-pages-src/     # Original reference projects
│   ├── Homepage/         # Original homepage source
│   └── Haifa/           # Original Haifa page source
├── original-sources/     # Additional reference sources
└── screenshots/         # Comparison screenshots and testing
    └── backup/         # Previous screenshot versions
```

### Key Components
- **Property Cards**: Consistent property listing display across both projects
- **Map Integration**: Interactive property map using React Leaflet (Haifa only)
- **RTL Layout**: Full Hebrew RTL support with proper text direction
- **Responsive Design**: Mobile-first approach with breakpoint-specific layouts
- **Mock Data**: Local property data stored in TypeScript files

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
- **Search Integration**: Homepage search button navigates to Haifa results page
- **Pixel-Perfect UI**: Exact visual match with original Madlan design
- **Interactive Map**: Property locations displayed on React Leaflet map
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### Planned AI Chat Integration
The project is designed to integrate an AI chat panel that:
- Slides in from the right side (33% width on desktop)
- Shows sample Hebrew property search queries
- Filters and updates property results based on conversation
- Maintains responsive behavior across all screen sizes

### Code Quality Standards
- Biome configuration disables many accessibility rules for rapid prototyping
- TypeScript strict mode is enabled
- ESLint with Next.js config provides additional linting
- Double quotes are preferred for JavaScript/TypeScript strings