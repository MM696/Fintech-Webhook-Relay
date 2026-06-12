import env from '#start/env'

export const HTTP_TIMEOUT_MS = 10_000

export const ENDPOINT_RATE_LIMIT_MAX = 20
export const ENDPOINT_RATE_LIMIT_WINDOW_SEC = 60

export const RATE_LIMIT_DEFAULT_RETRY_MS = 60_000

export const MAX_DELIVERY_ATTEMPTS = 5

/**
 * Delay before the next attempt after failure N (1-indexed attempt that just failed).
 * Index 0 = after attempt 1 fails, index 4 = after attempt 4 fails.
 */
export const RETRY_DELAYS_MS = [10_000, 30_000, 120_000, 600_000, 1_800_000] as const

export function getWorkerConcurrency(): number {
  const configured = env.get('WORKER_CONCURRENCY')

  return configured ?? 10
}
