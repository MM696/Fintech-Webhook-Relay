import { createHmac } from 'node:crypto'

/**
 * Generates HMAC-SHA256 signature over the raw JSON request body.
 */
export function signPayload(rawBody: string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex')
}

/**
 * Formats the signature for the X-Ezrah-Signature header.
 */
export function formatSignatureHeader(digest: string): string {
  return `sha256=${digest}`
}
