import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class WebhookWorkerCommand extends BaseCommand {
  static commandName = 'webhook:worker'

  static description = 'Start the BullMQ webhook delivery worker process'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { startWebhookDeliveryWorker } = await import('#workers/webhook_delivery_worker')

    await startWebhookDeliveryWorker()

    this.logger.info('Webhook delivery worker is running. Press Ctrl+C to stop.')

    await new Promise<void>((resolve) => {
      const shutdown = async () => {
        const { stopWebhookDeliveryWorker } = await import('#workers/webhook_delivery_worker')
        const { closeWebhookDeliveryQueue } = await import('#services/webhook_queue_service')

        await stopWebhookDeliveryWorker()
        await closeWebhookDeliveryQueue()
        resolve()
      }

      process.once('SIGINT', shutdown)
      process.once('SIGTERM', shutdown)
    })
  }
}
