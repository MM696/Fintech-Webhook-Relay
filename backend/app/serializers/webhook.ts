import type { DateTime } from 'luxon'
import type DeliveryAttempt from '#models/delivery_attempt'
import type WebhookDelivery from '#models/webhook_delivery'
import type WebhookEndpoint from '#models/webhook_endpoint'

function toIso(value: DateTime | null): string | null {
  return value ? value.toISO() : null
}

export function serializeEndpoint(endpoint: WebhookEndpoint) {
  return {
    id: endpoint.id,
    client_id: endpoint.clientId,
    url: endpoint.url,
    event_types: endpoint.eventTypes,
    is_active: endpoint.isActive,
    created_at: endpoint.createdAt.toISO(),
    updated_at: endpoint.updatedAt.toISO(),
    deleted_at: toIso(endpoint.deletedAt),
  }
}

export function serializeEndpointSummary(endpoint: WebhookEndpoint) {
  return {
    id: endpoint.id,
    client_id: endpoint.clientId,
    url: endpoint.url,
    event_types: endpoint.eventTypes,
    is_active: endpoint.isActive,
  }
}

export function serializeDeliveryAttempt(attempt: DeliveryAttempt) {
  return {
    id: attempt.id,
    attempt_number: attempt.attemptNumber,
    http_status: attempt.httpStatus,
    error_message: attempt.errorMessage,
    attempted_at: attempt.attemptedAt.toISO(),
    created_at: attempt.createdAt.toISO(),
  }
}

export function serializeDeliveryListItem(delivery: WebhookDelivery) {
  return {
    id: delivery.id,
    endpoint_id: delivery.endpointId,
    endpoint_url: delivery.endpoint?.url ?? null,
    event_type: delivery.eventType,
    status: delivery.status,
    attempts: delivery.attempts,
    last_http_status: delivery.lastHttpStatus,
    next_attempt_at: toIso(delivery.nextAttemptAt),
    delivered_at: toIso(delivery.deliveredAt),
    updated_at: delivery.updatedAt.toISO(),
    created_at: delivery.createdAt.toISO(),
  }
}

export function serializeDeliveryDetail(delivery: WebhookDelivery) {
  const attempts = delivery.deliveryAttempts ?? []

  return {
    id: delivery.id,
    endpoint_id: delivery.endpointId,
    event_type: delivery.eventType,
    payload: delivery.payload,
    status: delivery.status,
    attempts: delivery.attempts,
    next_attempt_at: toIso(delivery.nextAttemptAt),
    last_http_status: delivery.lastHttpStatus,
    last_error: delivery.lastError,
    delivered_at: toIso(delivery.deliveredAt),
    created_at: delivery.createdAt.toISO(),
    updated_at: delivery.updatedAt.toISO(),
    endpoint: delivery.endpoint ? serializeEndpointSummary(delivery.endpoint) : null,
    attempt_history: attempts.map(serializeDeliveryAttempt),
  }
}
