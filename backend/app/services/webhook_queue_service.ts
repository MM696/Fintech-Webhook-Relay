import { Queue } from 'bullmq'
import env from '#start/env'
import {
  WEBHOOK_DELIVERY_QUEUE_NAME,
  type WebhookDeliveryJobPayload,
} from '#config/queue'

let deliveryQueue: Queue<WebhookDeliveryJobPayload> | null = null

function getConnectionOptions() {
  return {
    host: env.get('REDIS_HOST'),
    port: env.get('REDIS_PORT'),
  }
}

export function getWebhookDeliveryQueue(): Queue<WebhookDeliveryJobPayload> {
  if (!deliveryQueue) {
    deliveryQueue = new Queue<WebhookDeliveryJobPayload>(WEBHOOK_DELIVERY_QUEUE_NAME, {
      connection: getConnectionOptions(),
    })
  }

  return deliveryQueue
}

export async function enqueueDeliveryJob(deliveryId: string): Promise<void> {
  await getWebhookDeliveryQueue().add('deliver', { deliveryId })
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
