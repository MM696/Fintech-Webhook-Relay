import WebhookEndpoint from '#models/webhook_endpoint'
import { serializeEndpoint } from '#serializers/webhook'
import { encryptSecret } from '#utils/secret_encryption'
import { createEndpointValidator, listEndpointsValidator } from '#validators/webhook'
import type { HttpContext } from '@adonisjs/core/http'

export default class EndpointsController {
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createEndpointValidator)

    const endpoint = await WebhookEndpoint.create({
      clientId: payload.client_id,
      url: payload.url,
      secret: encryptSecret(payload.secret),
      eventTypes: payload.event_types,
      isActive: true,
    })

    return response.status(201).json(serializeEndpoint(endpoint))
  }

  async index({ request, response }: HttpContext) {
    const { client_id: clientId } = await request.validateUsing(listEndpointsValidator, {
      data: request.qs(),
    })

    const endpoints = await WebhookEndpoint.query()
      .where('client_id', clientId)
      .orderBy('created_at', 'desc')

    return response.json(endpoints.map(serializeEndpoint))
  }

  async destroy({ params, response }: HttpContext) {
    const endpoint = await WebhookEndpoint.find(params.id)

    if (!endpoint) {
      return response.status(404).json({ error: 'Endpoint not found' })
    }

    if (endpoint.isActive) {
      await endpoint.softDelete()
    }

    return response.noContent()
  }
}
