# Ezrah Webhook Relay

Production-oriented fintech webhook relay system. Accepts events via REST API, fans out to registered subscriber endpoints, delivers signed HTTP POST payloads with retries, rate limiting, and observability.

## Architecture

```
┌─────────────┐     POST /api/events      ┌──────────────┐
│   Client    │ ────────────────────────► │  AdonisJS    │
│  (or UI)    │                           │  API         │
└─────────────┘                           └──────┬───────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    │                            │                            │
                    ▼                            ▼                            ▼
             ┌────────────┐              ┌────────────┐              ┌────────────┐
             │ PostgreSQL │              │   Redis    │              │  BullMQ    │
             │ (state)    │              │  (queue)   │◄─────────────│  Worker    │
             └────────────┘              └────────────┘              └──────┬─────┘
                                                                            │
                                                                            ▼
                                                                   Subscriber webhooks
```

## Repository structure

```
/
├── backend/          AdonisJS API + BullMQ worker
├── frontend/         Vue 3 dashboard
├── docker-compose.yml
├── README.md
└── DECISIONS.md
```

## Prerequisites

- **Docker path:** Docker + Docker Compose
- **Local path:** Node.js 20+, PostgreSQL 16+, Redis 7+

## Run like production

One-time setup (from repo root):

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Generate `APP_KEY` and set it in **both** `.env` and `backend/.env`:

```bash
cd backend && node ace generate:key
```

Set the same `API_SECRET_KEY` in `.env`, `backend/.env`, and `frontend/.env` (`VITE_API_SECRET_KEY`).

For Docker, also set `CORS_ORIGIN=http://localhost:5173` in root `.env` so the browser dashboard can call the API (see [Troubleshooting](#troubleshooting) if requests work in `curl` but fail in the browser).

### 1. Start backend stack (production build)

```bash
docker compose up --build
```

This starts **PostgreSQL**, **Redis**, the **API** (migrations run automatically), and the **Worker** as separate containers — the same topology used in production.

| Service | Where it runs |
|---------|----------------|
| **API** | http://localhost:3333 |
| **Worker** | Background service (no URL — processes `webhook-deliveries` queue) |
| Postgres | `localhost:5432` (internal dependency) |
| Redis | `localhost:6379` (internal dependency) |

Verify the stack:

```bash
curl http://localhost:3333/health
# { "status": "ok", "postgres": true, "redis": true }
```

### 2. Start the frontend

In a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |

The dashboard talks to the API at `http://localhost:3333` (configured in `frontend/.env`).

### What you should see

```
docker compose up --build
  → postgres, redis, api, worker all healthy

http://localhost:3333/health   → API + dependencies OK
http://localhost:3333/api/...    → Bearer-authenticated REST API
http://localhost:5173          → Vue dashboard (Endpoints, Events, Deliveries)

worker container logs           → structured delivery logs (deliveryId, endpointId, attempt, status)
```

---

## Quick start (Docker) — details

The steps above are the full path. Additional notes:

- The API container waits for PostgreSQL and Redis healthchecks, runs migrations, then listens on port **3333**.
- The worker container starts only after the API is healthy (migrations complete).
- To run in the background: `docker compose up --build -d`
- To tail worker logs: `docker compose logs -f worker`

## Local development (without Docker)

### 1. Start PostgreSQL and Redis

Use local installs or run only data services:

```bash
docker compose up postgres redis
```

### 2. Backend API

```bash
cd backend
cp .env.example .env
# Set APP_KEY (node ace generate:key), DB_*, REDIS_*, API_SECRET_KEY

npm install
node ace migration:run
npm run dev
```

API: http://localhost:3333

### 3. Worker (separate terminal)

```bash
cd backend
npm run worker:dev
```

### 4. Frontend (separate terminal)

```bash
cd frontend
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:3333
# Set VITE_API_SECRET_KEY to match backend API_SECRET_KEY

npm install
npm run dev
```

## Environment variables

### Root / Docker (`.env`)

| Variable | Description |
|----------|-------------|
| `APP_KEY` | AdonisJS encryption key (required) |
| `API_SECRET_KEY` | Bearer token for all `/api` routes |
| `CORS_ORIGIN` | Allowed browser origin for the dashboard (default: `http://localhost:5173`) |
| `POSTGRES_USER` | PostgreSQL user (default: `postgres`) |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | Database name (default: `webhook_relay`) |
| `WORKER_CONCURRENCY` | Parallel BullMQ jobs (default: `10`) |

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default: `3333`) |
| `HOST` | Bind address (use `0.0.0.0` in Docker) |
| `APP_KEY` | Same as root `.env` |
| `APP_URL` | Public API URL |
| `API_SECRET_KEY` | Bearer token |
| `CORS_ORIGIN` | Allowed browser origins (comma-separated). Required when `NODE_ENV=production` (e.g. Docker API) |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port |
| `DB_USER` | PostgreSQL user |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_DATABASE` | Database name |
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port |
| `WORKER_CONCURRENCY` | Worker parallelism |
| `LOG_LEVEL` | Pino log level (`info`, `debug`, …) |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend URL (default: `http://localhost:3333`) |
| `VITE_API_SECRET_KEY` | Must match backend `API_SECRET_KEY` |

## API authentication

All `/api/*` routes require:

```
Authorization: Bearer <API_SECRET_KEY>
```

This is a **shared API secret**, not a per-user login token. There is no signup or login flow in this project — the dashboard sends `VITE_API_SECRET_KEY` automatically on every request. Set the same value in `.env`, `backend/.env`, and `frontend/.env`.

The AdonisJS starter kit includes unused user-auth controllers; they are not wired to routes.

## API examples

Replace `YOUR_SECRET` with your `API_SECRET_KEY`.

### Register an endpoint

```bash
curl -X POST http://localhost:3333/api/endpoints \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "acme",
    "url": "https://example.com/webhook",
    "secret": "abc",
    "event_types": ["payment.completed"]
  }'
```

### List endpoints

```bash
curl "http://localhost:3333/api/endpoints?client_id=acme" \
  -H "Authorization: Bearer YOUR_SECRET"
```

### Deactivate an endpoint

```bash
curl -X DELETE http://localhost:3333/api/endpoints/<endpoint-id> \
  -H "Authorization: Bearer YOUR_SECRET"
```

### Ingest an event

```bash
curl -X POST http://localhost:3333/api/events \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "acme",
    "event_type": "payment.completed",
    "payload": { "amount": 100, "currency": "USD" }
  }'
```

Returns `202 Accepted`. Deliveries are created and enqueued; HTTP delivery happens asynchronously in the worker.

### List deliveries

```bash
curl "http://localhost:3333/api/deliveries?status=failed" \
  -H "Authorization: Bearer YOUR_SECRET"
```

### Get delivery detail

```bash
curl http://localhost:3333/api/deliveries/<delivery-id> \
  -H "Authorization: Bearer YOUR_SECRET"
```

### Retry a delivery

```bash
curl -X POST http://localhost:3333/api/deliveries/<delivery-id>/retry \
  -H "Authorization: Bearer YOUR_SECRET"
```

### Metrics

```bash
curl http://localhost:3333/api/metrics \
  -H "Authorization: Bearer YOUR_SECRET"
```

Response:

```json
{
  "queue_depth": 0,
  "delivered_count": 12,
  "abandoned_count": 1
}
```

## Webhook delivery format

Subscribers receive:

```json
{
  "id": "<delivery_uuid>",
  "event_type": "payment.completed",
  "created_at": "2026-06-12T12:00:00.000Z",
  "payload": {}
}
```

Headers:

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `X-Ezrah-Signature` | `sha256=<hmac_sha256_hex>` |
| `X-Ezrah-Delivery-Id` | `<delivery_uuid>` |

The signature is HMAC-SHA256 of the **raw JSON body** using the endpoint secret.

Subscribers should deduplicate using `X-Ezrah-Delivery-Id` (at-least-once semantics).

## Frontend

Routes:

| Path | Description |
|------|-------------|
| `/endpoints` | Register and manage webhook endpoints |
| `/events` | Ingest events |
| `/deliveries` | Monitor deliveries (polls every 5s) |
| `/deliveries/:id` | Delivery detail + retry |

### Dashboard notes

- **Register Endpoint** means registering a **webhook subscriber URL** (client ID, URL, secret, event types). It is not user account registration.
- The endpoints table is scoped by **Client ID**. The API lists endpoints with `GET /api/endpoints?client_id=<id>` — there is no "list all" endpoint.
- On `/endpoints`, enter a Client ID in the list section and click **Refresh**, or register a new endpoint (which auto-loads that client). The page remembers the last Client ID in `sessionStorage` and reloads it on refresh.
- Restart the Vite dev server after changing `frontend/.env` — env vars are read at startup.

```bash
cd frontend
npm install
npm run dev      # development
npm run build    # production build
npm run preview  # preview production build
```

## Troubleshooting

### `401 Unauthorized` from the dashboard

`VITE_API_SECRET_KEY` in `frontend/.env` must exactly match `API_SECRET_KEY` in the backend (and root `.env` when using Docker). After changing it, restart the frontend dev server.

### `curl` works but the browser fails

The Docker API runs with `NODE_ENV=production`, which blocks cross-origin browser requests unless `CORS_ORIGIN` is set. Ensure root `.env` includes:

```env
CORS_ORIGIN=http://localhost:5173
```

Then rebuild the API container:

```bash
docker compose up --build -d api
```

`curl` is not subject to CORS, so API calls from the terminal can succeed while the browser is blocked.

### Endpoints disappear after reloading the page

Endpoints are still in the database. The list only loads when a Client ID is provided. Enter your Client ID (e.g. `acme`) and click **Refresh**, or register a new endpoint under that client. The page restores the last Client ID from `sessionStorage` when possible.

### Local `npm run dev` backend vs Docker

| Setup | API URL | Notes |
|-------|---------|-------|
| Docker (`docker compose up`) | `http://localhost:3333` | Recommended. Migrations run automatically. Set `VITE_API_BASE_URL` to this. |
| Local `npm run dev` | Often `http://localhost:3333`, but HMR may use another port | Requires PostgreSQL + Redis, `node ace migration:run`, and matching `backend/.env`. Point `VITE_API_BASE_URL` at the port shown in the terminal. |

If the frontend targets the wrong port or backend, requests fail or return database errors even when Docker is healthy on `3333`.

## Scripts reference

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | API with hot reload |
| `npm run worker:dev` | Worker process |
| `npm run build` | Production build |
| `npm start` | Run built API |
| `npm run worker` | Run built worker |
| `node ace migration:run` | Run migrations |
| `npm test` | Run unit + functional tests (requires `.env.test`; see below) |
| `npm run typecheck` | TypeScript check |

#### Running tests locally

Tests load `backend/.env.test` when `NODE_ENV=test`. That file is gitignored, so create it once:

```bash
cd backend
cp .env.test.example .env.test
# Adjust DB_PASSWORD if your local Postgres password differs
npm test
```

CI copies `.env.test.example` automatically before `npm test`.

### Docker

| Command | Description |
|---------|-------------|
| `docker compose up --build` | Start all services |
| `docker compose up api worker --build` | Rebuild app containers |
| `docker compose logs -f worker` | Tail worker logs |
| `docker compose down -v` | Stop and remove volumes |

## Health check

```bash
curl http://localhost:3333/health
# { "status": "ok", "postgres": true, "redis": true }
```

Returns HTTP `503` with `"status": "degraded"` when PostgreSQL or Redis is unreachable (used by Docker/Kubernetes probes).

## Design decisions

See [DECISIONS.md](./DECISIONS.md) for rationale on secret storage, queue topology, retries, delivery semantics, and more.

## Tech stack

| Layer | Technology |
|-------|------------|
| API | AdonisJS 7, TypeScript (strict), Lucid ORM |
| Database | PostgreSQL |
| Queue | BullMQ + Redis |
| Worker | Separate Node process |
| Frontend | Vue 3, Vite, Vue Router, TypeScript (strict) |
| Logging | Pino (structured) |
