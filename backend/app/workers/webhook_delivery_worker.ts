import { DelayedError, Worker, type Job } from 'bullmq'
import logger from '@adonisjs/core/services/logger'
import WebhookDelivery from '#models/webhook_delivery'
import { WEBHOOK_DELIVERY_QUEUE_NAME, type WebhookDeliveryJobPayload } from '#config/queue'
import { getWorkerConcurrency } from '#config/worker'
import { WebhookDeliveryProcessor } from '#services/webhook_delivery_processor'
import { getRedisConnectionOptions } from '#services/redis_connection'
import { logJobUnexpectedFailure } from '#utils/worker_logger'

let worker: Worker<WebhookDeliveryJobPayload> | null = null
let processor: WebhookDeliveryProcessor | null = null

export async function startWebhookDeliveryWorker(): Promise<Worker<WebhookDeliveryJobPayload>> {
  if (worker) {
    return worker
  }

  processor = new WebhookDeliveryProcessor()

  worker = new Worker<WebhookDeliveryJobPayload>(
    WEBHOOK_DELIVERY_QUEUE_NAME,
    async (job: Job<WebhookDeliveryJobPayload>) => {
      const result = await processor!.process(job.data.deliveryId)

      if (result.outcome === 'delayed') {
        await job.moveToDelayed(Date.now() + result.delayMs)
        throw new DelayedError()
      }
    },
    {
      connection: getRedisConnectionOptions(),
      concurrency: getWorkerConcurrency(),
    }
  )

  worker.on('failed', async (job, error) => {
    if (error instanceof DelayedError) {
      return
    }

    const deliveryId = job?.data.deliveryId ?? 'unknown'
    const delivery = deliveryId !== 'unknown' ? await WebhookDelivery.find(deliveryId) : null

    logJobUnexpectedFailure(
      {
        deliveryId,
        endpointId: delivery?.endpointId ?? 'unknown',
        attempt: delivery?.attempts ?? 0,
        status: delivery?.status ?? 'failed',
      },
      error.message
    )
  })

  worker.on('error', (error) => {
    logger.error({ error: error.message }, 'Webhook delivery worker error')
  })

  logger.info(
    {
      queue: WEBHOOK_DELIVERY_QUEUE_NAME,
      concurrency: getWorkerConcurrency(),
    },
    'Webhook delivery worker started'
  )

  return worker
}

export async function stopWebhookDeliveryWorker(): Promise<void> {
  if (worker) {
    await worker.close()
    worker = null
  }

  processor = null
}
