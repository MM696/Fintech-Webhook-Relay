import { test } from '@japa/runner'
import { DELIVERY_STATUSES, isDeliveryStatus } from '#types/delivery_status'

test.group('Delivery status', () => {
  test('recognizes valid delivery statuses', ({ assert }) => {
    for (const status of DELIVERY_STATUSES) {
      assert.isTrue(isDeliveryStatus(status))
    }
  })

  test('rejects unknown statuses', ({ assert }) => {
    assert.isFalse(isDeliveryStatus('unknown'))
    assert.isFalse(isDeliveryStatus(''))
  })
})
