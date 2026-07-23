# QueueFlow Suite

A production-style real-time queue management platform for service desks, with manager operations, public self-service joining, and live tracking.

## Why This Project

QueueFlow demonstrates how to build a full-stack, real-time SaaS workflow: authenticated manager tools, customer-safe public flows, analytics, and operational safeguards (capacity limits, validation, audit logs, rate limits).

## Core Features

- Real-time queue operations with Socket.io (add, serve, complete, cancel, undo)
- Priority insertion (emergency, VIP, senior citizen, normal)
- Multi-counter support with automatic counter assignment while serving
- Public no-login queue join via sharable link/QR and live token tracking
- Search + pagination for high-volume queues
- Analytics dashboard (summary metrics, trends, status mix, hourly traffic)
- CSV/PDF report exports
- Gemini-powered AI insights with cache/timeout fallback
- Queue archive/unarchive and manager activity logs

## Tech Stack

- Backend: Node.js, Express, MongoDB Atlas (Mongoose), Socket.io
- Frontend: React, Vite, Tailwind CSS, Recharts
- Auth/Security: JWT, route protection, validation middleware, rate limiting
- AI: Google Gemini integration for analytics insight summaries

## Live Demo

- Frontend (Vercel): https://frontend-sand-two-jsq0xwws5z.vercel.app
- Backend (Render): https://queueflow-backend-fk17.onrender.com
- Repository: https://github.com/techWithKeerthana/rugas-queue-management-system

## UI Preview

Screenshots are included in the repo:

- Login: [docs/screenshots/login.png](docs/screenshots/login.png)
- Queue Dashboard: [docs/screenshots/queue-dashboard.png](docs/screenshots/queue-dashboard.png)
- Analytics: [docs/screenshots/analytics.png](docs/screenshots/analytics.png)
- Public Tracking: [docs/screenshots/public-track.png](docs/screenshots/public-track.png)

## Run Locally

1. Install dependencies.

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

2. Configure environment files from examples.

- backend/.env.example
- frontend/.env.example
- frontend/.env.production.example

3. Start both apps from repo root.

```bash
npm run dev
```

Useful commands:

```bash
npm run test --prefix backend
npm run build --prefix frontend
```

## Architecture (High Level)

Managers use authenticated dashboard routes to manage queues and token flow, while customers use public routes to join and track tokens without login. The backend publishes real-time updates through Socket.io rooms, with manager channels for full queue state updates and restricted public channels for safe tracking refresh behavior.
