# UI Assets

## Fonts

| Font | Source | Weights | Usage |
|---|---|---|---|
| Geist Sans | `@fontsource/geist-sans` | 400, 500, 600, 700 | All text — body, headings, UI labels |

Font files are bundled by Vite during build and served from `dist/assets/` as `.woff` and `.woff2`.

## Icons

All icons from **Lucide React** v1.23.0. Imported per-component.

### Key Icons Used

| Icon | Component |
|---|---|
| Brain, TrendingUp, Users, MapPin, BarChart3, UserCheck, Truck, Megaphone, Shield, CheckCircle2, Loader2, Clock, Activity, ArrowRight | AgentStatusPanel |
| Crosshair, MapPin, CheckCircle2, RefreshCw, AlertTriangle, ExternalLink, Loader2 | LocationPicker |
| MessageCircle, Send, X, Activity | ChatPanel |
| Sliders, X | WhatIfSimulator |
| ArrowRight, Play, Brain, Database, BarChart3, MapPin, Cloud, LayoutTemplate, Activity, Target, Zap, Server, Shield, Network, Eye, Key | LandingPage |
| ArrowLeft, ArrowRight, ChevronRight, Store, MapPin, Wallet, FileText, AlertCircle, Activity | AnalysisPage |
| ArrowLeft, Download, RefreshCw, CheckCircle2, XCircle, AlertTriangle, TrendingUp, TrendingDown, Minus, MapPin, Users, Shield, BarChart3, Truck, Megaphone, UserCheck, Brain, Star, AlertCircle, Sparkles, Target, Lightbulb, Flag, Compass, Gauge, ExternalLink, Loader2 | ResultsPage |
| ArrowLeft, BarChart3, TrendingUp, Users, CheckCircle, Activity, Globe, Zap | AnalyticsPage |
| Sparkles, ArrowRight, Bot, User | ConsultantPage |
| ArrowRight, ArrowLeft | ProductTour |

### Static SVG Icons (in `public/`)

| File | Purpose |
|---|---|
| `favicon.svg` | Browser tab icon |
| `icons.svg` | General icon sprite |

## Illustrations

| File | Location | Usage |
|---|---|---|
| `hero-illustration.jpeg` | `public/` | Landing page hero image (640px auto-width) |
| `hero-illustration.png` | `public/` | Fallback (larger, 541KB) |

The hero image is wrapped in a CSS edge-fading mask (`mask-image` with `maskComposite: intersect`) so it blends into the dark navy background. An ambient color blob gradient behind it matches the photo's dominant color (`#090e1f`).

## Images (Build-time assets in `src/assets/`)

| File | Usage |
|---|---|
| `hero.png` | Unused (kept for reference) |
| `react.svg` | Unused (Vite default) |
| `vite.svg` | Unused (Vite default) |

## Color Palette

| Role | HEX | Tailwind |
|---|---|---|
| Background | `#050505` | `bg-background` |
| Surface | `#0A0A0A` | `bg-surface` |
| Surface hover | `#111111` | `bg-surfaceHover` |
| Border | `rgba(255,255,255,0.06)` | `border-white/5` |
| Primary text | `#ededed` | `text-zinc-100` |
| Secondary text | `#71717a` | `text-zinc-500` |
| Muted text | `#52525b` | `text-zinc-600` |
| Accent blue | `#3B82F6` | `text/accent-blue` |
| Success | `#10b981` | `text-emerald-400` |
| Error | `#ef4444` | `text-red-400` |
| Warning | `#3B82F6` | `text-blue-400` |

## Glass Effects

| Class | Background | Blur | Border | Usage |
|---|---|---|---|---|
| `.glass` | `rgba(10,10,10,0.4)` | 24px | `1px solid rgba(255,255,255,0.06)` | Panels |
| `.surface-elevated` | `rgba(255,255,255,0.02)` | 20px | `1px solid rgba(255,255,255,0.06)` | Tooltips |
| `.surface-card` | `rgba(255,255,255,0.015)` | — | `1px solid rgba(255,255,255,0.05)` | Cards |

## Shadow System

- Card: `shadow-xl shadow-black/20`, hover: `shadow-2xl shadow-blue-900/10`
- Buttons: `shadow-xl shadow-black/50`
- Glow: `shadow-[0_0_40px_rgba(59,130,246,0.15)]`
- Navbar (scrolled): `shadow-2xl shadow-black/40`

## Animation Timings

| Animation | Duration | Easing |
|---|---|---|
| Page enter | 1.5s | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Scroll reveal | 1s | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Text stagger | 0.8s per word | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Score count | 0.9s | `ease-out-cubic` |
| Card hover | 0.5s | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Navbar hide | 0.35s | `easeInOut` |
| Agent step | 1.8s delay | — |

## Border Radius Scale

| Class | Value | Usage |
|---|---|---|
| `rounded-lg` | 8px | Small elements |
| `rounded-xl` | 12px | Inputs, buttons, inner cards |
| `rounded-2xl` | 16px | Cards, panels |
| `rounded-3xl` | 24px | Agent panel, large containers |
| `rounded-full` | 9999px | Navbar, FAB buttons |

## Spacing Scale

| Class | Value | Usage |
|---|---|---|
| `gap-3` | 12px | Tight element spacing |
| `gap-4` | 16px | Standard element spacing |
| `gap-6` | 24px | Section inner spacing |
| `gap-8` | 32px | Wide element spacing |
| `gap-16` | 64px | Section separation |
| `gap-40` | 160px | Results page section gap |
| `p-4` | 16px | Small padding |
| `p-6` | 24px | Standard card padding |
| `p-8` | 32px | Large card padding |
| `px-8` | 32px | Page horizontal padding |
