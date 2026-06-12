import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import WebhookDelivery from '#models/webhook_delivery'
import { closeWebhookDeliveryQueue, getWebhookDeliveryQueue } from '#services/webhook_queue_service'

test.group('Event ingestion integration', (group) => {
  group.setup(async () => {
    await testUtils.db().migrate()
  })

  group.each.teardown(async () => {
    const queue = getWebhookDeliveryQueue()
    await queue.obliterate({ force: true })
    await closeWebhookDeliveryQueue()
  })

  test('POST /api/events creates delivery and enqueues BullMQ job', async ({ client, assert }) => {
    const authHeader = { Authorization: `Bearer ${env.get('API_SECRET_KEY')}` }

    const endpointResponse = await client
      .post('/api/endpoints')
      .headers(authHeader)
      .json({
        client_id: 'acme',
        url: 'https://example.com/webhook',
        secret: 'signing-secret',
        event_types: ['payment.completed'],
      })

    endpointResponse.assertStatus(201)

    const response = await client
      .post('/api/events')
      .headers(authHeader)
      .json({
        client_id: 'acme',
        event_type: 'payment.completed',
        payload: { amount: 100, currency: 'USD' },
      })

    response.assertStatus(202)
    response.assertBodyContains({ message: 'Accepted' })

    const body = response.body() as { delivery_ids: string[] }
    assert.lengthOf(body.delivery_ids, 1)

    const deliveryId = body.delivery_ids[0]!
    const delivery = await WebhookDelivery.find(deliveryId)

    assert.isNotNull(delivery)
    assert.equal(delivery!.status, 'pending')
    assert.equal(delivery!.eventType, 'payment.completed')
    assert.equal(delivery!.attempts, 0)
    assert.deepEqual(delivery!.payload, { amount: 100, currency: 'USD' })

    const jobs = await getWebhookDeliveryQueue().getJobs([
      'waiting',
      'delayed',
      'active',
      'prioritized',
    ])
    const queuedJob = jobs.find((job) => job.data.deliveryId === deliveryId)

    assert.isDefined(queuedJob)
    assert.equal(queuedJob!.name, 'deliver')
    assert.equal(queuedJob!.data.deliveryId, deliveryId)
  })
})
