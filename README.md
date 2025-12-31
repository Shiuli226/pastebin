Pastebin-Lite (Full Stack)

This repository contains a small Pastebin-like frontend and assumes a provided backend implementing the Pastebin-Lite API described in the assignment.

Frontend (this folder)
- Location: `frontend/`
- Minimal React + Vite app. Posts to `/paste/api/pastes` to create pastes and links to `/p/:id` to view them.

How to run locally
1. Start the backend server that implements the API and exposes endpoints at `http://localhost:8080` (the backend in the assignment uses Redis for persistence). Make sure Redis is running and configured for the backend.
2. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs on port 5173 and proxies `/paste` and `/api` to `http://localhost:8080` to reach the backend during development.

Persistence
- The backend (provided separately) uses Redis for persistence via Spring's `StringRedisTemplate`. Make sure Redis is available when running the backend.

Notes
- This repository focuses on the frontend UI required by the assignment. The backend implementation was provided by the user and is expected to be available separately for full end-to-end testing.
- The frontend intentionally uses relative paths so it works when deployed together with the backend under the same origin.

