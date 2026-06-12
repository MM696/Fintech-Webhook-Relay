import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'delivery_attempts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table
        .uuid('delivery_id')
        .notNullable()
        .references('id')
        .inTable('webhook_deliveries')
        .onDelete('CASCADE')
      table.integer('attempt_number').notNullable()
      table.integer('http_status').nullable()
      table.text('error_message').nullable()
      table.timestamp('attempted_at', { useTz: true }).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      table.index(['delivery_id'])
      table.unique(['delivery_id', 'attempt_number'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
