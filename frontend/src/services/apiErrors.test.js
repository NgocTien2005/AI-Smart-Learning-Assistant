import assert from 'node:assert/strict'
import test from 'node:test'
import { isSessionExpiration, readApiError } from './apiErrors.js'

test('maps an nginx HTML 413 response to a useful upload error', async () => {
  const error = await readApiError(new Response('<html>Request Entity Too Large</html>', {
    status: 413,
    headers: { 'content-type': 'text/html' },
  }))
  assert.equal(error.status, 413)
  assert.equal(error.code, 'UPLOAD_TOO_LARGE')
  assert.match(error.message, /10 MiB/)
})

test('preserves API error status and code without expiring the session', async () => {
  const error = await readApiError(new Response(JSON.stringify({ code: 'CURRENT_PASSWORD_INVALID', error: 'Mật khẩu hiện tại không đúng' }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  }))
  assert.equal(error.status, 400)
  assert.equal(error.code, 'CURRENT_PASSWORD_INVALID')
  assert.equal(isSessionExpiration(error), false)
})

test('only explicit authentication errors expire the current session', async () => {
  const badCredentials = await readApiError(new Response(JSON.stringify({ code: 'INVALID_CREDENTIALS', error: 'Sai thông tin' }), { status: 401 }))
  const expired = await readApiError(new Response(JSON.stringify({ code: 'SESSION_INVALID', error: 'Hết hạn' }), { status: 401 }))
  assert.equal(isSessionExpiration(badCredentials), false)
  assert.equal(isSessionExpiration(expired), true)
})
