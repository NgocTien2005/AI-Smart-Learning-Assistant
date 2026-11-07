import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { createServer } from 'node:http'
import { createGoogleAuthRouter } from '../src/routes/googleAuth.js'

async function setup(t, { configured = true } = {}) {
  const users = [{ id: 1, name: 'Fixture', email: 'owner@example.invalid', role: 'STUDENT', isActive: true, authVersion: 2, googleSubject: null }]
  let beforeUpdate = () => {}
  const prisma = { user: {
    findUnique: async ({ where }) => users.find(u => Object.entries(where).every(([key, value]) => u[key] === value)) || null,
    updateMany: async ({ where, data }) => { beforeUpdate(); const user = users.find(u => Object.entries(where).every(([key, value]) => u[key] === value)); if (!user) return { count: 0 }; if (users.some(u => u.id !== user.id && u.googleSubject === data.googleSubject)) throw Object.assign(new Error('unique fixture'), { code: 'P2002' }); Object.assign(user, data); return { count: 1 } },
    create: async () => { throw new Error('Google MUST NEVER create a user') },
  } }
  const app = express()
  app.use(express.json())
  app.use('/api/auth/google', createGoogleAuthRouter({ prisma, clientId: configured ? 'fixture.apps.googleusercontent.com' : '', authenticate: (req, res, next) => { const user = users.find(u => u.id === Number(req.headers['x-fixture-user']) && u.isActive); if (!user) return res.status(401).json({ code: 'AUTH_REQUIRED', error: 'fixture unauthorized' }); req.user = { ...user }; next() }, verify: async credential => { if (credential === 'invalid') throw Object.assign(new Error('invalid fixture'), { code: 'GOOGLE_INVALID', status: 401 }); return JSON.parse(credential) }, createToken: u => `fixture-session-${u.id}-${u.role}-${u.authVersion}`, publicUser: ({ id, role, email, name }) => ({ id, role, email, name }) }))
  const server = createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}/api/auth/google`
  const call = (path, { body, cookie, user, method = body ? 'POST' : 'GET' } = {}) => fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...(user ? { 'x-fixture-user': String(user) } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const challenge = async (intent, user) => { const response = await call('/challenge', { body: { intent }, user }); assert.equal(response.status, 200); const cookie = response.headers.get('set-cookie').split(';')[0]; return { ...(await response.json()), cookie } }
  const exchange = (path, c, credential, user) => call(path, { body: { challengeId: c.challengeId, credential: JSON.stringify(credential) }, cookie: c.cookie, user })
  return { users, call, challenge, exchange, setBeforeUpdate: fn => { beforeUpdate = fn } }
}

test('production Google linking requires matching active owner, never overwrites links and consumes challenges', async t => {
  const c = await setup(t)
  assert.equal((await c.call('/challenge', { body: { intent: 'link' } })).status, 401)
  const mismatch = await c.challenge('link', 1)
  assert.equal((await c.exchange('/link', mismatch, { sub: 'first', email: 'other@example.invalid' }, 1)).status, 409)
  assert.equal(c.users[0].googleSubject, null)
  const valid = await c.challenge('link', 1)
  const linked = await c.exchange('/link', valid, { sub: 'first', email: 'owner@example.invalid' }, 1)
  assert.equal(linked.status, 200)
  assert.deepEqual(await linked.json(), { linked: true })
  assert.equal((await c.exchange('/link', valid, { sub: 'first', email: 'owner@example.invalid' }, 1)).status, 401)
  assert.deepEqual(await (await c.call('/link', { user: 1 })).json(), { linked: true })
  const replace = await c.challenge('link', 1)
  assert.equal((await c.exchange('/link', replace, { sub: 'second', email: 'owner@example.invalid' }, 1)).status, 409)
  assert.equal(c.users[0].googleSubject, 'first')
})

test('production Google linking rejects version/race/occupied identity without unauthorized writes', async t => {
  const c = await setup(t)
  const stale = await c.challenge('link', 1)
  c.users[0].authVersion++
  assert.equal((await c.exchange('/link', stale, { sub: 'first', email: 'owner@example.invalid' }, 1)).status, 401)
  const race = await c.challenge('link', 1)
  c.setBeforeUpdate(() => { c.users[0].authVersion++ })
  assert.equal((await c.exchange('/link', race, { sub: 'first', email: 'owner@example.invalid' }, 1)).status, 409)
  assert.equal(c.users[0].googleSubject, null)
  c.setBeforeUpdate(() => {})
  c.users.push({ id: 2, email: 'other@example.invalid', googleSubject: 'occupied' })
  const occupied = await c.challenge('link', 1)
  assert.equal((await c.exchange('/link', occupied, { sub: 'occupied', email: 'owner@example.invalid' }, 1)).status, 409)
  assert.equal(c.users[0].googleSubject, null)
})

test('production Google login uses linked subject only, preserves all roles and creates zero users', async t => {
  const c = await setup(t)
  for (const role of ['STUDENT', 'INSTRUCTOR', 'ADMIN']) {
    c.users[0].role = role
    c.users[0].googleSubject = 'linked'
    const valid = await c.challenge('login')
    const response = await c.exchange('/login', valid, { sub: 'linked', email: 'changed@example.invalid' })
    assert.equal(response.status, 200)
    const data = await response.json()
    assert.equal(data.user.role, role)
    assert.equal(data.user.id, 1)
    assert.equal('googleSubject' in data.user, false)
    assert.equal('password' in data.user, false)
  }
  for (const identity of [{ sub: 'unknown', email: c.users[0].email }, { sub: 'unknown', email: 'new@example.invalid' }]) {
    assert.equal((await c.exchange('/login', await c.challenge('login'), identity)).status, 403)
    assert.equal(c.users.length, 1)
  }
  c.users[0].isActive = false
  assert.equal((await c.exchange('/login', await c.challenge('login'), { sub: 'linked', email: c.users[0].email })).status, 403)
})

test('production Google endpoints fail closed on missing config/shape/cookie and do not consume DB for disabled provider', async t => {
  const disabled = await setup(t, { configured: false })
  assert.equal((await disabled.call('/challenge', { body: { intent: 'login' } })).status, 503)
  const c = await setup(t)
  assert.equal((await c.call('/challenge', { body: { intent: 'register' } })).status, 400)
  assert.equal((await c.call('/login', { body: { credential: 'bad' } })).status, 400)
  const challenge = await c.challenge('login')
  assert.equal((await c.call('/login', { body: { challengeId: challenge.challengeId, credential: 'invalid' } })).status, 401)
  assert.equal(c.users[0].googleSubject, null)
})
