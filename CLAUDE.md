# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project

TRACE Trekkers — a collective mileage-tracking app for the TRACE school community. Students and staff log miles via an open (no-login) form; admins manage submissions via a protected dashboard; cumulative progress displays on a live Mapbox map. Launch: April 1, 2026.

---

## Repo Structure

```
src/
  trekker-api/       # Rails 8 API-only backend
  trekker-frontend/  # React + TypeScript + Tailwind frontend (Vite)
docs/                # UX specs, brand guidelines, schema docs
previous_data/       # Historical CSV data for import
```

---

## Rails API (`src/trekker-api`)

### Commands

```bash
bin/rails server              # Start dev server (port 3000)
bin/rails test                # Run all tests
bin/rails test test/path/to/file_test.rb  # Run a single test file
bin/rails db:migrate          # Run migrations
bin/rails db:reset            # Drop, recreate, migrate, seed
bin/rubocop                   # Lint
bin/brakeman                  # Security audit
```

### Architecture

- **API-only mode** — no views, no sessions, no CSRF. All responses are JSON.
- **Auth:** Custom `has_secure_password` + Bearer tokens. Login returns a raw token; only its SHA-256 digest is stored in `admin_sessions`. Token sent as `Authorization: Bearer <token>` on every admin request.
- **`AdminAuthenticatable` concern** (`app/controllers/concerns/`) — include and call `authenticate_admin!` as a `before_action` on any controller requiring protection. Public controllers (`SubmissionsController`, `StatsController`) do NOT use it.
- **`MilestoneTriggerService`** — call after any write that changes cumulative miles. Returns newly-triggered `Milestone` records. Milestones are one-way: never un-triggered.
- **Step conversion:** 2,500 steps = 1 mile. Conversion happens server-side in the `Submission` model. `converted_miles` is always stored regardless of input type.
- **Tests:** Minitest. Files in `test/` mirroring the `app/` structure.

### Key models

| Model | Notes |
|---|---|
| `Submission` | `input_type`: `"miles"` or `"steps"`. `imported: true` for CSV-migrated records. `flagged` for admin attention. |
| `AdminUser` | `has_secure_password`. `active: false` blocks auth without deleting the account. |
| `AdminSession` | `token_digest` (SHA-256) + `expires_at`. `find_active_by_token` does the hash lookup in one joined query. |
| `Milestone` | `triggered` is permanent. `MilestoneTriggerService` bulk-updates newly-crossed markers. |

---

## React Frontend (`src/trekker-frontend`)

### Commands

```bash
npm run dev          # Start dev server (port 5173)
npm run build        # Type-check + build
npm test             # Run tests (single pass)
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint
```

### Architecture

- **Routing** (React Router v7) — defined in `App.tsx`:
  - `/` — `MapPage` (public, inside `Layout`)
  - `/log` — `LogPage` (public, inside `Layout`)
  - `/admin/login` — `AdminLoginPage` (no layout, intentionally isolated)
  - `/admin` — `AdminPage` (protected by `AdminRoute`, inside `Layout`)
- **`AdminRoute`** — client-side guard using `isAdminAuthenticated()`. Presence-checks localStorage only; the server rejects invalid/expired tokens on the first request.
- **Auth token** — stored in `localStorage` under `trekker_admin_token`. Always use the helpers in `src/lib/auth.ts` (`getAdminToken`, `setAdminToken`, `clearAdminToken`) — never access localStorage directly.
- **API calls** — all in `src/lib/api.ts` via a single `request()` wrapper. Pass `adminToken` for protected endpoints. Base URL from `VITE_API_BASE_URL` (defaults to `http://localhost:3000`).
- **Types** — shared API types in `src/lib/types.ts`.
- **Tests** — Vitest + React Testing Library. Test files co-located with source (`LogPage.test.tsx` next to `LogPage.tsx`).

### Environment variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Rails API base URL. Defaults to `http://localhost:3000` if unset. |

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/submissions` | None | Log miles or steps |
| GET | `/stats` | None | Total miles, current position, next milestone |
| POST | `/admin/sessions` | None | Login — returns Bearer token |
| DELETE | `/admin/sessions` | Bearer | Logout |
| GET | `/admin/submissions` | Bearer | Paginated submission list |
| PATCH | `/admin/submissions/:id` | Bearer | Edit submission |
| DELETE | `/admin/submissions/:id` | Bearer | Hard delete |
| POST | `/admin/submissions/:id/flag` | Bearer | Toggle flagged status |

---

## Map

- Mapbox GL JS. **Animated polyline on a 2D map for launch.** 3D globe is a Sprint 3 stretch goal only.
- Route: San Diego around the world and back. School-year goal: 20,286 miles (Earth's circumference at San Diego's latitude).
