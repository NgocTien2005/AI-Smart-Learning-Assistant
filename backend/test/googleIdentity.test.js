import test from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { createGoogleVerifier, createChallengeStore } from '../src/services/googleIdentity.js'

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'fixture-key', alg: 'RS256', use: 'sig' }
const clientId = 'fixture.apps.googleusercontent.com'
const claims = { sub: 'fixture-subject', email: 'User@example.invalid', email_verified: true, nonce: 'fixture-nonce' }
const sign = (overrides = {}, options = {}) => jwt.sign({ ...claims, ...overrides }, privateKey, Object.fromEntries(Object.entries({ algorithm: 'RS256', keyid: 'fixture-key', issuer: 'https://accounts.google.com', audience: clientId, expiresIn: '5m', ...options }).filter(([, value]) => value !== undefined)))

test('Google verifier validates RS256 signature and required identity/recipient/nonce claims with bounded key cache', async () => {
  let calls = 0
  const verify = createGoogleVerifier({ clientId, fetchKeys: async () => { calls++; return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'cache-control': 'public, max-age=3600' } }) } })
  assert.equal((await verify(sign(), 'fixture-nonce')).sub, claims.sub)
  await verify(sign(), 'fixture-nonce')
  assert.equal(calls, 1)
  for (const token of [sign({ nonce: 'wrong' }), sign({ email_verified: false }), sign({ sub: '' }), sign({ exp: 1 }, { expiresIn: undefined }), sign({}, { audience: 'other-client' }), sign({}, { issuer: 'https://attacker.invalid' }), sign().slice(0, -10) + 'tampered']) {
    await assert.rejects(verify(token, 'fixture-nonce'), { code: 'GOOGLE_INVALID' })
  }
  const hs = jwt.sign(claims, 'fixture-secret-only', { algorithm: 'HS256', audience: clientId, expiresIn: '5m' })
  await assert.rejects(verify(hs, 'fixture-nonce'), { code: 'GOOGLE_INVALID' })
  await assert.rejects(verify('x'.repeat(20001), 'fixture-nonce'), { code: 'GOOGLE_INVALID' })
})

test('Google verifier rejects unavailable/malformed key responses without trusting claims or arbitrary key URLs', async () => {
  for (const response of [new Response('unavailable', { status: 503 }), new Response(JSON.stringify({ keys: [] }))]) {
    const verify = createGoogleVerifier({ clientId, fetchKeys: async () => response })
    await assert.rejects(verify(sign(), 'fixture-nonce'), { code: 'GOOGLE_UNAVAILABLE' })
  }
  const verify = createGoogleVerifier({ clientId, fetchKeys: async () => { throw new Error('fixture transport failure') } })
  await assert.rejects(verify(sign(), 'fixture-nonce'), { code: 'GOOGLE_UNAVAILABLE' })
})

test('Google challenge is browser/intent/owner-bound, single-use, expiring and capacity/rate bounded', () => {
  let now = 1000
  const store = createChallengeStore({ now: () => now, maxEntries: 2, maxPerIp: 2 })
  const owner = { id: 7, authVersion: 3 }
  const first = store.issue({ ip: 'one', intent: 'link', user: owner })
  assert.throws(() => store.consume(first.challengeId, 'wrong-cookie', 'link', owner), { code: 'GOOGLE_INVALID' })
  assert.throws(() => store.consume(first.challengeId, first.binding, 'link', { ...owner, authVersion: 4 }), { code: 'GOOGLE_INVALID' })
  const valid = store.issue({ ip: 'one', intent: 'login' })
  assert.equal(store.consume(valid.challengeId, valid.binding, 'login').nonce, valid.nonce)
  assert.throws(() => store.consume(valid.challengeId, valid.binding, 'login'), { code: 'GOOGLE_INVALID' })
  assert.throws(() => store.issue({ ip: 'one', intent: 'login' }), { code: 'GOOGLE_RATE_LIMIT' })
  const expired = store.issue({ ip: 'two', intent: 'login' })
  now += 300001
  assert.throws(() => store.consume(expired.challengeId, expired.binding, 'login'), { code: 'GOOGLE_INVALID' })
  assert.ok(store.issue({ ip: 'one', intent: 'login' }))
})
