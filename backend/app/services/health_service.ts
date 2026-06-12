import db from '@adonisjs/lucid/services/db'
import { createAuxRedisConnection } from '#services/redis_connection'

export type HealthCheckResult = {
  status: 'ok' | 'degraded'
  postgres: boolean
  redis: boolean
}

async function checkPostgres(): Promise<boolean> {
  try {
    await db.rawQuery('SELECT 1 AS ok')
    return true
  } catch {
    return false
  }
}

async function checkRedis(): Promise<boolean> {
  const redis = createAuxRedisConnection()

  try {
    const response = await redis.ping()
    return response === 'PONG'
  } catch {
    return false
  } finally {
    await redis.quit()
  }
}

export async function getHealthStatus(): Promise<HealthCheckResult> {
  const [postgres, redis] = await Promise.all([checkPostgres(), checkRedis()])

  return {
    status: postgres && redis ? 'ok' : 'degraded',
    postgres,
    redis,
  }
}
