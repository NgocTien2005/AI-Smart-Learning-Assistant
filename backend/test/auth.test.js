import assert from 'node:assert/strict'
import { test } from 'node:test'
import express from 'express'
import jwt from 'jsonwebtoken'
import { createAuthRouter } from '../src/routes/auth.js'
import { createAuthenticate } from '../src/middleware/authenticateFactory.js'
import bcrypt from 'bcryptjs'
import { hashPasswordResetToken } from '../src/utils/passwordReset.js'
import { logSafeError } from '../src/middleware/securityHeaders.js'

// Synthetic process-local configuration; no DB or environment file is read.
process.env.DATABASE_URL = 'postgresql://unused:unused@127.0.0.1:1/unused'
process.env.JWT_SECRET = 'unit-only-auth-secret'
const { createToken, publicUser } = await import('../src/utils/auth.js')
const createApp = ({ prisma, emailReady = false, sendEmail = async () => { throw new Error('Email forbidden in unit test') } }) => {
  const app = express()
  app.use(express.json())
  app.use('/api/auth', createAuthRouter({ prisma, authenticate: createAuthenticate({ prisma, jwtSecret: process.env.JWT_SECRET }), createToken, publicUser, isEmailConfigured: () => emailReady, sendPasswordResetEmail: sendEmail }))
  return app
}

const users = []
const prisma = {
  user: {
    findUnique: async ({ where }) => users.find((user) => (
      where.id !== undefined ? user.id === where.id : user.email === where.email
    )) ?? null,
    create: async ({ data }) => {
      const user = { id: users.length + 1, isActive: true, authVersion: 0, ...data }
      users.push(user)
      return user
    },
  },
}

let server
let baseUrl

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options)
  return { response, body: await response.json() }
}

test('production authentication flow', async (t) => {
  const app = createApp({ prisma, jwtSecret: 'test-secret' })
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })
  baseUrl = `http://127.0.0.1:${server.address().port}`
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  })
  let token

  await t.test('rejects an incomplete registration', async () => {
    const { response, body } = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'student@example.com', password: 'secret123' }),
    })
    assert.equal(response.status, 400)
    assert.equal(body.error, 'Họ và tên phải từ 2 đến 80 ký tự')
  })

  await t.test('registers and never exposes the password hash', async () => {
    const { response, body } = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Nguyễn Văn A',
        email: ' Student@Example.com ',
        password: 'secret123',
        role: 'STUDENT',
      }),
    })
    assert.equal(response.status, 201)
    assert.equal(body.user.email, 'student@example.com')
    assert.equal(body.user.name, 'Nguyễn Văn A')
    assert.equal('password' in body.user, false)
    assert.equal(typeof body.token, 'string')
    token = body.token
  })

  await t.test('does not allow public registration as an administrator', async () => {
    const { response } = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Public Administrator',
        email: 'public-admin@example.com',
        password: 'secret123',
        role: 'ADMIN',
      }),
    })
    assert.equal(response.status, 400)
  })

  await t.test('rejects a duplicate email', async () => {
    const { response } = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Student',
        email: 'student@example.com',
        password: 'secret123',
      }),
    })
    assert.equal(response.status, 409)
  })

  await t.test('rejects wrong credentials', async () => {
    const { response } = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'student@example.com', password: 'wrong-password' }),
    })
    assert.equal(response.status, 401)
  })

  await t.test('logs in with normalized email', async () => {
    const { response, body } = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: ' STUDENT@example.com ', password: 'secret123' }),
    })
    assert.equal(response.status, 200)
    assert.equal(body.user.id, 1)
    assert.equal('password' in body.user, false)
    token = body.token
  })

  await t.test('requires a valid token for the current user', async () => {
    const missing = await request('/api/auth/me')
    assert.equal(missing.response.status, 401)

    const authenticated = await request('/api/auth/me', {
      headers: { authorization: `Bearer ${token}` },
    })
    assert.equal(authenticated.response.status, 200)
    assert.deepEqual(authenticated.body.user, {
      id: 1,
      name: 'Nguyễn Văn A',
      email: 'student@example.com',
      role: 'STUDENT',
    })
  })
})

async function fixture(t, options = {}) {
  const records = [await bcrypt.hash(' keep spaces ', 10)].flatMap(password => ['ADMIN', 'INSTRUCTOR', 'STUDENT'].map((role, i) => ({ id: i + 10, role, name: 'Synthetic ' + role, email: role.toLowerCase() + '@example.test', password, authVersion: 0, isActive: true })))
  let writes = 0
  const matches = (user, where) => Object.entries(where).every(([key, value]) => {
    if (key === 'passwordResetExpiresAt' && value?.gt) return user[key] > value.gt
    return user[key] === value
  })
  const apply = (user, data) => { for (const [key, value] of Object.entries(data)) user[key] = value?.increment ? user[key] + value.increment : value }
  const prisma = { user: {
    findUnique: async ({ where }) => records.find(user => matches(user, where)) ?? null,
    updateMany: async ({ where, data }) => {
      const user = records.find(user => matches(user, where))
      if (!user) return { count: 0 }
      writes++; apply(user, data); return { count: 1 }
    },
    update: async ({ where, data }) => { const user = records.find(user => matches(user, where)); writes++; apply(user, data); return user },
  } }
  const server = createApp({ prisma, ...options }).listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve) }))
  const call = async (path, body, token) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return { status: response.status, body: await response.json() }
  }
  return { records, call, writes: () => writes }
}

test('production authentication preserves all roles, password spaces and current-user revocation/expiration', async t => {
  const { records, call, writes } = await fixture(t)
  for (const user of records) {
    const result = await call('/login', { email: ' ' + user.email.toUpperCase() + ' ', password: ' keep spaces ' })
    assert.equal(result.status, 200)
    assert.deepEqual(Object.keys(result.body.user).sort(), ['email', 'id', 'name', 'role'])
    assert.equal(result.body.user.role, user.role)
    const token = result.body.token
    assert.equal((await call('/me', undefined, token)).status, 200)
    assert.equal((await call('/login', { email: user.email, password: 'keep spaces' })).status, 401)
    user.authVersion++
    assert.equal((await call('/me', undefined, token)).status, 401)
    assert.equal((await call('/me', undefined, createToken(user))).status, 200)
    user.isActive = false
    assert.equal((await call('/login', { email: user.email, password: ' keep spaces ' })).status, 401)
    assert.equal((await call('/me', undefined, createToken(user))).status, 401)
  }
  const expired = jwt.sign({ userId: 10, authVersion: 0 }, process.env.JWT_SECRET, { expiresIn: -1 })
  for (const token of [expired, 'invalid-synthetic-token', jwt.sign({ userId: '10' }, process.env.JWT_SECRET)]) assert.equal((await call('/me', undefined, token)).status, 401)
  assert.equal((await call('/me')).status, 401)
  assert.equal(writes(), 0)
})

test('production reset distinguishes validation/used-link, atomically single uses and revokes old password/session', async t => {
  const { records, call, writes } = await fixture(t)
  const user = records[2], resetToken = 'f'.repeat(64)
  user.passwordResetTokenHash = hashPasswordResetToken(resetToken)
  user.passwordResetExpiresAt = new Date(Date.now() + 60000)
  const oldToken = createToken(user)
  const invalid = await call('/reset-password', { token: resetToken, password: 'short' })
  assert.equal(invalid.status, 400)
  assert.equal(writes(), 0)
  const outcomes = await Promise.all([1, 2].map(() => call('/reset-password', { token: resetToken, password: ' new password ' })))
  assert.deepEqual(outcomes.map(result => result.status).sort(), [200, 400])
  assert.equal(writes(), 1)
  const used = await call('/reset-password', { token: resetToken, password: ' another password ' })
  assert.equal(used.status, 400)
  assert.notEqual(invalid.body.error, used.body.error)
  assert.equal((await call('/me', undefined, oldToken)).status, 401)
  assert.equal((await call('/login', { email: user.email, password: ' keep spaces ' })).status, 401)
  assert.equal((await call('/login', { email: user.email, password: ' new password ' })).status, 200)
  assert.equal(user.passwordResetTokenHash, null)
})

test('production forgot stays generic across existence/disabled/cooldown and never sends without configuration', async t => {
  let sends = 0
  const { records, call, writes } = await fixture(t, { emailReady: true, sendEmail: async () => { sends++ } })
  records[0].isActive = false
  records[1].passwordResetRequestedAt = new Date()
  const results = []
  for (const email of ['missing@example.test', ...records.map(user => user.email)]) results.push(await call('/forgot-password', { email }))
  assert.ok(results.every(result => result.status === 200))
  assert.ok(results.every(result => JSON.stringify(result.body) === JSON.stringify(results[0].body)))
  assert.equal(sends, 1)
  assert.equal(writes(), 1)
  const disabledEmail = await fixture(t)
  assert.equal((await disabledEmail.call('/forgot-password', { email: 'student@example.test' })).status, 503)
  assert.equal(disabledEmail.writes(), 0)
})

test('safe exception logging never serializes message/query/credentials or arbitrary provider codes', () => {
  const original = console.error, output = []
  console.error = (...args) => output.push(args.join(' '))
  try {
    logSafeError('Synthetic failure', { code: 'EPRIVATESECRET', message: 'private-message', query: 'private-query' })
    logSafeError('Synthetic failure', { code: 'P2002', meta: { value: 'private-value' } })
  } finally { console.error = original }
  assert.deepEqual(output, ['Synthetic failure INTERNAL_ERROR', 'Synthetic failure P2002'])
})
