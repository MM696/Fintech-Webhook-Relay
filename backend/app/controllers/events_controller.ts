import WebhookDelivery from '#models/webhook_delivery'
import WebhookEndpoint from '#models/webhook_endpoint'
import { enqueueDeliveryJob } from '#services/webhook_queue_service'
import { ingestEventValidator } from '#validators/webhook'
import type { HttpContext } from '@adonisjs/core/http'

export default class EventsController {
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(ingestEventValidator)

    const endpoints = await WebhookEndpoint.query()
      .where('client_id', payload.client_id)
      .where('is_active', true)
      .whereRaw('event_types @> ?::jsonb', [JSON.stringify([payload.event_type])])

    const deliveryIds: string[] = []

    for (const endpoint of endpoints) {
      const delivery = await WebhookDelivery.create({
        endpointId: endpoint.id,
        eventType: payload.event_type,
        payload: payload.payload,
        status: 'pending',
        attempts: 0,
      })

      deliveryIds.push(delivery.id)
      await enqueueDeliveryJob(delivery.id)
    }

    return response.status(202).json({
      message: 'Accepted',
      delivery_ids: deliveryIds,
    })
  }
}
