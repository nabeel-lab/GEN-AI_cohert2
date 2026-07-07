# UI Architecture

## Pages

```
/          → LandingPage        Marketing homepage with hero, demos, agent showcase
/analyze   → AnalysisPage        Multi-step form wizard → Agent orchestration
/results   → ResultsPage         Full executive report (8 sections)
/analytics → AnalyticsPage       Global analytics dashboard
/consultant → ConsultantPage     AI chat interface
*          → Navigate to /       Catch-all redirect
```

All routes are wrapped in `<AnimatePresence mode="wait">` with `location` + `key={location.pathname}` for page transitions.

## Component Hierarchy

```
App.jsx
├── ProductTour (onboarding overlay — 13 steps)
├── Navbar (floating glass navigation with auto-hide)
└── AnimatePresence > Routes
    ├── LandingPage
    │   ├── HeroIllustration (animated floating elements)
    │   ├── Demo scenario cards (from DEMO_SCENARIOS)
    │   ├── Agent architecture showcase
    │   └── Tech stack section
    ├── AnalysisPage
    │   ├── Multi-step form (4 steps)
    │   ├── LocationPicker (Google Maps)
    │   └── AgentStatusPanel (10 agents)
    ├── ResultsPage
    │   ├── ExecutiveBrief (score ring, verdict, summary)
    │   ├── OverviewTab (health score, metrics, breakdown)
    │   ├── AIInsightsTab (reasoning, confidence, strengths)
    │   ├── MarketTab (demand score, trends, seasonality)
    │   ├── CompetitorsTab (competitor cards, SWOT)
    │   ├── FinanceTab (area chart, bar chart, table)
    │   ├── LocationTab (metrics, stat bars, LocationMap)
    │   ├── PersonasTab (customer profile cards)
    │   ├── RiskTab (risk score, mitigations, supply chain)
    │   ├── ReportTab (JSON download, summary)
    │   ├── SectionHeader (transition divider + title)
    │   ├── WhatIfSimulator (floating simulation panel)
    │   └── ChatPanel (floating AI chat)
    ├── AnalyticsPage
    │   ├── KPI cards (4 metrics)
    │   ├── VerdictDistribution (PieChart)
    │   ├── TopVectors (BarChart)
    │   └── RegionalPerformance (table)
    └── ConsultantPage
        ├── Suggested prompts
        └── Chat messages
```

## Reusable Components

| Component | File | Used In |
|---|---|---|
| Navbar | `components/Navbar.jsx` | App shell (all pages) |
| HeroIllustration | `components/HeroIllustration.jsx` | LandingPage |
| LocationPicker | `components/LocationPicker.jsx` | AnalysisPage |
| AgentStatusPanel | `components/AgentStatusPanel.jsx` | AnalysisPage |
| ChatPanel | `components/ChatPanel.jsx` | ResultsPage |
| WhatIfSimulator | `components/WhatIfSimulator.jsx` | ResultsPage |
| ProductTour | `components/ProductTour.jsx` | App shell (overlay) |

## Animation System

- **Page transitions:** `AnimatePresence mode="wait"` with route key
- **Scroll reveals:** `whileInView` with `sectionFadeUp` variants
- **Text reveals:** Staggered word animation (blur + translate)
- **Micro-interactions:** `whileHover`, `whileTap` on cards, buttons
- **Floating elements:** Infinite `animate` loops with `y` oscillation
- **Score animations:** `useCountUp` hook (ease-out-cubic) + SVG `strokeDashoffset`
- **Loading states:** `animate-pulse`, `animate-spin`

## Hooks

| Hook | Source | Purpose |
|---|---|---|
| `useScroll` | framer-motion | Parallax background offset |
| `useTransform` | framer-motion | Map scroll progress to style values |
| `useMotionValueEvent` | framer-motion | Navbar show/hide on scroll direction |
| `useCountUp` | ResultsPage (inline) | Animated number counting |
| `useWindowSize` | ProductTour (inline) | Responsive spotlight + dialog positioning |

## Routing

- `react-router-dom` v7 with `<BrowserRouter>`
- `<Routes>` keyed by `location.pathname` for AnimatePresence exit animations
- Demo data injection in ProductTour (sessionStorage for /results tour steps)

## State Management

- **Local state:** `useState` / `useReducer` per component
- **Session storage:** Analysis report stored as `lw_report` in `sessionStorage`
- **Local storage:** Tour completion flag (`lw_has_seen_tour`)
- **Props:** Report data passed from ResultsPage to sub-tabs (no global store)

## Theme

Dark theme with complete Tailwind customization:

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| `background` | `#050505` | Page background |
| `surface` | `#0A0A0A` | Card/panel surfaces |
| `surfaceHover` | `#111111` | Elevated states |
| `border` | `rgba(255,255,255,0.06)` | Subtle borders |
| `muted` | `#71717a` | Secondary text |
| `gold-400` | `#a1a1aa` | Accent (muted zinc) |
| `gold-500` | `#71717a` | Accent (muted zinc) |
| `accent-teal` | `#6fffe9` | Highlight |
| `accent-blue` | `#3B82F6` | Interactive elements |

### Typography

- **Font:** Geist Sans via `@fontsource/geist-sans` (400, 500, 600, 700)
- **Body:** `text-zinc-300`, `font-light`, `text-[15px]`
- **Headings:** `text-zinc-100`, `font-medium`, `tracking-tight`
- **Data/Metrics:** `font-mono`, `tabular-nums`
- **Labels:** `text-[11px]`, `tracking-widest`, `uppercase`, `font-mono`

### Spacing System

- Uses Tailwind's default spacing scale (4px base)
- Card padding: `p-6` (24px) or `p-8` (32px)
- Section gaps: `gap-16` (64px) between sections
- Grid gaps: `gap-6` (24px) or `gap-4` (16px)
- Border radius: `rounded-2xl` (16px) for cards, `rounded-xl` (12px) for inner elements
