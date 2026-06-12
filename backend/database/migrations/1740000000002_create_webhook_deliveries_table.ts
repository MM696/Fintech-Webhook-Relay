import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'webhook_deliveries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table
        .uuid('endpoint_id')
        .notNullable()
        .references('id')
        .inTable('webhook_endpoints')
        .onDelete('CASCADE')
      table.string('event_type').notNullable()
      table.jsonb('payload').notNullable().defaultTo('{}')
      table
        .enum('status', ['pending', 'delivering', 'delivered', 'failed', 'abandoned'], {
          useNative: true,
          enumName: 'webhook_delivery_status',
          existingType: false,
        })
        .notNullable()
        .defaultTo('pending')
      table.integer('attempts').notNullable().defaultTo(0)
      table.timestamp('next_attempt_at', { useTz: true }).nullable()
      table.integer('last_http_status').nullable()
      table.text('last_error').nullable()
      table.timestamp('delivered_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      table.index(['status'])
      table.index(['endpoint_id'])
      table.index(['next_attempt_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS webhook_delivery_status')
  }
}
