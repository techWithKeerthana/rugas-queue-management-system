# Queue Management System - Clean Handoff (Current Source of Truth)

This document is intended for a brand-new AI assistant with zero prior context.
It captures the current project state, architecture, APIs, test coverage, deployment, caveats, and immediate next steps.

## 1) Project Summary

- Project: full-stack Queue Management System
- Repository root: D:\Rugas
- Current branch: master
- Deployment targets:
  - Backend: Render (Node + Express + Socket.io + MongoDB Atlas)
  - Frontend: Vercel (React + Vite + Tailwind)
- Core goal: manager queue operations with real-time updates, plus public no-login queue join/tracking

## 2) Architecture Overview

### Backend
- Runtime: Node.js + Express
- Database: MongoDB Atlas via Mongoose
- Auth: JWT bearer tokens
- Realtime: Socket.io
  - Manager sockets join queue rooms: queue:<queueId>
  - Public tracking sockets use restricted mode and join: public:queue:<queueId>
  - Public sockets receive invalidation signals only (no sensitive payload broadcast)
- Security/middleware:
  - helmet, CORS allowlist, auth middleware, validation middleware
  - rate limits on public endpoints

### Frontend
- Framework: React + Vite
- Styling: Tailwind CSS
- Routing: react-router-dom
- Realtime client: socket.io-client
- Manager area protected by auth
- Public routes for join and tracking do not require login

### Integrations
- Gemini AI insights for analytics summaries (cached + timeout/fallback)

## 3) Feature Status

### Tier 1 (Complete)
- JWT auth: register, login, logout, me
- Queue management CRUD (manager scoped)
- Token lifecycle: waiting, serving, completed, cancelled
- Priority insertion: emergency > vip > senior > normal
- Reorder waiting tokens with drag-and-drop
- Serve-top, complete, cancel, undo
- Estimated wait time calculations
- Realtime updates via Socket.io
- Analytics dashboard core metrics/charts

### Tier 2 (Complete)
- Token search (name, token number, token id)
- Token pagination
- Duplicate active-token name protection
- Queue capacity enforcement
- Daily/weekly/monthly analytics reports
- CSV/PDF export endpoints
- Theme toggle (dark/light)
- Profile menu/logout UX

### Tier 3 (Complete)
- AI insights endpoint backed by Gemini
- Insight caching and refresh behavior
- Timeout/failure graceful fallback
- Queue archive/unarchive + filtered listing
- Archived queue mutability protection
- Activity logs endpoint + UI page

### Public Customer Features (Complete)
- Public tracking page: /track/:queueId/:tokenId
- Public join page: /join/:queueId
- Public join via QR shown in manager queue detail
- Public tracking payload includes assignedCounter for serving-state direction text
- Browser notifications on public tracking page for:
  - token is next in line
  - token is now serving

### Multi-counter Support (Complete)
- Status: 5 of 5 steps complete
- Completed so far:
  1. Schema support (Queue counters, Token assignedCounter, snapshot previousAssignedCounter)
  2. serve-top auto-assign to next free active counter with legacy single-counter fallback
  3. complete/cancel/undo counter-state handling with conflict guard on undo restore
  4. Public tracking page shows "Go to Counter X" when token is serving
  5. Manager counter-management API + UI (add, rename, remove with serving-counter safety blocks)

## 4) Multi-counter Rules and Decisions (Current)

- Legacy queue fallback:
  - If queue has no counters field (legacy data) or no active counters, behavior falls back to a single implicit counter (Counter 1).
  - Legacy single-counter behavior remains unchanged (second serve-top while one is serving returns conflict).
- serve-top behavior with multi-counter:
  - Assigns top waiting token to next free active counter by configured order.
  - Returns HTTP 409 with explicit message when all counters are busy.
- complete/cancel behavior:
  - Clears assignedCounter so the counter becomes free.
- undo behavior:
  - Restores assignedCounter from previousAssignedCounter snapshot.
  - Prevents double assignment: returns HTTP 409 if the prior counter is already occupied by another serving token.
- Counter rename/removal safety decision:
  - Rename/removal of a counter with an actively serving token should be blocked.
  - This is now enforced at backend API level and reflected in manager UI disabled/error states.

## 5) Current API Surface

Base backend URL (prod): https://queueflow-backend-fk17.onrender.com

### Health
- GET /health

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout (protected)
- GET /api/auth/me (protected)

### Queues (protected)
- POST /api/queues
- GET /api/queues?status=active|archived|all
- GET /api/queues/:queueId
- PATCH /api/queues/:queueId/archive
- PATCH /api/queues/:queueId/unarchive
- POST /api/queues/:queueId/counters
- PATCH /api/queues/:queueId/counters/:counterId
- DELETE /api/queues/:queueId/counters/:counterId
- DELETE /api/queues/:queueId

### Tokens (protected)
- GET /api/queues/:queueId/tokens?search=&page=&pageSize=
- POST /api/queues/:queueId/tokens
- PATCH /api/queues/:queueId/tokens/reorder
- PATCH /api/queues/:queueId/tokens/serve-top
- PATCH /api/queues/:queueId/tokens/:tokenId/complete
- PATCH /api/queues/:queueId/tokens/:tokenId/cancel
- PATCH /api/queues/:queueId/tokens/:tokenId/undo

### Analytics (protected)
- GET /api/queues/:queueId/analytics/summary
- GET /api/queues/:queueId/analytics/trend
- GET /api/queues/:queueId/analytics/status-distribution
- GET /api/queues/:queueId/analytics/hourly-traffic
- GET /api/queues/:queueId/analytics/reports?period=daily|weekly|monthly&from=&to=
- GET /api/queues/:queueId/analytics/reports/export.csv?period=...
- GET /api/queues/:queueId/analytics/reports/export.pdf?period=...
- GET /api/queues/:queueId/analytics/insights?refresh=true|false

### Activity Logs (protected)
- GET /api/activity-logs?page=&pageSize=

### Public (no login)
- POST /api/public/join/:queueId
- GET /api/public/track/:queueId/:tokenId

## 6) Current File Responsibilities

### Backend app and server
- backend/src/app.js
  - Express app setup, CORS/helmet/json, route registration, error handlers
- backend/src/server.js
  - DB boot, Socket.io setup, manager/public-track socket auth modes, room joins

### Backend configuration
- backend/src/config/db.js
  - Mongoose connect/disconnect helpers
- backend/src/config/env.js
  - Required env validation
- backend/src/config/socket.js
  - Socket.io setter + safe emit helpers for manager/public channels

### Backend models
- backend/src/models/User.js
  - Manager user identity/auth fields
- backend/src/models/Queue.js
  - Queue metadata, archive state, capacity, counters array
- backend/src/models/Token.js
  - Token state machine, timestamps, assignedCounter, actionSnapshot including previousAssignedCounter
- backend/src/models/AIInsightCache.js
  - Cached insight payloads for queues
- backend/src/models/ActivityLog.js
  - Manager activity audit entries

### Backend controllers
- backend/src/controllers/authController.js
  - Register/login/logout/me handlers
- backend/src/controllers/queueController.js
  - Queue create/list/get/delete/archive/unarchive and ownership checks
  - Counter management handlers (add/rename/remove) with serving-counter 409 guard
- backend/src/controllers/tokenController.js
  - List/add/reorder/serve-top/complete/cancel/undo
  - Multi-counter assignment and restoration logic (steps 2-3)
- backend/src/controllers/analyticsController.js
  - KPI metrics, reports, exports, AI insight endpoint
- backend/src/controllers/activityLogController.js
  - Paginated logs endpoint
- backend/src/controllers/publicJoinController.js
  - Public token join flow
- backend/src/controllers/publicTrackController.js
  - Public safe tracking payload

### Backend routes
- backend/src/routes/authRoutes.js
- backend/src/routes/queueRoutes.js
- backend/src/routes/tokenRoutes.js
- backend/src/routes/analyticsRoutes.js
- backend/src/routes/activityLogRoutes.js
- backend/src/routes/publicJoinRoutes.js
- backend/src/routes/publicTrackRoutes.js

### Backend services
- backend/src/services/tokenCreationService.js
  - Shared token creation rules (manager add + public join)
- backend/src/services/activityLogService.js
  - Activity logging utility
- backend/src/services/aiInsightsService.js
  - Gemini request/response orchestration

### Backend middleware and validators
- backend/src/middleware/authMiddleware.js, validate.js, rateLimiters.js, notFound.js, errorHandler.js
- backend/src/validators/authValidators.js, queueValidators.js, tokenValidators.js
  - queue validators now include counterId param + counter-name input validation

### Frontend routing and shell
- frontend/src/App.jsx
  - Route map for auth, manager pages, public join/track pages
- frontend/src/components/common/ProtectedRoute.jsx
  - Auth guard for manager routes
- frontend/src/components/layout/AppShell.jsx
  - Shared authenticated layout/navigation

### Frontend pages
- frontend/src/pages/LoginPage.jsx
- frontend/src/pages/RegisterPage.jsx
- frontend/src/pages/QueuesPage.jsx
- frontend/src/pages/QueueDetailPage.jsx
  - Queue operations, token actions, reorder, QR join card display, counter-management card integration
- frontend/src/pages/AnalyticsPage.jsx
- frontend/src/pages/ActivityLogsPage.jsx
- frontend/src/pages/JoinPage.jsx
  - Public queue join form and redirect to tracking URL
- frontend/src/pages/TrackTokenPage.jsx
  - Public tracking view + notification behavior + serving counter direction text

### Frontend components and hooks
- frontend/src/components/queues/QueueCard.jsx
- frontend/src/components/queues/QueueJoinQrCard.jsx
- frontend/src/components/queues/QueueCountersCard.jsx
  - Manager counter management UI with busy-counter disabled states and error handling
- frontend/src/components/tokens/AddTokenForm.jsx
- frontend/src/components/tokens/TokenDndList.jsx
- frontend/src/components/tokens/TokenRow.jsx
- frontend/src/components/analytics/KpiCards.jsx
- frontend/src/components/analytics/QueueTrendChart.jsx
- frontend/src/components/analytics/StatusPieChart.jsx
- frontend/src/components/analytics/HourlyTrafficChart.jsx
- frontend/src/hooks/useSocket.js
- frontend/src/hooks/usePublicTrackSocket.js
- frontend/src/hooks/useServiceTimer.js

### Frontend API clients and context
- frontend/src/api/client.js
- frontend/src/api/authApi.js
- frontend/src/api/queueApi.js
  - Includes counter management request helpers
- frontend/src/api/tokenApi.js
- frontend/src/api/analyticsApi.js
- frontend/src/api/activityLogApi.js
- frontend/src/context/AuthContext.jsx
- frontend/src/context/ThemeContext.jsx

### Deployment config files
- render.yaml
- frontend/vercel.json

## 7) Live Deployment URLs

- Frontend (Vercel): https://frontend-sand-two-jsq0xwws5z.vercel.app
- Backend (Render): https://queueflow-backend-fk17.onrender.com
- GitHub repo: https://github.com/techWithKeerthana/rugas-queue-management-system
- Status: URLs unchanged and still accurate after merging multi-counter into master.

## 8) Required Environment Variables (Names Only)

### Backend
- PORT
- MONGO_URI
- JWT_SECRET
- JWT_EXPIRES_IN
- FRONTEND_ORIGIN
- GEMINI_API_KEY
- GEMINI_MODEL
- INSIGHTS_TIMEOUT_MS

### Frontend
- VITE_API_URL
- VITE_SOCKET_URL

## 9) Test Status and Coverage

- Current backend test suite status: passing
- Exact count: 28 tests, 1 suite
- Last confirmed command: npm test (backend)

Coverage themes in backend/tests/api.test.js:
- Priority insertion ordering
- Serve/cancel/complete/undo state/timestamp integrity
- Reorder persistence
- Realtime event emission smoke checks
- Duplicate active-token prevention
- Capacity enforcement
- Search + pagination behavior
- Analytics reports and CSV/PDF export
- Archive mutability and filtering
- Activity logs endpoint behavior
- AI insights fallback and timeout behavior
- Public tracking safe payload and mismatch rejection
- Public join validation/duplicate/capacity/rate-limit
- Public tracking assignedCounter exposure in safe payload
- Multi-counter serve-top and busy-counter conflict
- Multi-counter step-3 scenario tests (all passing):
  1. complete serving token frees counter and next serve-top can use it
  2. cancel serving token frees counter
  3. cancel waiting token has no counter side effects
  4. undo completed token restores serving and re-occupies prior counter
  5. undo cancelled serving token restores serving and re-occupies prior counter
- Counter management API tests (all passing):
  1. add counter
  2. rename counter
  3. remove counter
  4. blocked rename when counter has active serving token
  5. blocked removal when counter has active serving token

## 10) Known Caveats and Operational Notes

- Render free-tier cold starts can make the first request noticeably slow.
- MongoDB Atlas SRV DNS lookups may fail on some Windows/network environments; non-SRV Mongo URI is a known local workaround.
- AI insights availability depends on Gemini service latency/limits; fallback behavior is intentionally user-friendly.
- Public endpoints are intentionally rate-limited and return minimal safe data.
- Frontend build currently passes, with a Vite warning about large bundle chunk size (non-blocking).

## 11) Next Steps

Multi-counter work is complete.

1. No remaining required multi-counter steps.
2. Optional follow-up: reduce frontend bundle size warning via route-based code splitting.

## 12) Quick Commands

From repository root D:\Rugas:

- Install all:
  - npm install
  - cd backend && npm install
  - cd ../frontend && npm install

- Run development:
  - npm run dev

- Backend only:
  - npm run dev --prefix backend

- Frontend only:
  - npm run dev --prefix frontend

- Backend tests:
  - cd backend
  - npm test

- Frontend build:
  - cd frontend
  - npm run build
