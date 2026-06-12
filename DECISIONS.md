# Design Decisions

This document explains key architectural and implementation choices for the Ezrah Webhook Relay system.

## 1. Secret storage strategy

Webhook endpoint secrets are **encrypted at rest** using **AES-256-GCM** via AdonisJS's built-in encryption service, keyed by `APP_KEY`.

| Approach | Why not used |
|----------|--------------|
| Plaintext storage | Any database leak exposes all subscriber signing secrets immediately. |
| Hashing (bcrypt, SHA-256) | Hashing is one-way. We must recover the original secret to compute HMAC-SHA256 signatures at delivery time. |
| **Encryption (chosen)** | Secrets are protected at rest but can be decrypted in the worker when building `X-Ezrah-Signature`. |

Implementation: `app/utils/secret_encryption.ts` wraps AdonisJS encryption. Secrets are encrypted on `POST /api/endpoints` and never returned in API responses.

## 2. Queue topology choice

We use a **single BullMQ queue** named `webhook-deliveries`.

### Why one queue?

- **Operational simplicity:** One queue to monitor, one worker process type, straightforward metrics (`queue_depth`).
- **Shared worker pool:** A single concurrent worker pool processes all endpoints, avoiding per-endpoint queue provisioning.
- **Delayed retries:** Failed deliveries are re-enqueued with a delay on the same queue — no cross-queue coordination needed.

### Alternatives considered

| Topology | Trade-off |
|----------|-----------|
| Per-endpoint queues | Isolates slow endpoints completely but multiplies operational overhead (N queues, N workers or complex routing). |
| Priority queues | Adds complexity; per-endpoint rate limiting achieves similar fairness with less infrastructure. |

## 3. Retry strategy rationale

Retries are driven by **HTTP semantics**, not blind repetition:

| Response | Action |
|----------|--------|
| 2xx | Mark `delivered` |
| 5xx | Retry with backoff |
| Network error / timeout | Retry with backoff |
| 429 | Retry after `Retry-After` header (default 60s) |
| 4xx (except 429) | Mark `abandoned` — client error, retrying won't help |

### Backoff schedule

| After failed attempt | Delay before next try |
|----------------------|------------------------|
| 1 | 10 seconds |
| 2 | 30 seconds |
| 3 | 2 minutes |
| 4 | 10 minutes |
| 5 | 30 minutes |

After **5 failed attempts**, status becomes `abandoned`. Manual retry via `POST /api/deliveries/:id/retry` resets to `pending` and re-enqueues.

BullMQ's built-in job retries are **disabled** (`attempts: 1` per job). Business-level retry state lives in PostgreSQL (`attempts`, `next_attempt_at`, `status`) so the API and UI reflect accurate delivery state.

## 4. At-least-once vs exactly-once trade-offs

This system guarantees **at-least-once delivery**, not exactly-once.

### Why exactly-once is impractical

True exactly-once delivery across an HTTP boundary requires distributed transactions between our system and the subscriber — not achievable with standard webhooks. Scenarios that cause duplicates:

- Worker crashes after subscriber returns 200 but before we persist `delivered`
- Network timeout after subscriber processed the request
- Retry overlap during crash recovery

### Mitigation

Every delivery includes a stable **`X-Ezrah-Delivery-Id`** header (the delivery UUID). Subscribers **must deduplicate** on this ID. This is the industry-standard pattern (similar to Stripe, GitHub, Shopify webhooks).

## 5. Worker crash recovery

### Crash during delivery

If a worker crashes while `status = delivering`:

1. BullMQ detects a **stalled job** and may re-deliver it.
2. On re-processing, if status is already `delivering`, the processor **does not increment** `attempts` again (same attempt number).
3. `DeliveryAttempt` records use a unique constraint on `(delivery_id, attempt_number)` to prevent duplicate attempt rows.

### Crash after subscriber success

If the worker receives 2xx but crashes before updating the database, the job may run again → subscriber sees a duplicate. This is the at-least-once trade-off; deduplication by `X-Ezrah-Delivery-Id` is required.

### Crash before HTTP call

Status remains `delivering` until the job is picked up again. No delivery attempt is lost because the job remains in Redis.

## 6. Starvation prevention

A single slow or rate-limited endpoint must not block deliveries to healthy endpoints.

### Mechanisms

1. **Worker concurrency** (default: 10): Multiple jobs run in parallel. One slow HTTP call blocks only one worker slot, not the entire queue.

2. **Per-endpoint rate limiting** (20 req/min): Implemented via Redis fixed-window counters (`ratelimit:endpoint:{id}`). When exceeded, the job is **delayed** via BullMQ's `DelayedError` without counting as a failed attempt.

3. **Single queue + parallel workers**: Healthy endpoints continue to be processed while slow endpoints wait for rate-limit windows or retry delays.

### Why not per-endpoint queues?

Per-endpoint queues would require either dedicated workers per endpoint (expensive) or a complex dispatcher. Concurrency + per-endpoint rate limits achieve fairness with simpler operations.

## 7. Why the DeliveryAttempts table was added

Although not in the original schema requirements, `delivery_attempts` was added because:

- **Audit trail:** Each HTTP try is recorded with timestamp, status code, and error message.
- **Support & debugging:** Operators can see exactly what happened on attempts 1–5 without parsing logs.
- **UI requirement:** The delivery detail page shows an attempt history timeline/table.
- **Separation of concerns:** `webhook_deliveries` holds current state; `delivery_attempts` holds immutable history.

The delivery row tracks aggregate state (`attempts`, `last_http_status`, `last_error`); attempt rows provide the full chronological record.

## Additional notes

### AdonisJS version

The project uses **AdonisJS 7** (latest official API starter kit). The assessment specified v6; v7 was chosen because the current `create-adonisjs` tooling targets v7. All specified patterns (Lucid ORM, Vine validation, middleware, encryption, TypeScript strict mode) are preserved.

### Rate limiting implementation

BullMQ Pro offers native **group rate limiting**. We use open-source BullMQ with a **Redis-based fixed-window limiter** per endpoint, which satisfies the 20 req/min requirement without a commercial dependency.

### Frontend `/events` route

The routes list in the spec covers `/endpoints` and `/deliveries`. A dedicated `/events` page was added because the spec defines a full Event Ingestion Page with its own form and validation requirements.
