import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'health.show': { paramsTuple?: []; params?: {} }
    'endpoints.store': { paramsTuple?: []; params?: {} }
    'endpoints.index': { paramsTuple?: []; params?: {} }
    'endpoints.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'events.store': { paramsTuple?: []; params?: {} }
    'deliveries.index': { paramsTuple?: []; params?: {} }
    'deliveries.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'deliveries.retry': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'metrics.show': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'health.show': { paramsTuple?: []; params?: {} }
    'endpoints.index': { paramsTuple?: []; params?: {} }
    'deliveries.index': { paramsTuple?: []; params?: {} }
    'deliveries.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'metrics.show': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'health.show': { paramsTuple?: []; params?: {} }
    'endpoints.index': { paramsTuple?: []; params?: {} }
    'deliveries.index': { paramsTuple?: []; params?: {} }
    'deliveries.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'metrics.show': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'endpoints.store': { paramsTuple?: []; params?: {} }
    'events.store': { paramsTuple?: []; params?: {} }
    'deliveries.retry': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'endpoints.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}