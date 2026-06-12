import { test } from '@japa/runner'
import { getRetryDelayMs, parseRetryAfterMs } from '#utils/retry_schedule'
import { RETRY_DELAYS_MS } from '#config/worker'

test.group('Retry schedule', () => {
  test('returns configured delay for each failed attempt', ({ assert }) => {
    assert.equal(getRetryDelayMs(1), RETRY_DELAYS_MS[0])
    assert.equal(getRetryDelayMs(2), RETRY_DELAYS_MS[1])
    assert.equal(getRetryDelayMs(3), RETRY_DELAYS_MS[2])
    assert.equal(getRetryDelayMs(4), RETRY_DELAYS_MS[3])
  })

  test('parses Retry-After seconds header', ({ assert }) => {
    assert.equal(parseRetryAfterMs('30', 60_000), 30_000)
  })

  test('falls back to default when Retry-After is missing', ({ assert }) => {
    assert.equal(parseRetryAfterMs(null, 60_000), 60_000)
  })

  test('parses Retry-After HTTP-date header', ({ assert }) => {
    const future = new Date(Date.now() + 45_000).toUTCString()
    const delay = parseRetryAfterMs(future, 60_000)

    assert.isAtLeast(delay, 40_000)
    assert.isAtMost(delay, 50_000)
  })
})
