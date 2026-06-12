import logger from '@adonisjs/core/services/logger'
import type { DeliveryStatus } from '#types/delivery_status'

export const WORKER_LOG_FIELDS = ['deliveryId', 'endpointId', 'attempt', 'status'] as const

export type WorkerLogField = (typeof WORKER_LOG_FIELDS)[number]

export type WorkerLogPayload = Record<WorkerLogField, string | number> & {
  deliveryId: string
  endpointId: string
  attempt: number
  status: DeliveryStatus | 'skipped'
}

export function buildWorkerLogPayload(input: WorkerLogPayload): WorkerLogPayload {
  return {
    deliveryId: input.deliveryId,
    endpointId: input.endpointId,
    attempt: input.attempt,
    status: input.status,
  }
}

export function assertWorkerLogPayload(
  payload: Record<string, unknown>
): asserts payload is WorkerLogPayload {
  for (const field of WORKER_LOG_FIELDS) {
    if (!(field in payload)) {
      throw new Error(`Worker log payload missing required field: ${field}`)
    }
  }
}

type WorkerLogLevel = 'info' | 'warn' | 'error'

function emitWorkerLog(
  level: WorkerLogLevel,
  payload: WorkerLogPayload,
  message: string,
  extra?: Record<string, unknown>
): void {
  assertWorkerLogPayload(payload)
  logger[level]({ ...payload, ...extra }, message)
}

export function logJobStart(payload: WorkerLogPayload): void {
  emitWorkerLog('info', buildWorkerLogPayload(payload), 'Webhook delivery job started')
}

export function logJobSuccess(payload: WorkerLogPayload): void {
  emitWorkerLog(
    'info',
    buildWorkerLogPayload({ ...payload, status: 'delivered' }),
    'Webhook delivery job succeeded'
  )
}

export function logJobRetryScheduled(
  payload: WorkerLogPayload,
  extra: { nextAttemptAt: string | null; error: string }
): void {
  emitWorkerLog(
    'warn',
    buildWorkerLogPayload({ ...payload, status: 'failed' }),
    'Webhook delivery job failed, scheduled retry',
    extra
  )
}

export function logJobAbandoned(payload: WorkerLogPayload, error: string): void {
  emitWorkerLog(
    'error',
    buildWorkerLogPayload({ ...payload, status: 'abandoned' }),
    'Webhook delivery job abandoned',
    { error }
  )
}

export function logJobSkipped(payload: WorkerLogPayload, reason: string): void {
  emitWorkerLog(
    'info',
    buildWorkerLogPayload({ ...payload, status: 'skipped' }),
    'Webhook delivery job skipped',
    { reason }
  )
}

export function logJobRateLimited(payload: WorkerLogPayload, extra: { delayMs: number }): void {
  emitWorkerLog(
    'info',
    buildWorkerLogPayload(payload),
    'Endpoint rate limit reached, delaying job',
    extra
  )
}

export function logJobUnexpectedFailure(payload: WorkerLogPayload, error: string): void {
  emitWorkerLog(
    'error',
    buildWorkerLogPayload({ ...payload, status: 'failed' }),
    'Webhook delivery worker job failed unexpectedly',
    { error }
  )
}

export function logDeliveryNotFound(deliveryId: string): void {
  emitWorkerLog(
    'warn',
    {
      deliveryId,
      endpointId: 'unknown',
      attempt: 0,
      status: 'skipped',
    },
    'Delivery not found, skipping job'
  )
}
