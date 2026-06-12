import WebhookDelivery from '#models/webhook_delivery'
import { getQueueDepth } from '#services/webhook_queue_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class MetricsController {
  async show({ response }: HttpContext) {
    const [queueDepth, deliveredCount, abandonedCount] = await Promise.all([
      getQueueDepth(),
      WebhookDelivery.query().where('status', 'delivered').count('* as total'),
      WebhookDelivery.query().where('status', 'abandoned').count('* as total'),
    ])

    return response.json({
      queue_depth: queueDepth,
      delivered_count: Number(deliveredCount[0]?.$extras.total ?? 0),
      abandoned_count: Number(abandonedCount[0]?.$extras.total ?? 0),
    })
  }
}
