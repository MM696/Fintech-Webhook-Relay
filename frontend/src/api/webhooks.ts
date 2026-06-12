import { apiRequest } from './client'
import type {
  CreateEndpointPayload,
  DeliveryDetail,
  DeliveryListItem,
  IngestEventPayload,
  IngestEventResponse,
  MetricsResponse,
  WebhookEndpoint,
} from '../types/api'

export function listEndpoints(clientId: string): Promise<WebhookEndpoint[]> {
  const params = new URLSearchParams({ client_id: clientId })

  return apiRequest<WebhookEndpoint[]>(`/api/endpoints?${params.toString()}`)
}

export function createEndpoint(payload: CreateEndpointPayload): Promise<WebhookEndpoint> {
  return apiRequest<WebhookEndpoint>('/api/endpoints', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deactivateEndpoint(id: string): Promise<void> {
  return apiRequest<void>(`/api/endpoints/${id}`, {
    method: 'DELETE',
  })
}

export function ingestEvent(payload: IngestEventPayload): Promise<IngestEventResponse> {
  return apiRequest<IngestEventResponse>('/api/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listDeliveries(filters: {
  status?: string
  endpoint_id?: string
}): Promise<DeliveryListItem[]> {
  const params = new URLSearchParams()

  if (filters.status) {
    params.set('status', filters.status)
  }

  if (filters.endpoint_id) {
    params.set('endpoint_id', filters.endpoint_id)
  }

  const query = params.toString()

  return apiRequest<DeliveryListItem[]>(
    query ? `/api/deliveries?${query}` : '/api/deliveries'
  )
}

export function getDelivery(id: string): Promise<DeliveryDetail> {
  return apiRequest<DeliveryDetail>(`/api/deliveries/${id}`)
}

export function retryDelivery(id: string): Promise<{ message: string; delivery_id: string }> {
  return apiRequest<{ message: string; delivery_id: string }>(`/api/deliveries/${id}/retry`, {
    method: 'POST',
  })
}

export function getMetrics(): Promise<MetricsResponse> {
  return apiRequest<MetricsResponse>('/api/metrics')
}
