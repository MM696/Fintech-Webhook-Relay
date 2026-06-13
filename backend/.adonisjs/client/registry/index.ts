/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'health.show': {
    methods: ["GET","HEAD"],
    pattern: '/health',
    tokens: [{"old":"/health","type":0,"val":"health","end":""}],
    types: placeholder as Registry['health.show']['types'],
  },
  'endpoints.store': {
    methods: ["POST"],
    pattern: '/api/endpoints',
    tokens: [{"old":"/api/endpoints","type":0,"val":"api","end":""},{"old":"/api/endpoints","type":0,"val":"endpoints","end":""}],
    types: placeholder as Registry['endpoints.store']['types'],
  },
  'endpoints.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/endpoints',
    tokens: [{"old":"/api/endpoints","type":0,"val":"api","end":""},{"old":"/api/endpoints","type":0,"val":"endpoints","end":""}],
    types: placeholder as Registry['endpoints.index']['types'],
  },
  'endpoints.destroy': {
    methods: ["DELETE"],
    pattern: '/api/endpoints/:id',
    tokens: [{"old":"/api/endpoints/:id","type":0,"val":"api","end":""},{"old":"/api/endpoints/:id","type":0,"val":"endpoints","end":""},{"old":"/api/endpoints/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['endpoints.destroy']['types'],
  },
  'events.store': {
    methods: ["POST"],
    pattern: '/api/events',
    tokens: [{"old":"/api/events","type":0,"val":"api","end":""},{"old":"/api/events","type":0,"val":"events","end":""}],
    types: placeholder as Registry['events.store']['types'],
  },
  'deliveries.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/deliveries',
    tokens: [{"old":"/api/deliveries","type":0,"val":"api","end":""},{"old":"/api/deliveries","type":0,"val":"deliveries","end":""}],
    types: placeholder as Registry['deliveries.index']['types'],
  },
  'deliveries.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/deliveries/:id',
    tokens: [{"old":"/api/deliveries/:id","type":0,"val":"api","end":""},{"old":"/api/deliveries/:id","type":0,"val":"deliveries","end":""},{"old":"/api/deliveries/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['deliveries.show']['types'],
  },
  'deliveries.retry': {
    methods: ["POST"],
    pattern: '/api/deliveries/:id/retry',
    tokens: [{"old":"/api/deliveries/:id/retry","type":0,"val":"api","end":""},{"old":"/api/deliveries/:id/retry","type":0,"val":"deliveries","end":""},{"old":"/api/deliveries/:id/retry","type":1,"val":"id","end":""},{"old":"/api/deliveries/:id/retry","type":0,"val":"retry","end":""}],
    types: placeholder as Registry['deliveries.retry']['types'],
  },
  'metrics.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/metrics',
    tokens: [{"old":"/api/metrics","type":0,"val":"api","end":""},{"old":"/api/metrics","type":0,"val":"metrics","end":""}],
    types: placeholder as Registry['metrics.show']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
