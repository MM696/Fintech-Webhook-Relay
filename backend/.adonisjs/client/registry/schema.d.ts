/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'health.show': {
    methods: ["GET","HEAD"]
    pattern: '/health'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/health_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/health_controller').default['show']>>>
    }
  }
  'endpoints.store': {
    methods: ["POST"]
    pattern: '/api/endpoints'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/webhook').createEndpointValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/webhook').createEndpointValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/endpoints_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/endpoints_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'endpoints.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/endpoints'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/webhook').listEndpointsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/endpoints_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/endpoints_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'endpoints.destroy': {
    methods: ["DELETE"]
    pattern: '/api/endpoints/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/endpoints_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/endpoints_controller').default['destroy']>>>
    }
  }
  'events.store': {
    methods: ["POST"]
    pattern: '/api/events'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/webhook').ingestEventValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/webhook').ingestEventValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/events_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/events_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'deliveries.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/deliveries'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/webhook').listDeliveriesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/deliveries_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/deliveries_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'deliveries.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/deliveries/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/deliveries_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/deliveries_controller').default['show']>>>
    }
  }
  'deliveries.retry': {
    methods: ["POST"]
    pattern: '/api/deliveries/:id/retry'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/deliveries_controller').default['retry']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/deliveries_controller').default['retry']>>>
    }
  }
  'metrics.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/metrics'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/metrics_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/metrics_controller').default['show']>>>
    }
  }
}
