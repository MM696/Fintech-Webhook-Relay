import { test } from '@japa/runner'
import { jsonbColumn } from '#utils/jsonb_column'

test.group('JSONB column helper', () => {
  test('serializes arrays for PostgreSQL jsonb storage', ({ assert }) => {
    const column = jsonbColumn<string[]>()

    assert.equal(column.prepare(['payment.completed']), '["payment.completed"]')
  })

  test('deserializes jsonb strings from PostgreSQL', ({ assert }) => {
    const column = jsonbColumn<Record<string, unknown>>()

    assert.deepEqual(column.consume('{"amount":100}'), { amount: 100 })
  })
})
