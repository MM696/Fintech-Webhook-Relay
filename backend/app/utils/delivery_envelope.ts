import type WebhookDelivery from '#models/webhook_delivery'

export type DeliveryEnvelope = {
  id: string
  event_type: string
  created_at: string
  payload: Record<string, unknown>
}

export function buildDeliveryEnvelope(delivery: WebhookDelivery): DeliveryEnvelope {
  return {
    id: delivery.id,
    event_type: delivery.eventType,
    created_at: delivery.createdAt.toISO()!,
    payload: delivery.payload,
  }
}

export function serializeDeliveryEnvelope(envelope: DeliveryEnvelope): string {
  return JSON.stringify(envelope)
}
