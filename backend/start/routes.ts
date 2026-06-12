/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| Webhook relay API routes. Business endpoints are added in Phase 2.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router.get('/health', () => {
  return { status: 'ok' }
})

router
  .group(() => {
    // Phase 2: endpoints, events, deliveries, metrics
  })
  .prefix('/api')
  .use(middleware.apiAuth())
