# LaunchWise AI — Frontend UI

A production-ready React frontend for the LaunchWise AI business decision intelligence platform. Provides a cinematic glassmorphism UI for analyzing business ideas through a decentralized multi-agent AI system.

## Overview

LaunchWise AI deploys 10 specialized AI agents to autonomously analyze market dynamics, competitor density, and financial viability. The frontend delivers a complete executive brief experience with interactive visualizations, maps, and real-time simulation.

## Tech Stack

- **React 19** — Latest concurrent rendering
- **Vite 8** — Lightning-fast build tooling
- **Tailwind CSS 3** — Utility-first styling with custom design system
- **Framer Motion** — Cinematic animations and page transitions
- **Recharts** — Financial and analytics visualizations
- **Lucide React** — Icon system
- **Google Maps JS API** — Location intelligence with dark mode map
- **Geist Sans** — Typography (Vercel's typeface)

## Quick Start

```bash
cd frontend
npm install
cp .env.example .env  # Add your Google Maps API key
npm run dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JS API key (optional — map degrades gracefully) |

## Build

```bash
npm run build    # Produces dist/
npm run preview  # Preview production build locally
```

## Design Highlights

- **Dark glassmorphism** — Navy/black surfaces with subtle backdrop blur
- **Cinematic animations** — Staggered text reveals, floating particles, scroll-triggered transitions
- **Asymmetrical layouts** — Editorial-style agent architecture showcase
- **Google Maps dark theme** — Seamless integration with the app's visual language

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Hero, live simulations, agent architecture |
| `/analyze` | Analysis | Multi-step form wizard + agent status panel |
| `/results` | Results | Full executive report with 8 tabbed sections |
| `/analytics` | Analytics | Global analytics dashboard (KPI cards, charts) |
| `/consultant` | Consultant | AI chat interface for strategic Q&A |

## Project Structure

```
frontend/
├── public/             # Static assets (hero image, favicon, icons)
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-level page components
│   ├── data/           # Demo scenarios data
│   ├── lib/            # Utility libraries (Google Maps loader)
│   ├── assets/         # Build-time assets
│   ├── App.jsx         # Root component + routing
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles + Tailwind + glassmorphism classes
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```
