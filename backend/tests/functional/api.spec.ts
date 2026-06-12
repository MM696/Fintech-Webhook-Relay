import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('HTTP API', (group) => {
  group.setup(async () => {
    await testUtils.db().migrate()
  })

  test('GET /health reports dependency status', async ({ client }) => {
    const response = await client.get('/health')

    response.assertStatus(200)
    response.assertBody({
      status: 'ok',
      postgres: true,
      redis: true,
    })
  })

  test('GET /api/endpoints rejects missing bearer token', async ({ client }) => {
    const response = await client.get('/api/endpoints?client_id=acme')

    response.assertStatus(401)
  })

  test('POST /api/endpoints creates an endpoint when authorized', async ({ client }) => {
    const response = await client
      .post('/api/endpoints')
      .header('Authorization', `Bearer ${env.get('API_SECRET_KEY')}`)
      .json({
        client_id: 'acme',
        url: 'https://example.com/webhook',
        secret: 'signing-secret',
        event_types: ['payment.completed'],
      })

    if (response.status() !== 201) {
      throw new Error(`Expected 201, got ${response.status()}: ${JSON.stringify(response.body())}`)
    }

    response.assertStatus(201)
    response.assertBodyContains({
      client_id: 'acme',
      url: 'https://example.com/webhook',
      event_types: ['payment.completed'],
      is_active: true,
    })
  })
})
