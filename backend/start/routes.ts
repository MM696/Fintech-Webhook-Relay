/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| Webhook relay API routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const EndpointsController = () => import('#controllers/endpoints_controller')
const EventsController = () => import('#controllers/events_controller')
const DeliveriesController = () => import('#controllers/deliveries_controller')
const MetricsController = () => import('#controllers/metrics_controller')

router.get('/health', () => {
  return { status: 'ok' }
})

router
  .group(() => {
    router.post('endpoints', [EndpointsController, 'store'])
    router.get('endpoints', [EndpointsController, 'index'])
    router.delete('endpoints/:id', [EndpointsController, 'destroy'])

    router.post('events', [EventsController, 'store'])

    router.get('deliveries', [DeliveriesController, 'index'])
    router.get('deliveries/:id', [DeliveriesController, 'show'])
    router.post('deliveries/:id/retry', [DeliveriesController, 'retry'])

    router.get('metrics', [MetricsController, 'show'])
  })
  .prefix('/api')
  .use(middleware.apiAuth())
