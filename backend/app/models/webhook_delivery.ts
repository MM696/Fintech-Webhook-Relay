import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DeliveryStatus } from '#types/delivery_status'
import { jsonbColumn } from '#utils/jsonb_column'
import DeliveryAttempt from '#models/delivery_attempt'
import WebhookEndpoint from '#models/webhook_endpoint'

export default class WebhookDelivery extends BaseModel {
  static table = 'webhook_deliveries'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare endpointId: string

  @column()
  declare eventType: string

  @column(jsonbColumn<Record<string, unknown>>())
  declare payload: Record<string, unknown>

  @column()
  declare status: DeliveryStatus

  @column()
  declare attempts: number

  @column.dateTime()
  declare nextAttemptAt: DateTime | null

  @column()
  declare lastHttpStatus: number | null

  @column()
  declare lastError: string | null

  @column.dateTime()
  declare deliveredAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => WebhookEndpoint, {
    foreignKey: 'endpointId',
  })
  declare endpoint: BelongsTo<typeof WebhookEndpoint>

  @hasMany(() => DeliveryAttempt, {
    foreignKey: 'deliveryId',
  })
  declare deliveryAttempts: HasMany<typeof DeliveryAttempt>

  @beforeCreate()
  static assignUuid(delivery: WebhookDelivery) {
    delivery.id = randomUUID()
  }
}
