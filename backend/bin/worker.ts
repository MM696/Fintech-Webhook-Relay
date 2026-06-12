/*
|--------------------------------------------------------------------------
| BullMQ worker entrypoint
|--------------------------------------------------------------------------
|
| Boots the AdonisJS application (without HTTP server) and starts the
| webhook delivery worker as a separate process.
|
*/

await import('reflect-metadata')
const { Ignitor, prettyPrintError } = await import('@adonisjs/core')

const APP_ROOT = new URL('../', import.meta.url)

const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

const ignitor = new Ignitor(APP_ROOT, { importer: IMPORTER }).tap((app) => {
  app.booting(async () => {
    await import('#start/env')
  })

  app.listen('SIGTERM', async () => {
    const { stopWebhookDeliveryWorker } = await import('#workers/webhook_delivery_worker')
    const { closeWebhookDeliveryQueue } = await import('#services/webhook_queue_service')

    await stopWebhookDeliveryWorker()
    await closeWebhookDeliveryQueue()
    await app.terminate()
  })

  app.listenIf(app.managedByPm2, 'SIGINT', async () => {
    const { stopWebhookDeliveryWorker } = await import('#workers/webhook_delivery_worker')
    const { closeWebhookDeliveryQueue } = await import('#services/webhook_queue_service')

    await stopWebhookDeliveryWorker()
    await closeWebhookDeliveryQueue()
    await app.terminate()
  })
})

try {
  const app = ignitor.createApp('web')
  await app.init()
  await app.boot()

  await app.start(async () => {
    const { startWebhookDeliveryWorker } = await import('#workers/webhook_delivery_worker')
    await startWebhookDeliveryWorker()
  })
} catch (error) {
  process.exitCode = 1
  prettyPrintError(error)
}
