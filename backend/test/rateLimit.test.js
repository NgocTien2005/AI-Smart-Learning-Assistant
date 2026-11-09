import assert from 'node:assert/strict'
import test from 'node:test'
import express from 'express'
import { once } from 'node:events'
import { createRateLimit, createAuthLimits, createJoinLimit } from '../src/middleware/rateLimit.js'

async function serve(t, setup) {
  const app = express()
  app.use(express.json())
  setup(app)
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve) }))
  return (path, body = {}, headers = {}) => fetch(`http://127.0.0.1:${server.address().port}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })
}

test('rate limit expires fixed windows, separates keys, bounds capacity and avoids work on denial', async t => {
  let time = 0, work = 0
  const limit = createRateLimit({ max: 2, windowMs: 1000, maxKeys: 2, now: () => time, key: req => req.body.identity })
  const call = await serve(t, app => app.post('/', limit, (_req, res) => { work++; res.json({ ok: true }) }))
  assert.equal((await call('/', { identity: 'a' })).status, 200)
  assert.equal((await call('/', { identity: 'b' })).status, 200)
  const capacity = await call('/', { identity: 'c' })
  assert.equal(capacity.status, 429)
  assert.equal(capacity.headers.get('retry-after'), '1')
  assert.equal((await capacity.json()).code, 'RATE_LIMITED')
  assert.equal((await call('/', { identity: 'a' })).status, 200)
  assert.equal((await call('/', { identity: 'a' })).status, 429)
  assert.equal(work, 3)
  time = 1000
  assert.equal((await call('/', { identity: 'c' })).status, 200)
  assert.equal((await call('/', { identity: 'a' })).status, 200)
  assert.equal(work, 5)
})

test('auth login budgets normalize email, reject X-Forwarded-For spoofing and aggregate rotating email', async t => {
  let work = 0, time = 0
  const limits = createAuthLimits({ now: () => time })
  const call = await serve(t, app => app.post('/login', limits.login, (_req, res) => { work++; res.json({ ok: true }) }))
  for (let i = 0; i < 10; i++) assert.equal((await call('/login', { email: i % 2 ? ' USER@example.test ' : 'user@example.test' })).status, 200)
  const blocked = await call('/login', { email: 'user@example.test' }, { 'x-forwarded-for': '198.51.100.7' })
  assert.equal(blocked.status, 429)
  assert.equal(blocked.headers.get('retry-after'), '900')
  for (let i = 0; i < 89; i++) assert.equal((await call('/login', { email: `rotated${i}@example.test` }, { 'x-forwarded-for': `198.51.100.${i}` })).status, 200)
  assert.equal((await call('/login', { email: 'last@example.test' })).status, 429)
  assert.equal(work, 99) // Denied pair request also consumes the IP budget.
  time = 900000
  assert.equal((await call('/login', { email: 'user@example.test' })).status, 200)
})

test('registration, forgot, reset, change and join enforce independent production budgets', async t => {
  const limits = createAuthLimits()
  const budgets = { register: 40, forgot: 20, reset: 30, change: 20, join: 20 }
  const call = await serve(t, app => {
    app.use((req, _res, next) => { req.user = { id: 7 }; next() })
    for (const [path, limit] of Object.entries({ register: limits.register, forgot: limits.forgot, reset: limits.reset, change: limits.change, join: createJoinLimit() })) app.post('/' + path, limit, (_req, res) => res.json({ ok: true }))
  })
  for (const [path, max] of Object.entries(budgets)) {
    for (let i = 0; i < max; i++) assert.equal((await call('/' + path, { email: `user${i}@example.test` })).status, 200)
    assert.equal((await call('/' + path, { email: 'extra@example.test' })).status, 429)
  }
})

test('forgot pair budget does not reveal account existence and expires without permanent account lock', async t => {
  let now = 0
  const limits = createAuthLimits({ now: () => now })
  const call = await serve(t, app => app.post('/', limits.forgot, (_req, res) => res.json({ message: 'generic' })))
  for (let i = 0; i < 5; i++) assert.equal((await call('/', { email: 'unknown@example.test' })).status, 200)
  assert.equal((await call('/', { email: 'unknown@example.test' })).status, 429)
  assert.equal((await call('/', { email: 'another@example.test' })).status, 200)
  now = 900000
  assert.equal((await call('/', { email: 'unknown@example.test' })).status, 200)
})
