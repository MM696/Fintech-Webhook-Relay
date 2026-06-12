import { test } from '@japa/runner'
import {
  WORKER_LOG_FIELDS,
  assertWorkerLogPayload,
  buildWorkerLogPayload,
} from '#utils/worker_logger'

test.group('Worker structured logging', () => {
  test('declares required structured log fields', ({ assert }) => {
    assert.deepEqual([...WORKER_LOG_FIELDS], ['deliveryId', 'endpointId', 'attempt', 'status'])
  })

  test('buildWorkerLogPayload always includes required fields', ({ assert }) => {
    const payload = buildWorkerLogPayload({
      deliveryId: 'delivery-1',
      endpointId: 'endpoint-1',
      attempt: 2,
      status: 'delivering',
    })

    for (const field of WORKER_LOG_FIELDS) {
      assert.property(payload, field)
    }

    assertWorkerLogPayload(payload)
  })

  test('assertWorkerLogPayload rejects incomplete bindings', ({ assert }) => {
    assert.throws(() => {
      assertWorkerLogPayload({
        deliveryId: 'delivery-1',
        endpointId: 'endpoint-1',
        attempt: 1,
      })
    }, /missing required field: status/)
  })
})
