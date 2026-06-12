import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import WebhookDelivery from '#models/webhook_delivery'

export default class DeliveryAttempt extends BaseModel {
  static table = 'delivery_attempts'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare deliveryId: string

  @column()
  declare attemptNumber: number

  @column()
  declare httpStatus: number | null

  @column()
  declare errorMessage: string | null

  @column.dateTime()
  declare attemptedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => WebhookDelivery, {
    foreignKey: 'deliveryId',
  })
  declare delivery: BelongsTo<typeof WebhookDelivery>

  @beforeCreate()
  static assignUuid(attempt: DeliveryAttempt) {
    attempt.id = randomUUID()
  }
}
