/**
 * Lucid column helpers for PostgreSQL JSONB.
 *
 * node-pg maps JavaScript arrays to PostgreSQL ARRAY types, not JSONB.
 * Explicit JSON serialization is required for jsonb columns.
 */
export function jsonbColumn<T>() {
  return {
    prepare: (value: T) => JSON.stringify(value),
    consume: (value: T | string) => {
      if (typeof value === 'string') {
        return JSON.parse(value) as T
      }

      return value
    },
  }
}
