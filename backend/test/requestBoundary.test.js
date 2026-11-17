import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { gzipSync } from 'node:zlib'

process.env.DATABASE_URL = 'postgresql://unused:unused@127.0.0.1:1/unused'
process.env.JWT_SECRET = 'unit-only-boundary-secret'
const { createApp } = await import('../src/app.js')
const { prisma } = await import('../src/lib/prisma.js')

test('production boundary rejects absent/array/null/scalar JSON before DB; handles syntax/size and response headers', async t => {
  const server = createApp().listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await prisma.$disconnect() })
  const base = `http://127.0.0.1:${server.address().port}`
  for (const path of ['/login', '/register', '/forgot-password', '/reset-password']) {
    for (const body of [undefined, '[]', 'null', '"scalar"', '12', '{']) {
      const response = await fetch(base + '/api/auth' + path, { method: 'POST', ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body }) })
      assert.equal(response.status, 400, path + '/' + (body ?? 'absent'))
      const result = await response.json()
      assert.equal(typeof result.error, 'string')
      assert.equal(response.headers.get('x-powered-by'), null)
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
      assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
      assert.equal(response.headers.get('cache-control'), 'no-store')
    }
  }
  const oversized = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'x'.repeat(1024 * 1024) }) })
  assert.equal(oversized.status, 413)
  assert.equal(typeof (await oversized.json()).error, 'string')
  const health = await fetch(base + '/api/health')
  assert.equal(health.status, 200)
  assert.equal(health.headers.get('x-powered-by'), null)

  // Exercise the patched production JSON parser, not a legacy auth harness.
  // Invalid bytes after a compressed body must terminate with a safe error,
  // without reaching the database or leaving the request pending indefinitely.
  const compressed = Buffer.concat([gzipSync(Buffer.from('{"email":"synthetic@example.invalid"}')), Buffer.from('invalid-trailer')])
  const malformed = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', 'content-encoding': 'gzip' }, body: compressed, signal: AbortSignal.timeout(3000) })
  assert.equal(malformed.status, 400)
  assert.equal(typeof (await malformed.json()).error, 'string')
})
