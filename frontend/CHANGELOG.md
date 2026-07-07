# Changelog — LaunchWise Frontend UI v1.0

## v1.0 (2026-07-07)

### Landing Page
- Cinematic hero with animated text reveal (staggered word-by-word blur + translate)
- Live business simulation cards (3 demo scenarios with health score, risk, ROI)
- Asymmetrical agent architecture showcase with 10 specialized AI agents
- Intelligent workflow pipeline visualization (5-step process)
- Google Cloud technology stack section
- Ambient intelligence grid background with parallax scroll effect

### Analysis Page
- Multi-step form wizard with animated transitions (4 steps: business type, location, budget, description)
- Google Maps LocationPicker with PlaceAutocompleteElement (Places API New)
- Current-location detection (Uber-style FAB button)
- Reverse geocoding on map click / marker drag
- Budget formatting with INR localization (K, L, Cr)
- AgentStatusPanel with 10 sequential AI agents (1.8s delay each)
- Real-time elapsed timer during analysis
- Configuration state summary (previous answers shown during form)

### Results Page
- Full executive report with animated score ring (count-up animation)
- 8 seamless tab sections: Overview, AI Insights, Market, Competitors, Finance, Location, Personas, Risk
- SectionHeader component with DeepMind-style transition dividers and floating constellation nodes
- ExecutiveBrief with expandable opportunities/risks/outlook
- ScoreBreakdownCard with weighted factor visualization
- Interactive financial charts (AreaChart + BarChart via Recharts)
- Monthly financial breakdown table with INR formatting
- LocationMap with Google Maps dark theme (graceful fallback to coordinates + Maps link)
- SWOT analysis matrix
- Customer persona cards with demographics, needs, pain points
- Risk assessment with mitigation strategies
- Supply chain and marketing campaign sections
- Report export (JSON download)
- Floating internal navigation sidebar ("Report Index")

### Analytics Page
- KPI cards (total scans, avg health score, avg ROI, risk index)
- Verdict distribution pie chart (monochromatic palette)
- Business type bar chart
- Regional performance table
- Cinematic loading state with animated status

### Consultant Page
- AI chat interface with bot/user message styling
- Suggested prompt buttons
- Mock response with 1s delay for demo

### Navbar
- Floating glass navbar centered at top
- Auto-hide on scroll down, reappear on scroll up
- Active link highlight with framer-motion `layoutId` spring animation
- Semi-transparent background on scroll (backdrop-blur)

### Animations
- Staggered word reveal with blur-to-clear transitions
- Page transitions via AnimatePresence with route-based keys
- Scroll-triggered fade-in-up with sectionFadeUp variants
- Floating hero illustration with 6s y-axis oscillation
- Floating confidence score and growth badges
- Pulsing particle nodes
- Animated score count-up (ease-out-cubic)
- ScoreRing SVG circle animation (stroke-dashoffset)
- Hover scale effects on cards and buttons
- Loading shimmer and breathe animations
- Staggered agent entry in AgentStatusPanel

### Design System
- Glassmorphism system (glass, surface-elevated, surface-card CSS classes)
- Custom color tokens (background #050505, surface #0A0A0A, zinc-based UI palette)
- Tailwind configuration with custom colors, animations, keyframes
- Custom scrollbar styling
- Custom range slider styling
- Ambient noise overlay (SVG fractal noise at 3% opacity)
- Dark selection styling
- Google Places autocomplete theming
- Transition timing function: cubic-bezier(0.16, 1, 0.3, 1)

### Typography
- Geist Sans font family (@fontsource/geist-sans: 400, 500, 600, 700 weights)
- Monospace usage for data, metrics, and code elements
- Font-light for body copy, font-medium for headings
- Tracking (letter-spacing) for uppercase labels

### Illustrations & Assets
- Hero illustration (JPEG) with CSS edge-fading mask (mask-image)
- Ambient color blob gradients matched to photo's dark navy
- Floating overlay badges (confidence score, growth indicator)
- SVG favicon and icons

### Routing
- 5 routes with catch-all redirect to home
- BrowserRouter with location-keyed AnimatePresence transitions

### Product Tour
- 13-step onboarding tour with spotlight SVG mask
- Automatic navigation between pages for tour steps
- localStorage support for "Never Show Again"
- FORCE_TOUR mode for development
- Animated spotlight + glow ring around highlighted elements
- Demo report injection for tour steps requiring /results

### What-If Simulator
- Floating panel with sliders for budget, competition density, marketing spend, rent override
- POST to /api/simulate
- Animated open/close with framer-motion

### Chat Panel
- Floating chat bubble (bottom-left)
- Message history with smooth scrolling
- POST to /api/chat with sessionId
- Loading state with animated indicator

### Maps Integration
- Google Maps JavaScript API with dark theme styling
- PlaceAutocompleteElement (Places API New) for search
- Legacy Geocoder for reverse geocoding
- 3-state handling: no-key (text fallback), error (retry button), ready (full map)
- Shared DARK_MAP_STYLE between LocationPicker and LocationMap
