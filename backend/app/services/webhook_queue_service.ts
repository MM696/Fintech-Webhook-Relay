import { Queue } from 'bullmq'
import {
  WEBHOOK_DELIVERY_QUEUE_NAME,
  type WebhookDeliveryJobPayload,
} from '#config/queue'
import { getRedisConnectionOptions } from '#services/redis_connection'

let deliveryQueue: Queue<WebhookDeliveryJobPayload> | null = null

export function getWebhookDeliveryQueue(): Queue<WebhookDeliveryJobPayload> {
  deliveryQueue ??= new Queue<WebhookDeliveryJobPayload>(WEBHOOK_DELIVERY_QUEUE_NAME, {
    connection: getRedisConnectionOptions(),
  })

  return deliveryQueue
}

export async function enqueueDeliveryJob(deliveryId: string): Promise<void> {
  await getWebhookDeliveryQueue().add('deliver', { deliveryId })
}

export async function enqueueDeliveryJobDelayed(
  deliveryId: string,
  delayMs: number
): Promise<void> {
  await getWebhookDeliveryQueue().add(
    'deliver',
    { deliveryId },
    {
      delay: delayMs,
    }
  )
}

export async function getQueueDepth(): Promise<number> {
  const counts = await getWebhookDeliveryQueue().getJobCounts(
    'waiting',
    'delayed',
    'active',
    'prioritized'
  )

  return (
    (counts.waiting ?? 0) +
    (counts.delayed ?? 0) +
    (counts.active ?? 0) +
    (counts.prioritized ?? 0)
  )
}

export async function closeWebhookDeliveryQueue(): Promise<void> {
  if (deliveryQueue) {
    await deliveryQueue.close()
    deliveryQueue = null
  }
}
