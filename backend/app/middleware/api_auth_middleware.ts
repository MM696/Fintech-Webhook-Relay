import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'

/**
 * Validates Bearer token against API_SECRET_KEY for all /api routes.
 */
export default class ApiAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const authorization = ctx.request.header('authorization')

    if (!authorization?.startsWith('Bearer ')) {
      return ctx.response.status(401).json({ error: 'Unauthorized' })
    }

    const token = authorization.slice('Bearer '.length).trim()
    const expectedToken = env.get('API_SECRET_KEY')

    if (!token || token !== expectedToken) {
      return ctx.response.status(401).json({ error: 'Unauthorized' })
    }

    return next()
  }
}
