/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  health: {
    show: typeof routes['health.show']
  }
  endpoints: {
    store: typeof routes['endpoints.store']
    index: typeof routes['endpoints.index']
    destroy: typeof routes['endpoints.destroy']
  }
  events: {
    store: typeof routes['events.store']
  }
  deliveries: {
    index: typeof routes['deliveries.index']
    show: typeof routes['deliveries.show']
    retry: typeof routes['deliveries.retry']
  }
  metrics: {
    show: typeof routes['metrics.show']
  }
}
