import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import WebhookDelivery from '#models/webhook_delivery'

export default class WebhookEndpoint extends BaseModel {
  static table = 'webhook_endpoints'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare clientId: string

  @column()
  declare url: string

  @column({
    serializeAs: null,
  })
  declare secret: string

  @column()
  declare eventTypes: string[]

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @hasMany(() => WebhookDelivery, {
    foreignKey: 'endpointId',
  })
  declare deliveries: HasMany<typeof WebhookDelivery>

  @beforeCreate()
  static assignUuid(endpoint: WebhookEndpoint) {
    endpoint.id = randomUUID()
  }

  async softDelete(): Promise<void> {
    this.isActive = false
    this.deletedAt = DateTime.now()
    await this.save()
  }
}
