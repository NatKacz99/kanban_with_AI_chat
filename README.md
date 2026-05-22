# Kanban Studio

A minimal project management app with a Kanban board and an AI assistant sidebar. MVP scope: one board per user, five columns, drag-and-drop cards, and an LLM chat that can modify the board.

A partial Vercel deployment is available at [kanban-with-chatbot.vercel.app](https://kanban-with-chatbot.vercel.app/) — note that registration currently returns HTTP 500 there (see [Known issues](#known-issues)). For a working setup, use the Docker instructions below.

## Stack

- Frontend: Next.js 16 (App Router, static export), React 19, Tailwind v4, @dnd-kit
- Backend (local): Python 3.12, FastAPI, SQLite, uv as the package manager
- Backend (Vercel): TypeScript serverless functions in `frontend/api/`, Postgres (`pg`)
- AI: OpenRouter, model `openai/gpt-oss-120b:free`, Structured Outputs (JSON Schema)
- Auth: bcrypt + JWT (HS256)
- Tests: Vitest (unit), Playwright (E2E)

## Local setup (Docker)

Requires Docker and a `.env` file in the project root:

```
OPENROUTER_API_KEY=...
JWT_SECRET=any-secret
```

Start and stop:

```bash
./scripts/start.sh     # Mac/Linux
./scripts/stop.sh

scripts/start.ps1      # Windows
scripts/stop.ps1
```

App runs at `http://localhost:8000`. Frontend and API are served from the same FastAPI container. The SQLite database (`app.db`) is created automatically on startup.

## Frontend dev mode

```bash
cd frontend
npm install
npm run dev
```

## Tests

```bash
cd frontend
npm run test:unit
npm run test:e2e
```

E2E tests expect a running backend at `http://127.0.0.1:8000` (see `playwright.config.ts`).

## Structure

```
backend/         # FastAPI + SQLite (Docker deployment)
frontend/        # Next.js (UI + serverless API for Vercel)
frontend/api/    # TypeScript serverless handlers (Vercel + Postgres)
docs/            # Project plan, data model, schema.json
scripts/         # Docker start/stop scripts
```

The project contains two parallel backend implementations:
- `backend/` — Python on SQLite, used in the Docker container
- `frontend/api/` — TypeScript on Postgres, used for the Vercel deployment

Both expose the same API surface (`/api/auth/*`, `/api/board`, `/api/columns`, `/api/cards`, `/api/ai/chat`).

## AI configuration

The backend calls OpenRouter (`openai/gpt-oss-120b:free`) with Structured Outputs that match the schema in `backend/ai_schema.py` / `frontend/api/_lib/ai_schema.ts`. Responses contain a reply for the user and optionally a new board state, which the frontend persists via `POST /api/board/replace`.

## Auth

- Registration creates a user, their board, and five default columns (`Backlog`, `Discovery`, `In Progress`, `Review`, `Done`)
- Passwords are hashed with bcrypt; JWT tokens are valid for 24h
- All endpoints except `/api/auth/*` and `/api/health` require `Authorization: Bearer <token>`
- Minimum password length: 8 characters

## Known issues

**Vercel deployment — HTTP 500 on registration.** The production deployment at [kanban-with-chatbot.vercel.app](https://kanban-with-chatbot.vercel.app/) returns 500 when registering a user. The Docker (SQLite) deployment works correctly; the issue is specific to the serverless backend in `frontend/api/`. Until this is resolved, the Docker deployment is the recommended way to run the app.

## Out of scope (MVP)

Roles and permissions, multiple boards per user, auditing, enterprise features.

## Photos
<img width="536" height="401" alt="photo_1" src="https://github.com/user-attachments/assets/1fc8f5c5-c972-4f71-b3a4-3456e1f8731f" />
<img width="1901" height="999" alt="photo_2" src="https://github.com/user-attachments/assets/37bc12b5-5851-49a8-9bf6-db91a3c12836" />
<img width="1768" height="1003" alt="photo_3" src="https://github.com/user-attachments/assets/11ba72c1-76dc-4df1-8ebe-760ac53da578" />


