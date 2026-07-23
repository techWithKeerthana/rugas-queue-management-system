# Queue Management System (Tier 1)

Full-stack Queue Management application built for the Rugas internship assignment.

## Implemented Scope

### Tier 1 Features Included
- JWT auth with register, login, logout, and protected routes
- Password hashing with bcrypt
- Multiple queues per manager with unique queue names per manager
- Token creation with auto-increment token number per queue
- Token lifecycle: waiting, serving, completed, cancelled
- Live estimated wait time per waiting token
- Live service timer for currently serving token
- Drag-and-drop reordering for waiting tokens
- Serve top token, cancel token, complete token
- One-step undo for serve/cancel/complete actions
- Priority support: normal, senior, vip, emergency (auto-prioritized)
- Real-time sync via Socket.io events
- Analytics dashboard:
  - KPI cards (total/waiting/serving/completed/cancelled)
  - average wait time
  - average service time
  - longest waiting token
  - queue length trend chart
  - status distribution chart
  - hourly peak traffic chart
- UI polish:
  - responsive layout
  - toasts
  - loading skeletons
  - empty states
  - confirmation dialogs before destructive actions

## Tech Stack
- Frontend: React + Tailwind CSS + Recharts + dnd-kit + Socket.io client
- Backend: Node.js + Express + Mongoose + JWT + bcrypt + Socket.io
- Database: MongoDB
- Testing: Jest + Supertest + mongodb-memory-server-core

## Project Structure

- frontend: React app
- backend: Express API + Socket.io + Mongoose models
- root scripts: convenience commands for running both apps

## Environment Variables

### backend/.env
Copy from backend/.env.example:

- PORT=5000
- MONGO_URI=mongodb://127.0.0.1:27017/queue_management
- JWT_SECRET=change_this_secret
- JWT_EXPIRES_IN=1d
- FRONTEND_ORIGIN=http://localhost:5173

### frontend/.env
Copy from frontend/.env.example:

- VITE_API_URL=http://localhost:5000/api
- VITE_SOCKET_URL=http://localhost:5000

## Install

From repo root:

```bash
npm install
```

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

## Run (Development)

### Option 1: run both from root

```bash
npm run dev
```

### Option 2: run separately

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Frontend default URL: http://localhost:5173  
Backend default URL: http://localhost:5000

## Seed Demo Data

1. Ensure MongoDB is running and backend env is configured.
2. Run:

```bash
cd backend
npm run seed
```

Seed creates a demo manager:
- Email: manager@queueflow.dev
- Password: Password123

## Tests

Run backend business logic tests:

```bash
cd backend
npm test
```

Tests verify:
- priority queue ordering logic
- serve/cancel/undo state and timestamp transitions
- drag-and-drop reorder persistence
- socket event firing for add/reorder/serve/cancel

## API Overview

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Queues
- POST /api/queues
- GET /api/queues
- GET /api/queues/:queueId
- DELETE /api/queues/:queueId

### Tokens
- GET /api/queues/:queueId/tokens
- POST /api/queues/:queueId/tokens
- PATCH /api/queues/:queueId/tokens/reorder
- PATCH /api/queues/:queueId/tokens/serve-top
- PATCH /api/queues/:queueId/tokens/:tokenId/complete
- PATCH /api/queues/:queueId/tokens/:tokenId/cancel
- PATCH /api/queues/:queueId/tokens/:tokenId/undo

### Analytics
- GET /api/queues/:queueId/analytics/summary
- GET /api/queues/:queueId/analytics/trend
- GET /api/queues/:queueId/analytics/status-distribution
- GET /api/queues/:queueId/analytics/hourly-traffic

## Notes
- Token numbers are unique per queue and auto-incremented.
- Queue names are unique per manager.
- Undo is one-step and token-scoped.
- Only one token can be in serving state per queue at a time.
- Daily/weekly/monthly reports are computed on-demand from the Token collection by design (no pre-aggregated analytics collection).

## Deployment (Render + Vercel)

### Backend on Render

This repo includes [render.yaml](render.yaml) for a Render web service blueprint.

1. Push this repository to GitHub.
2. In Render, create a new Blueprint and select this repo.
3. Render will create service `queueflow-backend` using:
  - Root directory: `backend`
  - Build command: `npm install`
  - Start command: `npm start`
  - Health check path: `/health`
4. Set required environment variables in Render:
  - `MONGO_URI` (Atlas connection string)
  - `JWT_SECRET` (strong secret)
  - `FRONTEND_ORIGIN` (comma-separated allowed frontend origins)
  - `GEMINI_API_KEY` (optional but needed for AI insights)
5. Keep optional defaults unless you need to override:
  - `JWT_EXPIRES_IN=1d`
  - `GEMINI_MODEL=gemini-1.5-flash`
  - `INSIGHTS_TIMEOUT_MS=12000`

Example `FRONTEND_ORIGIN` value:

`https://your-app.vercel.app,https://your-app-git-main-your-team.vercel.app`

### Frontend on Vercel

This repo includes [frontend/vercel.json](frontend/vercel.json) with SPA rewrite support.

1. Create a new Vercel project from this repo.
2. Set project root directory to `frontend`.
3. Add frontend environment variables (from [frontend/.env.production.example](frontend/.env.production.example)):
  - `VITE_API_URL=https://your-render-backend.onrender.com/api`
  - `VITE_SOCKET_URL=https://your-render-backend.onrender.com`
4. Deploy.

### Deployment Notes

- Backend CORS and Socket.io origin checks read `FRONTEND_ORIGIN`.
- You can provide one or multiple origins using a comma-separated list.
- If your Vercel preview URLs need access, include them in `FRONTEND_ORIGIN`.

## MongoDB Atlas DNS SRV Workaround

On some Windows/network DNS setups, `mongodb+srv://` may fail with:

- `querySrv ECONNREFUSED _mongodb._tcp.<cluster-host>`

If this occurs, use the non-SRV Atlas URI in `backend/.env` (the full `mongodb://host1,host2,host3/...` format with `replicaSet` and `authSource`) as a working fallback. This is an environment DNS resolver issue, not an application bug.
