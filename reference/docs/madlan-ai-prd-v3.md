# Madlan.co.il AI Enhancement Demo - PRD

## Quick Start for Claude Code

1. Scrape Madlan.co.il homepage with Playwright MCP
2. Build React app replicating the scraped HTML/CSS (Hebrew RTL)
3. Add "שוחח עם AI" button next to search button
4. Implement sliding chat panel (33% width on desktop)
5. Scrape property listings from https://www.madlan.co.il/for-sale/%D7%97%D7%99%D7%A4%D7%94-%D7%99%D7%A9%D7%A8%D7%90%D7%9C?tracking\_search\_source=new\_search\&marketplace=residential
6. Connect chat interactions to filter/update results

## 1\. Project Overview

### Goal

Create a React demo showing how conversational AI search would enhance Madlan.co.il. The demo features an exact homepage clone with an AI chat assistant that helps users find properties through natural language.

### Technical Stack

* **Framework**: React (mobile-first, responsive)
* **Map**: Mapbox GL JS with react-map-gl
* **API Token**: `REACT\_APP\_MAPBOX\_TOKEN` (will be provided)
* **Data**: Scrape 20-30 properties from Madlan's Haifa listings page using Playwright
* **Language**: Hebrew with RTL layout

## 2\. Core Requirements

### 2.1 Homepage Clone

* Create pixel-perfect replica of Madlan.co.il homepage
* Use Playwright MCP to extract actual HTML/CSS
* Maintain all existing elements and functionality
* Preserve Hebrew RTL layout

### 2.2 AI Chat Feature

#### Button

* **Text**: "שוחח עם AI" (Chat with AI)
* **Location**: Next to existing "חיפוש" button in hero section
* **Style**: Match existing green button design with AI icon

#### Chat Panel

* Slides in from right when button clicked
* Header with title and close (X) button
* Shows sample questions before first message:

  * "חפש לי דירת 3 חדרים בחיפה עד 2 מיליון שקל"
  * "דירה עם גינה ליד בתי ספר באזור המרכז"
  * "פנטהאוז עם מרפסת גדולה בתל אביב"
  * "דירת גן עם חניה ומחסן בראשון לציון"

* Chat input field with send button
* Pre-written Hebrew responses with conversation flows:

  * Initial query → AI acknowledges criteria → Shows matching results
  * User refinement → AI confirms change → Updates results
  * Multiple criteria → AI summarizes requirements → Filters results

### 2.3 Layout \& Responsive Behavior

| Screen Size | Chat Panel | Results/Map | Behavior |
|------------|------------|-------------|----------|
| ≥1200px | 33% width | 67% width | Both map + list visible with chat |
| 768-1199px | 40% width | 60% width | Toggle between map OR list with chat |
| <768px | 100% overlay | Hidden when chat open | Full screen chat, swipe down/X to minimize to floating bubble |

### 2.4 Results Display

* Scrape property data from: https://www.madlan.co.il/for-sale/חיפה-ישראל
* Store scraped properties in local JSON file for demo use
* When chat triggers search → update main content area
* Maintain existing Madlan.co.il card layout
* Show property cards from scraped data
* Update results counter to match filtered properties
* Map markers correspond to visible properties

## 3\. Data Collection \& Structure

### Scraping Instructions

Use Playwright MCP to scrape property listings from: https://www.madlan.co.il/for-sale/חיפה-ישראל

* Extract 20-30 property listings
* Capture: price, rooms, floor, area, address, amenities, images
* Store as local JSON file in the project

### Expected Data Structure

```json
{
  "properties": \[
    {
      "id": "1",
      "price": 2500000,
      "rooms": 4,
      "floor": 3,
      "area": 95,
      "address": "רחוב הרצל, חיפה",
      "neighborhood": "הדר",
      "amenities": \["מעלית", "חניה", "מרפסת"],
      "coordinates": {"lat": 32.794, "lng": 34.989},
      "image": "property1.jpg"
    }
  ]
}
```

## 4\. User Flow

1. **Initial State**: Homepage displays, "שוחח עם AI" button visible
2. **Open Chat**: Click button → panel slides in from right
3. **Interact**: User types/selects question → AI responds
4. **Update Results**: Chat triggers search → results update in main area
5. **Refine**: Continue conversation to narrow results
6. **Mobile**: Chat opens fullscreen, minimize to floating bubble, tap bubble to reopen

## 5\. Key Behaviors

* Chat panel persists until explicitly closed
* Results update without page refresh
* Maintain chat history during session
* Smooth 300ms slide animations for panel
* All text in Hebrew with proper RTL support
* Map uses Mapbox Streets style similar to Madlan

## 6\. Implementation Phases

1. **Phase 1**: Homepage clone with "שוחח עם AI" button
2. **Phase 2**: Chat panel with animations
3. **Phase 3**: Connect chat to results display
4. **Phase 4**: Responsive layouts and map/list toggle

## 7\. Out of Scope

* Real AI/LLM integration (use pre-written responses)
* Backend services or APIs
* User authentication
* Property detail pages
* Real-time data updates

## Notes for Implementation

* Use Playwright MCP to scrape:

  1. Homepage styles and structure from www.madlan.co.il
  2. Property listings from https://www.madlan.co.il/for-sale/חיפה-ישראל

* Store scraped properties as local JSON for the demo
* Ensure Mapbox token is configured as environment variable
* Test thoroughly at all three breakpoints (mobile/tablet/desktop)
* Chat should feel natural with realistic Hebrew property search conversations
