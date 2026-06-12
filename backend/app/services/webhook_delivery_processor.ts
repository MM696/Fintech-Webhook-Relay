import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import DeliveryAttempt from '#models/delivery_attempt'
import WebhookDelivery from '#models/webhook_delivery'
import WebhookEndpoint from '#models/webhook_endpoint'
import { EndpointRateLimiter } from '#services/endpoint_rate_limiter'
import { enqueueDeliveryJobDelayed } from '#services/webhook_queue_service'
import {
  buildDeliveryEnvelope,
  serializeDeliveryEnvelope,
} from '#utils/delivery_envelope'
import { formatSignatureHeader, signPayload } from '#utils/hmac'
import { getRetryDelayMs, parseRetryAfterMs } from '#utils/retry_schedule'
import { decryptSecret } from '#utils/secret_encryption'
import {
  HTTP_TIMEOUT_MS,
  MAX_DELIVERY_ATTEMPTS,
  RATE_LIMIT_DEFAULT_RETRY_MS,
} from '#config/worker'

export type DeliveryProcessorResult =
  | { outcome: 'completed' }
  | { outcome: 'delayed'; delayMs: number }
  | { outcome: 'skipped' }

export class WebhookDeliveryProcessor {
  constructor(private rateLimiter: EndpointRateLimiter = new EndpointRateLimiter()) {}

  async process(deliveryId: string): Promise<DeliveryProcessorResult> {
    const delivery = await WebhookDelivery.find(deliveryId)

    if (!delivery) {
      logger.warn({ deliveryId }, 'Delivery not found, skipping job')
      return { outcome: 'skipped' }
    }

    if (delivery.status === 'delivered' || delivery.status === 'abandoned') {
      logger.info(
        { deliveryId, endpointId: delivery.endpointId, status: delivery.status },
        'Delivery already terminal, skipping job'
      )
      return { outcome: 'skipped' }
    }

    const endpoint = await WebhookEndpoint.find(delivery.endpointId)

    if (!endpoint || !endpoint.isActive) {
      await this.markAbandoned(
        delivery,
        null,
        'Endpoint inactive or not found',
        delivery.attempts
      )
      return { outcome: 'completed' }
    }

    const rateLimit = await this.rateLimiter.check(endpoint.id)

    if (!rateLimit.allowed) {
      logger.info(
        {
          deliveryId,
          endpointId: endpoint.id,
          attempt: delivery.attempts,
          status: delivery.status,
          delayMs: rateLimit.retryAfterMs,
        },
        'Endpoint rate limit reached, delaying job'
      )

      return { outcome: 'delayed', delayMs: rateLimit.retryAfterMs }
    }

    const resumeStaleDelivery = delivery.status === 'delivering'
    const attemptNumber = resumeStaleDelivery ? delivery.attempts : delivery.attempts + 1

    if (!resumeStaleDelivery) {
      delivery.attempts = attemptNumber
    }

    delivery.status = 'delivering'
    delivery.nextAttemptAt = null
    await delivery.save()

    logger.info(
      {
        deliveryId: delivery.id,
        endpointId: endpoint.id,
        attempt: attemptNumber,
        status: 'delivering',
      },
      'Webhook delivery job started'
    )

    try {
      const envelope = buildDeliveryEnvelope(delivery)
      const rawBody = serializeDeliveryEnvelope(envelope)
      const secret = decryptSecret(endpoint.secret)
      const digest = signPayload(rawBody, secret)

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ezrah-Signature': formatSignatureHeader(digest),
          'X-Ezrah-Delivery-Id': delivery.id,
        },
        body: rawBody,
        signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      })

      await this.recordAttempt(delivery.id, attemptNumber, response.status, null)

      if (response.status >= 200 && response.status < 300) {
        await this.markDelivered(delivery, response.status, attemptNumber, endpoint.id)
        return { outcome: 'completed' }
      }

      if (response.status === 429) {
        const retryAfterMs = parseRetryAfterMs(
          response.headers.get('Retry-After'),
          RATE_LIMIT_DEFAULT_RETRY_MS
        )

        await this.handleRetryableFailure(
          delivery,
          response.status,
          'Rate limited (429)',
          attemptNumber,
          endpoint.id,
          retryAfterMs
        )

        return { outcome: 'completed' }
      }

      if (response.status >= 400 && response.status < 500) {
        await this.markAbandoned(
          delivery,
          response.status,
          `Non-retryable client error: HTTP ${response.status}`,
          attemptNumber,
          endpoint.id
        )
        return { outcome: 'completed' }
      }

      await this.handleRetryableFailure(
        delivery,
        response.status,
        `Server error: HTTP ${response.status}`,
        attemptNumber,
        endpoint.id
      )

      return { outcome: 'completed' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown delivery error'
      const isTimeout =
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')

      await this.recordAttempt(
        delivery.id,
        attemptNumber,
        null,
        isTimeout ? 'Request timeout' : message
      )

      await this.handleRetryableFailure(
        delivery,
        null,
        isTimeout ? 'Request timeout' : message,
        attemptNumber,
        endpoint.id
      )

      return { outcome: 'completed' }
    }
  }

  private async recordAttempt(
    deliveryId: string,
    attemptNumber: number,
    httpStatus: number | null,
    errorMessage: string | null
  ): Promise<void> {
    const existing = await DeliveryAttempt.query()
      .where('delivery_id', deliveryId)
      .where('attempt_number', attemptNumber)
      .first()

    if (existing) {
      return
    }

    await DeliveryAttempt.create({
      deliveryId,
      attemptNumber,
      httpStatus,
      errorMessage,
      attemptedAt: DateTime.now(),
    })
  }

  private async markDelivered(
    delivery: WebhookDelivery,
    httpStatus: number,
    attempt: number,
    endpointId: string
  ): Promise<void> {
    delivery.status = 'delivered'
    delivery.deliveredAt = DateTime.now()
    delivery.lastHttpStatus = httpStatus
    delivery.lastError = null
    delivery.nextAttemptAt = null
    await delivery.save()

    logger.info(
      {
        deliveryId: delivery.id,
        endpointId,
        attempt,
        status: 'delivered',
      },
      'Webhook delivery job succeeded'
    )
  }

  private async markAbandoned(
    delivery: WebhookDelivery,
    httpStatus: number | null,
    error: string,
    attempt: number,
    endpointId?: string
  ): Promise<void> {
    delivery.status = 'abandoned'
    delivery.lastHttpStatus = httpStatus
    delivery.lastError = error
    delivery.nextAttemptAt = null
    await delivery.save()

    logger.error(
      {
        deliveryId: delivery.id,
        endpointId: endpointId ?? delivery.endpointId,
        attempt,
        status: 'abandoned',
        error,
      },
      'Webhook delivery job abandoned'
    )
  }

  private async handleRetryableFailure(
    delivery: WebhookDelivery,
    httpStatus: number | null,
    error: string,
    attempt: number,
    endpointId: string,
    customDelayMs?: number
  ): Promise<void> {
    if (attempt >= MAX_DELIVERY_ATTEMPTS) {
      await this.markAbandoned(delivery, httpStatus, error, attempt, endpointId)
      return
    }

    const delayMs = customDelayMs ?? getRetryDelayMs(attempt)

    delivery.status = 'failed'
    delivery.lastHttpStatus = httpStatus
    delivery.lastError = error
    delivery.nextAttemptAt = DateTime.now().plus({ milliseconds: delayMs })
    await delivery.save()

    await enqueueDeliveryJobDelayed(delivery.id, delayMs)

    logger.warn(
      {
        deliveryId: delivery.id,
        endpointId,
        attempt,
        status: 'failed',
        nextAttemptAt: delivery.nextAttemptAt.toISO(),
        error,
      },
      'Webhook delivery job failed, scheduled retry'
    )
  }
}
