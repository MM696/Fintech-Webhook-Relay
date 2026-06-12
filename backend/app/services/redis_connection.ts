import { Redis } from 'ioredis'
import env from '#start/env'

export function getRedisConnectionOptions() {
  return {
    host: env.get('REDIS_HOST'),
    port: env.get('REDIS_PORT'),
    maxRetriesPerRequest: null as null,
  }
}

/**
 * Creates a dedicated Redis client for auxiliary services (rate limiting).
 */
export function createAuxRedisConnection(): Redis {
  const options = getRedisConnectionOptions()

  return new Redis({
    host: options.host,
    port: options.port,
    maxRetriesPerRequest: null,
  })
}
