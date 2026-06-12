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

## Quick start (Docker)

1. Copy environment files:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Generate an `APP_KEY` for AdonisJS and set it in the root `.env`:

```bash
cd backend
node ace generate:key
# Copy output into APP_KEY in repo root .env and backend/.env
```

3. Align `API_SECRET_KEY` across root `.env`, `backend/.env`, and `frontend/.env` (`VITE_API_SECRET_KEY`).

4. Start infrastructure + API + worker:

```bash
docker compose up --build
```

Services:

| Service  | URL / Port        |
|----------|-------------------|
| API      | http://localhost:3333 |
| Postgres | localhost:5432    |
| Redis    | localhost:6379    |

The API container waits for PostgreSQL and Redis, runs migrations, then starts. The worker starts after the API is healthy (migrations complete).

5. Start the frontend (separate terminal):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

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

```bash
cd frontend
npm install
npm run dev      # development
npm run build    # production build
npm run preview  # preview production build
```

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
| `npm run typecheck` | TypeScript check |

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
# { "status": "ok" }
```

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
