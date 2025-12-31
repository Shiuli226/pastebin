Pastebin Lite (Frontend)

This folder contains a minimal React frontend for the Pastebin‑Lite assignment. It provides a simple UI to create pastes (with optional TTL and max views) and open the produced URL.

Quick start (frontend only)

Requirements:
- Node.js 18+ and npm
- The backend from this repository running locally on http://localhost:8081 (it uses Redis for persistence)

Install and run in development mode:

```bash
npm install
npm run dev
```

This starts a Vite dev server (default port 5173). The Vite dev server proxies requests to `/paste` and `/api` to `http://localhost:8081` so the frontend can talk to the provided backend during local development.

Build for production:

```bash
npm run build
npm run preview
```

Notes
- Persistence: the backend uses Redis via Spring's StringRedisTemplate (see backend code). Make sure Redis is available when running the backend.
- The frontend posts to `/paste/api/pastes` to match the backend controller mapping in this project.
- The UI is intentionally minimal; functionality is the priority.

