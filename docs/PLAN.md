# High level steps for project

Part 1: Plan

Goal: produce an approved, detailed execution plan and a full architecture breakdown of the existing frontend.

Checklist:
- [x] Read project requirements in `AGENTS.md` (root) and confirm constraints.
- [x] Review the current frontend codebase and write a full architecture breakdown in `frontend/AGENTS.md`.
- [x] Expand this plan with detailed steps for Parts 2-10, each with substeps, tests, and success criteria.
- [x] Present the enriched plan to the user and obtain explicit approval before continuing.

Tests:
- No automated tests required for Part 1.

Success criteria:
- `frontend/AGENTS.md` exists and captures the frontend architecture in detail.
- `docs/PLAN.md` includes detailed checklists, tests, and success criteria for Parts 2-10.
- User explicitly approves the plan.

Part 2: Scaffolding

Goal: bootstrap Docker + FastAPI + scripts and prove the container runs locally.

Checklist:
- [x] Create Dockerfile and docker-compose.yml for a single-container setup.
- [x] Add `.dockerignore` to exclude build artifacts.
- [x] Create `backend/main.py` with a minimal FastAPI app and a health endpoint.
- [x] Add `backend/requirements.txt` with `fastapi` and `uvicorn`.
- [x] Add start/stop scripts in `scripts/` for Mac/Linux and Windows.
- [x] Run locally: `/` serves static HTML; `/api/health` returns JSON.

Tests:
- Manual HTTP checks for `/` and `/api/health`.

Success criteria:
- Container builds and runs.
- `/` returns HTML.
- `/api/health` returns JSON.

Part 3: Add in Frontend

Goal: statically build the Next.js frontend and serve it via FastAPI at `/`.

Checklist:
- [x] Configure Next.js for static export (`output: "export"`).
- [x] Build frontend to `frontend/out`.
- [x] Serve static files from FastAPI using `StaticFiles`.
- [x] Update Dockerfile to build frontend and copy `frontend/out` into the backend image.
- [x] Ensure `/` shows the Kanban UI, not a placeholder HTML page.

Tests:
- Unit tests (Vitest) for existing components.
- Integration/E2E tests (Playwright) for basic board rendering.

Success criteria:
- `/` renders Kanban UI from static build.
- Unit and E2E tests pass.

Part 4: Add in a fake user sign in experience

Goal: add frontend-only login with dummy credentials.

Checklist:
- [x] Add login form with username/password on first visit.
- [x] Accept only `user` / `password` to authenticate.
- [x] Add logout button to return to login screen.
- [x] Add basic styling to login view (globals.css).
- [x] Add unit tests for login form and logout flow.
- [x] Update Playwright tests to login before interacting with the board.

Tests:
- Vitest: invalid credentials show error; valid credentials proceed.
- Playwright: login flow and basic board interactions.

Success criteria:
- Login is required to view Kanban.
- Logout returns to login screen.
- Tests pass.

Part 5: Database modeling

Goal: define the Kanban data model and document it.

Checklist:
- [x] Document database approach in `docs/DATABASE.md`.
- [ ] Create JSON schema document (user-provided) describing tables and relationships.
- [ ] Get user sign off on schema.

Tests:
- No automated tests.

Success criteria:
- Schema JSON exists and is approved.
- Documentation reflects MVP schema and SQLite usage.

Part 6: Backend

Goal: implement backend CRUD API and DB initialization.

Checklist:
- [x] Add SQLite init on startup (create tables if missing).
- [x] Implement `/api/board` returning full board state.
- [x] Implement CRUD for columns and cards.
- [x] Implement card move endpoint with position updates.
- [ ] Add backend unit tests.

Tests:
- Backend unit tests (to be added) for API routes and DB logic.

Success criteria:
- API can read/update board data.
- DB is created automatically if missing.

Part 7: Frontend + Backend

Goal: connect UI to backend API and ensure persistence.

Checklist:
- [x] Create frontend API wrapper (`frontend/src/lib/api.ts`).
- [x] Replace local mock state in `KanbanBoard` with API calls.
- [x] Add loading/error UI states.
- [x] Update unit tests to mock API.
- [x] Update Playwright tests to login and interact with API-backed UI.
- [x] Add multi-user auth support (register/login endpoints, JWT, per-user board).
- [x] Add registration UI and client-side validation.

Tests:
- Vitest unit tests for board interactions (mocked API).
- Playwright E2E tests against running app.

Success criteria:
- UI reads from and writes to backend.
- Tests pass.

Part 8: AI connectivity

Now allow the backend to make an AI call via OpenRouter. Test connectivity with a simple "2+2" test and ensure the AI call is working.

Notes (Part 8 decisions):
- Add a new backend endpoint: `/api/ai/test`.
- Use direct HTTPS calls with `requests` (no SDK).
- No mocking: the test must reach OpenRouter and return a real model response.
- Model: `openai/gpt-oss-120b:free`, API key in root `.env` as `OPENROUTER_API_KEY`.
- Implement OpenRouter client logic in `backend/ai.py`.

Part 9: Now extend the backend call so that it always calls the AI with the JSON of the Kanban board, plus the user's question (and conversation history). The AI should respond with Structured Outputs that includes the response to the user and optionaly an update to the Kanban. Test thoroughly.

Part 10: Now add a beautiful sidebar widget to the UI supporting full AI chat, and allowing the LLM (as it determines) to update the Kanban based on its Structured Outputs. If the AI updates the Kanban, then the UI should refresh automatically.

Design decisions (applied):
- Single container serves static frontend and API from FastAPI.
- Next.js uses static export (`output: "export"`) with build output in `frontend/out`.
- Dummy login is frontend-only (`user`/`password`), with logout support.
- Frontend uses a small API wrapper module for all fetches.
- Playwright tests login before board interactions.