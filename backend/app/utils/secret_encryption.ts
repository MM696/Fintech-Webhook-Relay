import encryption from '@adonisjs/core/services/encryption'

/**
 * Encrypts a webhook endpoint secret for at-rest storage using AES-256-GCM
 * (AdonisJS encryption driver backed by APP_KEY).
 *
 * Secrets must remain reversible (not hashed) so HMAC signatures can be
 * generated at delivery time.
 */
export function encryptSecret(plaintext: string): string {
  return encryption.encrypt(plaintext)
}

/**
 * Decrypts a stored webhook endpoint secret.
 */
export function decryptSecret(ciphertext: string): string {
  const decrypted = encryption.decrypt<string>(ciphertext)

  if (typeof decrypted !== 'string') {
    throw new Error('Decrypted webhook secret is not a string')
  }

  return decrypted
}
