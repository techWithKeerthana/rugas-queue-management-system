# Queue Management System - Full Handoff Context (For New Chat)

This document is a complete project handoff so a new AI assistant can continue work without asking for historical context.

## 1) Project Summary

- Project: Full-stack Queue Management System (internship assignment)
- Repo root: `D:\Rugas`
- Stack:
  - Frontend: React + Vite + Tailwind + Recharts + dnd-kit + socket.io-client
  - Backend: Node.js + Express + Mongoose + JWT + bcrypt + Socket.io
  - DB: MongoDB Atlas (currently using non-SRV URI due DNS SRV issue on this machine)
  - Testing: Jest + Supertest + mongodb-memory-server-core
- Branch: `master`

## 2) What Is Implemented

### Tier 1 (Complete and tested)
- JWT auth: register/login/logout/me
- Queue CRUD (manager-scoped unique names)
- Token CRUD/state flow: waiting, serving, completed, cancelled
- Priority insertion (emergency > vip > senior > normal)
- Drag-and-drop reorder with persisted positions
- Serve top, cancel, complete, undo
- Estimated wait time + live serving timer
- Real-time updates with Socket.io events
- Analytics dashboard:
  - KPI cards
  - avg wait/service
  - longest waiting token
  - queue trend chart
  - status distribution chart
  - hourly traffic chart
- Seed script and README setup docs

### Tier 2 (Complete and tested)
- Token search by token number / token id / person name
- Token pagination
- Duplicate active-token detection on add
- Queue capacity limits and enforcement
- Daily/weekly/monthly analytics report endpoints
- CSV/PDF export endpoints
- Dark/Light mode toggle
- Profile dropdown (manager info + logout)

### Tier 3 (Complete and tested)
- AI Queue Insights using Gemini
  - Backend endpoint generates insights from queue analytics context
  - Caching per queue+manager
  - Re-generate on `refresh=true` or after cache expires (1 hour)
  - Graceful fallback when API fails/times out/rate-limits:
    - return friendly unavailable message
    - serve stale cache if available
- Queue history archive (soft close)
  - Archive/unarchive queues
  - Active/archived/all queue filtering
  - Archived queues cannot be modified
- Activity Logs
  - Logs manager actions (queue/token operations)
  - Activity logs API with pagination
  - Frontend Activity page

## 3) Current Key Files and Responsibilities

### Backend Core
- `backend/src/app.js`: app wiring + protected routes
- `backend/src/server.js`: server bootstrap + Socket.io + env validation
- `backend/src/config/env.js`: required env vars validation
- `backend/src/config/db.js`: mongoose connect/disconnect

### Backend Models
- `backend/src/models/User.js`
- `backend/src/models/Queue.js` (capacity, archive fields)
- `backend/src/models/Token.js`
- `backend/src/models/AIInsightCache.js`
- `backend/src/models/ActivityLog.js`

### Backend Controllers
- `backend/src/controllers/authController.js`
- `backend/src/controllers/queueController.js`
  - create/list/get/delete + archive/unarchive
- `backend/src/controllers/tokenController.js`
  - list/add/reorder/serve/complete/cancel/undo
  - duplicate detection, capacity checks, search/pagination
  - archive mutability guard
  - activity logging
- `backend/src/controllers/analyticsController.js`
  - KPI endpoints
  - report endpoints (daily/weekly/monthly)
  - CSV/PDF export
  - AI insights endpoint (cache + refresh + graceful fallback)
- `backend/src/controllers/activityLogController.js`
  - paginated logs listing

### Backend Services
- `backend/src/services/aiInsightsService.js`
  - Gemini SDK integration (`@google/generative-ai`)
  - prompt formatting + text extraction
- `backend/src/services/activityLogService.js`
  - reusable activity logger

### Backend Routes
- `backend/src/routes/authRoutes.js`
- `backend/src/routes/queueRoutes.js`
- `backend/src/routes/tokenRoutes.js`
- `backend/src/routes/analyticsRoutes.js`
- `backend/src/routes/activityLogRoutes.js`

### Frontend Pages
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/pages/RegisterPage.jsx`
- `frontend/src/pages/QueuesPage.jsx`
  - active/archived/all filters
  - create queue with optional capacity
  - archive/unarchive
- `frontend/src/pages/QueueDetailPage.jsx`
  - token add/serve/cancel/undo/complete
  - search + pagination
  - DnD reorder (disabled when filtered/paginated)
- `frontend/src/pages/AnalyticsPage.jsx`
  - Tier 1 charts/KPIs
  - Tier 2 report period + export buttons
  - Tier 3 AI insights panel + refresh button + graceful message states
- `frontend/src/pages/ActivityLogsPage.jsx`

### Frontend API Clients
- `frontend/src/api/client.js`
- `frontend/src/api/authApi.js`
- `frontend/src/api/queueApi.js`
- `frontend/src/api/tokenApi.js`
- `frontend/src/api/analyticsApi.js`
- `frontend/src/api/activityLogApi.js`

### Frontend Context and Layout
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/context/ThemeContext.jsx`
- `frontend/src/components/layout/AppShell.jsx`

## 4) Environment Setup

### backend/.env.example currently includes
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `FRONTEND_ORIGIN`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `INSIGHTS_TIMEOUT_MS`

### Important runtime notes
- `backend/src/config/env.js` requires at least:
  - `MONGO_URI`
  - `JWT_SECRET`
- Gemini insights require:
  - `GEMINI_API_KEY`
- This machine/network had SRV DNS issues (`querySrv ECONNREFUSED`) with `mongodb+srv://`.
  - Working solution used: non-SRV Atlas URI in `backend/.env`
  - Root cause determined to be environment DNS resolver path, not app code.

## 5) Commands

From repo root (`D:\Rugas`):

Install:
- `npm install`
- `cd backend && npm install`
- `cd ../frontend && npm install`

Run both apps:
- `npm run dev`

Run backend only:
- `npm run dev --prefix backend`

Run frontend only:
- `npm run dev --prefix frontend`

Seed data:
- `cd backend`
- `npm run seed`

Tests:
- `cd backend`
- `npm test`

Build frontend:
- `cd frontend`
- `npm run build`

## 6) API Surface (current)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Queues
- `POST /api/queues`
- `GET /api/queues?status=active|archived|all`
- `GET /api/queues/:queueId`
- `PATCH /api/queues/:queueId/archive`
- `PATCH /api/queues/:queueId/unarchive`
- `DELETE /api/queues/:queueId`

### Tokens
- `GET /api/queues/:queueId/tokens?search=&page=&pageSize=`
- `POST /api/queues/:queueId/tokens`
- `PATCH /api/queues/:queueId/tokens/reorder`
- `PATCH /api/queues/:queueId/tokens/serve-top`
- `PATCH /api/queues/:queueId/tokens/:tokenId/complete`
- `PATCH /api/queues/:queueId/tokens/:tokenId/cancel`
- `PATCH /api/queues/:queueId/tokens/:tokenId/undo`

### Analytics
- `GET /api/queues/:queueId/analytics/summary`
- `GET /api/queues/:queueId/analytics/trend`
- `GET /api/queues/:queueId/analytics/status-distribution`
- `GET /api/queues/:queueId/analytics/hourly-traffic`
- `GET /api/queues/:queueId/analytics/reports?period=daily|weekly|monthly&from=&to=`
- `GET /api/queues/:queueId/analytics/reports/export.csv?period=...`
- `GET /api/queues/:queueId/analytics/reports/export.pdf?period=...`
- `GET /api/queues/:queueId/analytics/insights?refresh=true|false`

### Activity Logs
- `GET /api/activity-logs?page=&pageSize=`

## 7) Real-time Events

Emitted server-side and consumed by frontend:
- `token:added`
- `token:reordered`
- `token:served`
- `token:cancelled`
- `token:statusChanged`
- `token:undone`

## 8) Tests Status

- Backend tests are passing.
- Test file: `backend/tests/api.test.js`
- Includes coverage for:
  - priority ordering
  - serve/cancel/undo transitions
  - reorder persistence
  - realtime emission
  - duplicate detection
  - capacity blocking
  - search/pagination
  - report/export behavior
  - archived queue mutability blocking
  - activity logs listing
  - AI insights failure fallback
  - AI insights slow-call timeout fallback

## 9) Recent Commit History (key milestones)

- `4fee578` feat(frontend): add Tier 3 AI insights panel, archive queue views, and activity logs page
- `584338b` feat(backend): add Tier 3 Gemini insights cache, queue archive, and activity logs
- `e3cd944` feat(frontend): implement Tier 2 queue search/pagination, reports export, theme toggle, and profile menu
- `17bec10` feat(backend): add Tier 2 token search/pagination, duplicate/capacity checks, and report exports
- `548acd1` chore: update lockfile from dependency metadata during Tier 1 fixes
- `d239882` docs: add setup guide, env templates, and seed instructions
- `60c276d` feat(frontend): build tier1 queue UI with auth, dnd tokens, analytics, and realtime sync
- `6c5c1a8` feat(backend): implement tier1 API, socket events, and business-logic tests
- `ce70ec4` chore: scaffold monorepo with frontend and backend dependencies

## 10) Known Caveats / Notes for Next Assistant

1. Mongo Atlas SRV DNS issue on this machine
- `mongodb+srv://` failed with `querySrv ECONNREFUSED`
- Non-SRV URI worked reliably and is used locally

2. Reporting design choice
- Daily/weekly/monthly reports are intentionally computed on-demand from `Token` collection data
- No separate pre-aggregated analytics collection is used in the current design

3. DnD reorder is intentionally disabled in filtered/paginated token views
- Prevents partial-list reorder corruption

4. Security note
- Rotate Gemini key if exposed in logs/chats/history.

## 11) Current Goal State

- Tier 1, Tier 2, Tier 3 implemented and tested.
- User requested this handoff to continue conversation in a new Claude chat without re-explaining context.

If you are the next assistant: start by reading this file, then run tests and build once, and proceed only with user-requested follow-ups.
