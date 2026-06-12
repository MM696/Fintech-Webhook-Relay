import { Redis } from 'ioredis'
import {
  ENDPOINT_RATE_LIMIT_MAX,
  ENDPOINT_RATE_LIMIT_WINDOW_SEC,
} from '#config/worker'
import { createAuxRedisConnection } from '#services/redis_connection'

export type RateLimitResult = {
  allowed: boolean
  retryAfterMs: number
}

/**
 * Fixed-window rate limiter: 20 outbound requests per endpoint per minute.
 */
export class EndpointRateLimiter {
  #redis: Redis

  constructor(redis?: Redis) {
    this.#redis = redis ?? createAuxRedisConnection()
  }

  async check(endpointId: string): Promise<RateLimitResult> {
    const key = `ratelimit:endpoint:${endpointId}`
    const count = await this.#redis.incr(key)

    if (count === 1) {
      await this.#redis.expire(key, ENDPOINT_RATE_LIMIT_WINDOW_SEC)
    }

    if (count > ENDPOINT_RATE_LIMIT_MAX) {
      const ttlSeconds = await this.#redis.ttl(key)
      const retryAfterMs = Math.max(ttlSeconds, 1) * 1000

      return {
        allowed: false,
        retryAfterMs,
      }
    }

    return {
      allowed: true,
      retryAfterMs: 0,
    }
  }

  async close(): Promise<void> {
    await this.#redis.quit()
  }
}
