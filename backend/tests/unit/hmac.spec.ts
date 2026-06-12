import { test } from '@japa/runner'
import { formatSignatureHeader, signPayload } from '#utils/hmac'

test.group('HMAC signing', () => {
  test('produces deterministic sha256 digest for raw JSON body', ({ assert }) => {
    const body = '{"id":"abc","event_type":"payment.completed","payload":{}}'
    const digest = signPayload(body, 'test-secret')

    assert.match(digest, /^[a-f0-9]{64}$/)
    assert.equal(signPayload(body, 'test-secret'), digest)
    assert.notEqual(signPayload(body, 'other-secret'), digest)
  })

  test('formats X-Ezrah-Signature header value', ({ assert }) => {
    assert.equal(formatSignatureHeader('abc123'), 'sha256=abc123')
  })
})
