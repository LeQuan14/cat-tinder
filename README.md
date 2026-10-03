# 🐾 Cat Tinder

A playful, swipe-style matchmaking app for cats. Drag through a deck of feline profiles, purr at the ones you like, and manage the lineup in a built-in profile studio.

Built with React + TypeScript on the front end and a small Express + SQLite API on the back end. Everything runs from one Node process.

## Features

**Discover**
- Drag-to-swipe card stack with live **Purr** / **Nope** stamps and fly-out animations
- Round Pass / Purr / Reshuffle buttons, plus keyboard shortcuts (<kbd>←</kbd> / <kbd>→</kbd>)
- Animated match celebration with confetti
- Sidebar with totals, a strip of matched cats, and a recent-activity feed

**Profile studio** (`/profile`)
- Searchable library of every cat in the deck
- Form grouped into Basics, Personality, and Portrait
- Trait chips: press <kbd>Enter</kbd> or <kbd>,</kbd> to add, <kbd>×</kbd> to remove
- One-click portrait presets, or custom CSS gradients under "Custom CSS values"
- Live card preview that updates as you type
- Two-step delete confirmation and toast feedback on save

**General**
- Light and dark themes: follows your OS by default, toggle in the top bar (remembered per browser)
- Responsive layout for phones through wide desktops
- Respects `prefers-reduced-motion`

## Getting started

**Requirements:** Node.js 18 or newer. `better-sqlite3` is a native module; prebuilt binaries cover most platforms, otherwise it needs a C/C++ toolchain to compile.

```bash
npm install
npm run dev
```

Open http://localhost:4173. The SQLite database is created at `data/cats.db` on first run and seeded with four cats.

## Scripts

| Command           | What it does                                                    |
| ----------------- | --------------------------------------------------------------- |
| `npm run dev`     | Starts the Express API with Vite middleware (hot reload)        |
| `npm run build`   | Builds the front end into `dist/`                               |
| `npm run start`   | Serves `dist/` and the API in production mode                   |
| `npm run preview` | Same as `start`; run `npm run build` first                      |

### Configuration

| Variable   | Default | Purpose                                              |
| ---------- | ------- | ---------------------------------------------------- |
| `PORT`     | `4173`  | Port the server listens on                           |
| `NODE_ENV` | —       | Set to `production` to serve the built `dist/` files |

### Resetting data

Stop the server and delete `data/cats.db*`. The next start recreates the database with the seed profiles. The `data/` directory is git-ignored.

## API

All endpoints are JSON.

| Method   | Path                | Description                                                        |
| -------- | ------------------- | ------------------------------------------------------------------ |
| `GET`    | `/api/profiles`     | List all profiles                                                  |
| `POST`   | `/api/profiles`     | Create a profile                                                   |
| `PUT`    | `/api/profiles/:id` | Update a profile                                                   |
| `DELETE` | `/api/profiles/:id` | Delete a profile (`204` on success)                                |
| `GET`    | `/api/history`      | Last 20 swipes and matches, plus `totals: { swipes, matches }`     |
| `POST`   | `/api/swipes`       | Record a swipe: `{ "profileId": 1, "direction": "left" \| "right" }` |

A right swipe also records a match. Profile payloads need non-empty `name`, `age`, `breed`, `distance`, `vibe`, `bio`, `accent`, `image` (a CSS background value), and at least one trait. `traits` can be an array or a comma-separated string.

## Project structure

```
├── server.js                 Express server, SQLite schema/seed, API routes
├── index.html                App shell (fonts, theme bootstrap)
└── src/
    ├── main.tsx              React entry point
    ├── App.tsx               App state, data loading, Discover page
    ├── ProfileEditorPage.tsx Profile studio
    ├── types.ts              Shared types
    ├── styles.css            Design tokens, themes, and all styles
    └── components/
        ├── SwipeDeck.tsx     Draggable card stack and actions
        ├── CatCard.tsx       Profile card (deck and preview)
        ├── MatchModal.tsx    Match celebration dialog
        ├── TopBar.tsx        Navigation and theme toggle
        ├── Toast.tsx         Transient notifications
        └── Icons.tsx         Inline SVG icons
```
