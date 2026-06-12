export type DeliveryStatus =
  | 'pending'
  | 'delivering'
  | 'delivered'
  | 'failed'
  | 'abandoned'

export interface WebhookEndpoint {
  id: string
  client_id: string
  url: string
  event_types: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CreateEndpointPayload {
  client_id: string
  url: string
  secret: string
  event_types: string[]
}

export interface IngestEventPayload {
  client_id: string
  event_type: string
  payload: Record<string, unknown>
}

export interface IngestEventResponse {
  message: string
  delivery_ids: string[]
}

export interface DeliveryListItem {
  id: string
  endpoint_id: string
  endpoint_url: string | null
  event_type: string
  status: DeliveryStatus
  attempts: number
  last_http_status: number | null
  next_attempt_at: string | null
  delivered_at: string | null
  updated_at: string
  created_at: string
}

export interface DeliveryAttempt {
  id: string
  attempt_number: number
  http_status: number | null
  error_message: string | null
  attempted_at: string
  created_at: string
}

export interface DeliveryDetail {
  id: string
  endpoint_id: string
  event_type: string
  payload: Record<string, unknown>
  status: DeliveryStatus
  attempts: number
  next_attempt_at: string | null
  last_http_status: number | null
  last_error: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
  endpoint: {
    id: string
    client_id: string
    url: string
    event_types: string[]
    is_active: boolean
  } | null
  attempt_history: DeliveryAttempt[]
}

export interface MetricsResponse {
  queue_depth: number
  delivered_count: number
  abandoned_count: number
}

export interface FieldErrors {
  [field: string]: string[]
}
