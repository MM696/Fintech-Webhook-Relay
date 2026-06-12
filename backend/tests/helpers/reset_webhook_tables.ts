import db from '@adonisjs/lucid/services/db'

/**
 * Clears webhook-related tables between functional tests.
 * Order uses CASCADE so FK constraints are respected.
 */
export async function resetWebhookTables(): Promise<void> {
  await db.rawQuery(
    'TRUNCATE TABLE delivery_attempts, webhook_deliveries, webhook_endpoints RESTART IDENTITY CASCADE'
  )
}
