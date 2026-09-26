import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createApp } from '../app.js'

const users = []
const prisma = {
  user: {
    findUnique: async ({ where }) => users.find((user) => (
      where.id !== undefined ? user.id === where.id : user.email === where.email
    )) ?? null,
    create: async ({ data }) => {
      const user = { id: users.length + 1, ...data }
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

before(async () => {
  const app = createApp({ prisma, jwtSecret: 'test-secret' })
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

test('authentication flow', async (t) => {
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
