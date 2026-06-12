import { RETRY_DELAYS_MS } from '#config/worker'

/**
 * Returns retry delay in milliseconds after a failed attempt.
 */
export function getRetryDelayMs(failedAttemptNumber: number): number {
  const index = failedAttemptNumber - 1

  if (index < 0 || index >= RETRY_DELAYS_MS.length) {
    return RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]!
  }

  return RETRY_DELAYS_MS[index]!
}

/**
 * Parses Retry-After header (seconds or HTTP-date) into milliseconds.
 */
export function parseRetryAfterMs(header: string | null, defaultMs: number): number {
  if (!header) {
    return defaultMs
  }

  const asSeconds = Number(header)

  if (!Number.isNaN(asSeconds)) {
    return Math.max(0, asSeconds * 1000)
  }

  const asDate = Date.parse(header)

  if (!Number.isNaN(asDate)) {
    return Math.max(0, asDate - Date.now())
  }

  return defaultMs
}
