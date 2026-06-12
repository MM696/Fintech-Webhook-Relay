import WebhookDelivery from '#models/webhook_delivery'
import { enqueueDeliveryJob } from '#services/webhook_queue_service'
import {
  serializeDeliveryDetail,
  serializeDeliveryListItem,
} from '#serializers/webhook'
import { listDeliveriesValidator } from '#validators/webhook'
import type { HttpContext } from '@adonisjs/core/http'

export default class DeliveriesController {
  async index({ request, response }: HttpContext) {
    const filters = await request.validateUsing(listDeliveriesValidator, {
      data: request.qs(),
    })

    const query = WebhookDelivery.query()
      .preload('endpoint')
      .orderBy('created_at', 'desc')

    if (filters.status) {
      query.where('status', filters.status)
    }

    if (filters.endpoint_id) {
      query.where('endpoint_id', filters.endpoint_id)
    }

    const deliveries = await query

    return response.json(deliveries.map(serializeDeliveryListItem))
  }

  async show({ params, response }: HttpContext) {
    const delivery = await WebhookDelivery.query()
      .where('id', params.id)
      .preload('endpoint')
      .preload('deliveryAttempts', (attemptQuery) => {
        attemptQuery.orderBy('attempt_number', 'asc')
      })
      .first()

    if (!delivery) {
      return response.status(404).json({ error: 'Delivery not found' })
    }

    return response.json(serializeDeliveryDetail(delivery))
  }

  async retry({ params, response }: HttpContext) {
    const delivery = await WebhookDelivery.find(params.id)

    if (!delivery) {
      return response.status(404).json({ error: 'Delivery not found' })
    }

    if (delivery.status === 'delivered') {
      return response.status(409).json({ error: 'Delivered deliveries cannot be retried' })
    }

    if (delivery.status !== 'failed' && delivery.status !== 'abandoned') {
      return response.status(409).json({
        error: 'Only failed or abandoned deliveries can be retried',
      })
    }

    delivery.status = 'pending'
    delivery.nextAttemptAt = null
    delivery.lastError = null
    await delivery.save()

    await enqueueDeliveryJob(delivery.id)

    return response.status(202).json({
      message: 'Accepted',
      delivery_id: delivery.id,
    })
  }
}
