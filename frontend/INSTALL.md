# Installation Guide

## Prerequisites

- **Node.js** >= 20.x
- **npm** >= 10.x

## Steps

### 1. Extract into the repository

Copy the contents of this package into a fresh clone of the LaunchWise repository. The `frontend/` directory should be at the project root alongside `backend/`.

```
launchwise-repo/
├── frontend/        ← Paste files here
├── backend/
├── docker-compose.yml
└── ...
```

### 2. Install dependencies

```bash
cd frontend
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your Google Maps API key:

```
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

> **Note:** The Google Maps API key is optional. Without it, the LocationPicker falls back to a text input, and the LocationMap shows a static coordinates fallback with an "Open in Google Maps" link.

### 4. Start development server

```bash
npm run dev
```

Opens at `http://localhost:5173`. The Vite dev server proxies `/api/*` requests to `http://localhost:8000` (the FastAPI backend).

### 5. Production build

```bash
npm run build
```

Output goes to `frontend/dist/`.

### 6. Preview production build

```bash
npm run preview
```

## Verifying It Works

1. Run `npm run dev` — the dev server should start without errors
2. Open `http://localhost:5173` — you should see the LaunchWise landing page
3. Click on a demo scenario card — it should navigate to the results page
4. Run `npm run build` — it should produce a `dist/` folder with no errors
5. Run `npm run lint` (optional) — should pass without errors

## Gotchas

- **Google Maps API key required for full maps:** Without it, the map section shows a fallback input + link
- **Backend required for live analysis:** The frontend works with demo scenarios without a backend
- **`/api/*` proxy:** The Vite config proxies `/api/*` to `localhost:8000` — adjust if your backend runs on a different port
- **React StrictMode:** Double-invokes effects in dev — the code handles this (LocationPicker cleans up PlaceAutocompleteElement on unmount)
