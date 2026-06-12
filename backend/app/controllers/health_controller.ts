import { getHealthStatus } from '#services/health_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class HealthController {
  async show({ response }: HttpContext) {
    const health = await getHealthStatus()
    const httpStatus = health.status === 'ok' ? 200 : 503

    return response.status(httpStatus).json(health)
  }
}
