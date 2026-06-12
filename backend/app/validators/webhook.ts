import vine from '@vinejs/vine'
import { DELIVERY_STATUSES } from '#types/delivery_status'

export const createEndpointValidator = vine.compile(
  vine.object({
    client_id: vine.string().trim().minLength(1),
    url: vine.string().trim().url(),
    secret: vine.string().trim().minLength(1),
    event_types: vine.array(vine.string().trim().minLength(1)).minLength(1),
  })
)

export const ingestEventValidator = vine.compile(
  vine.object({
    client_id: vine.string().trim().minLength(1),
    event_type: vine.string().trim().minLength(1),
    payload: vine.object({}).allowUnknownProperties(),
  })
)

export const listEndpointsValidator = vine.compile(
  vine.object({
    client_id: vine.string().trim().minLength(1),
  })
)

export const listDeliveriesValidator = vine.compile(
  vine.object({
    status: vine.enum(DELIVERY_STATUSES).optional(),
    endpoint_id: vine.string().uuid().optional(),
  })
)
