export const DELIVERY_STATUSES = [
  'pending',
  'delivering',
  'delivered',
  'failed',
  'abandoned',
] as const

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number]

export function isDeliveryStatus(value: string): value is DeliveryStatus {
  return DELIVERY_STATUSES.includes(value as DeliveryStatus)
}
