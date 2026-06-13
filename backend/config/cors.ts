import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/cors'
import env from '#start/env'

function resolveCorsOrigin(): boolean | string | string[] {
  if (app.inDev) {
    return true
  }

  const configuredOrigin = env.get('CORS_ORIGIN')

  if (!configuredOrigin) {
    return []
  }

  const origins = configuredOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return origins.length === 1 ? origins[0] : origins
}

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  /**
   * Enable or disable CORS handling globally.
   */
  enabled: true,

  /**
   * In development, allow every origin to simplify local front/backend setup.
   * In production, allow origins from CORS_ORIGIN (comma-separated list).
   */
  origin: resolveCorsOrigin(),

  /**
   * HTTP methods accepted for cross-origin requests.
   */
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],

  /**
   * Reflect request headers by default. Use a string array to restrict
   * allowed headers.
   */
  headers: true,

  /**
   * Response headers exposed to the browser.
   */
  exposeHeaders: [],

  /**
   * Allow cookies/authorization headers on cross-origin requests.
   */
  credentials: true,

  /**
   * Cache CORS preflight response for N seconds.
   */
  maxAge: 90,
})

export default corsConfig
