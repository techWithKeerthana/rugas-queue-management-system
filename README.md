# Queue Management System — Project Specification

## 1. Overview
A full-stack Queue Management application for the Rugas internship assignment. A **Queue Manager** logs in, creates queues, adds people (tokens) to those queues, reorders/serves/cancels tokens, and views analytics on queue performance. This spec merges the original assignment requirements with a curated set of extra features chosen for maximum impact on recruiters within a limited timeline.

**Deadline:** 25th August, 2025
**Deliverables:**
- A working, deployed (or locally runnable) application
- Source code pushed to a public/shared GitHub repository
- Clean, polished UI (scored as a bonus)
- Bug-free behavior (scored as a bonus)

---

## 2. Build Priority (read this before building)
Features are grouped into tiers. **Build Tier 1 completely and solidly before touching Tier 2 or 3.** A fully working Tier 1 app with no bugs will score higher than a half-working app stuffed with every feature.

- **Tier 1 — Core assignment + high-impact additions (must-have)**
- **Tier 2 — Nice-to-have polish (build if time allows)**
- **Tier 3 — Optional stretch (only if Tier 1 & 2 are done and stable)**

---

## 3. Tier 1 — Core Requirements (must-have)

### 3.1 Authentication
- JWT-based auth: Register, Login, Logout, protected routes.
- Passwords hashed with bcrypt.

### 3.2 Queue Management
- Manager can create multiple queues.
- Each queue has a unique **name**.

### 3.3 Token Management
- Add people/tokens to a queue; each gets an **auto-generated unique token number**.
- Token statuses: `Waiting`, `Serving`, `Completed`, `Cancelled`.
- Display the live list of waiting tokens, in order.
- **Estimated wait time** per token (based on average service time and position).
- **Live service timer** while a token is being served.
- **Undo Cancel / Undo Serve** — one-step recovery from an accidental action.

### 3.4 Queue Interactions
- **Drag-and-drop reordering** of tokens (replaces plain up/down buttons — bigger visual/UX win for the same requirement).
- **Serve** the top token with a single click.
- **Cancel** a token from anywhere in the queue.
- **Priority queue support**: VIP / Senior Citizen / Emergency tokens can be flagged and are automatically prioritized ahead of regular tokens.
- **Real-time updates** across all connected clients via **Socket.io** — no manual refresh needed when tokens are added, reordered, served, or cancelled.

### 3.5 Dashboard & Analytics
- KPI cards: Total Tokens, Waiting, Serving, Completed, Cancelled.
- Average wait time, average service time, longest-waiting token.
- Queue length trend chart (over time).
- Status distribution pie chart.
- Hourly peak-traffic chart.

### 3.6 UI/UX Polish
- Modern, responsive UI (mobile-friendly).
- Toast notifications for actions (token added, served, cancelled, undone).
- Loading skeletons instead of blank/spinner-only states.
- Empty states (e.g., "No tokens in this queue yet").
- Confirmation dialogs before destructive actions (cancel, delete queue).

---

## 4. Tier 2 — Nice-to-Have (build if time allows)
- Search tokens by ID or name.
- Pagination for large queues.
- Duplicate detection when adding a token.
- Queue capacity limit (block new tokens once full).
- Daily / Weekly / Monthly analytics reports.
- Export reports to CSV / PDF.
- Dark / Light mode toggle.
- Profile dropdown (manager info, logout).

---

## 5. Tier 3 — Optional Stretch (only if Tier 1 & 2 are solid)
- **AI Queue Insights** (via Gemini or OpenAI API): generates natural-language insights — peak hours, changes in average wait time, bottlenecks, recommendations. High "wow" factor but adds an external API dependency, cost, and failure surface — only attempt once the core app is stable and there's real time left before the deadline.
- Queue history archive (closed/past queues kept for reference).
- Separate Activity Logs (audit trail of manager actions).

---

## 6. Suggested Data Model (MongoDB Collections)

**Users**
- `_id`, name, email, password_hash, created_at

**Queues**
- `_id`, name, manager_id (ref Users), capacity (optional), is_archived, created_at

**Tokens**
- `_id`, queue_id (ref Queues), token_number, person_name, priority (`normal` | `vip` | `senior` | `emergency`), position, status (`waiting` | `serving` | `completed` | `cancelled`), created_at, served_at, completed_at, cancelled_at

**Analytics**
- `_id`, queue_id, date, avg_wait_time, avg_service_time, total_served, total_cancelled, peak_hour

**Activity Logs** *(Tier 3)*
- `_id`, manager_id, action, target_id, timestamp

---

## 7. Technical Stack
- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT + bcrypt
- **Charts:** Recharts / Chart.js
- **Real-time:** Socket.io
- **Drag-and-drop:** dnd-kit or react-beautiful-dnd
- **Deployment:** Vercel (frontend) + Render (backend + DB, or MongoDB Atlas)

---

## 8. Suggested Pages/Screens
1. **Login / Register page**
2. **Queues list page** (create new queue, list existing queues)
3. **Queue detail page** — token list with drag-and-drop reorder, add-token form (with priority flag), serve/cancel/undo controls, live wait-time display
4. **Analytics dashboard page** — KPI cards + charts
5. *(Tier 2/3)* Settings/profile dropdown, dark/light toggle, AI insights panel

---

## 9. Non-Functional / Evaluation Criteria
| Criteria | Notes |
|---|---|
| Working application | Must run end-to-end without crashing |
| Code in GitHub | Public repo or repo shared with reviewers, clear commit history |
| Good UI | Bonus — Tier 1's polish items directly target this |
| Bug-free | Bonus — handle edge cases (empty queue, invalid reorder, already-served token, duplicate names, etc.) |

---

## 10. Build Instructions (for the coding agent)
- Clean architecture, reusable React components, RESTful APIs, proper folder structure.
- Error handling and input validation on every endpoint.
- Responsive, professional UI.
- Git-ready code with incremental, well-labeled commits.
- Seed script with sample data (a few queues, tokens in various statuses) for demo purposes.
- Ensure bug-free implementation — this is explicitly scored.
- README (in the actual repo, separate from this spec) with clear setup/run instructions.

---

## 11. Submission Checklist
- [ ] All Tier 1 features implemented and tested
- [ ] Tier 2 features added as time permits
- [ ] Tier 3 (AI insights, etc.) attempted only if ahead of schedule
- [ ] Code pushed to GitHub with a clear commit history
- [ ] Repo README with setup/run instructions and seed data steps
- [ ] Screenshots or a short demo video/GIF in the repo (recommended)
- [ ] Live deployment link (recommended, not required)
