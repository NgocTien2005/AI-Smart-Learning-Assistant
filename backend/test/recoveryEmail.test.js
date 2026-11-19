import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRecoveryEmailService } from '../src/services/recoveryEmail.js'

const env = { EMAIL_PROVIDER: 'brevo', APP_ORIGIN: 'https://frontend.example.invalid', BREVO_API_KEY: 'synthetic-key', EMAIL_FROM: 'sender@example.invalid', BREVO_SENDER_VERIFIED: 'true' }

test('HTTPS recovery sends one bounded request with frontend link and no SMTP fallback', async () => {
  let calls = 0
  const service = createRecoveryEmailService({ env, fetchImpl: async (url, opts) => {
    calls++
    assert.equal(url, 'https://api.brevo.com/v3/smtp/email')
    assert.equal(opts.headers['api-key'], env.BREVO_API_KEY)
    assert.equal(opts.redirect, 'error')
    const body = JSON.parse(opts.body)
    assert.equal(body.to[0].email, 'student@example.invalid')
    assert.equal(body.sender.email, env.EMAIL_FROM)
    assert.ok(body.textContent.includes('https://frontend.example.invalid/reset-password?token=synthetic-token'))
    assert.equal(body.htmlContent, undefined)
    return new Response(JSON.stringify({ messageId: 'synthetic-accepted' }), { status: 201 })
  }, createTransport: () => { throw Error('No SMTP fallback') } })
  assert.equal(service.isConfigured(), true)
  await service.send({ recipient: 'student@example.invalid', token: 'synthetic-token' })
  assert.equal(calls, 1)
})

test('HTTPS recovery config and failures are safe, never replayed', async () => {
  for (const override of [{ BREVO_API_KEY: '' }, { EMAIL_FROM: 'bad\r\nheader' }, { BREVO_SENDER_VERIFIED: 'false' }, { APP_ORIGIN: 'http://frontend.example.invalid' }, { EMAIL_PROVIDER: 'unknown' }]) assert.equal(createRecoveryEmailService({ env: { ...env, ...override } }).isConfigured(), false)
  for (const status of [400, 401, 403, 429, 500]) {
    let calls = 0
    const service = createRecoveryEmailService({ env, fetchImpl: async () => { calls++; return new Response('secret reset-url upstream-body', { status }) } })
    await assert.rejects(service.send({ recipient: 'student@example.invalid', token: 'synthetic-token' }), error => error.code === 'EMAIL_DELIVERY_FAILED' && !/secret|reset-url|upstream/.test(error.message))
    assert.equal(calls, 1)
  }
  const slow = createRecoveryEmailService({ env, timeoutMs: 20, fetchImpl: async () => new Response(new ReadableStream({ start() {} }), { status: 201 }) })
  await assert.rejects(slow.send({ recipient: 'student@example.invalid', token: 'synthetic-token' }), { code: 'EMAIL_DELIVERY_FAILED' })
  for (const body of [JSON.stringify({ notMessageId: true }), 'x'.repeat(65537)]) {
    const invalid = createRecoveryEmailService({ env, fetchImpl: async () => new Response(body, { status: 201 }) })
    await assert.rejects(invalid.send({ recipient: 'student@example.invalid', token: 'synthetic-token' }), { code: 'EMAIL_DELIVERY_FAILED' })
  }
})

test('default email mode preserves Gmail SMTP with private credentials and same reset message', async () => {
  let sent = 0
  const service = createRecoveryEmailService({ env: { APP_ORIGIN: 'http://localhost:8080', SMTP_USER: 'sender@example.invalid', SMTP_APP_PASSWORD: 'synthetic password' }, createTransport: opts => {
    assert.equal(opts.service, 'gmail')
    assert.equal(opts.auth.pass, 'syntheticpassword')
    return { sendMail: async mail => { sent++; assert.ok(mail.text.includes('/reset-password?token=synthetic-token')) } }
  } })
  assert.equal(service.isConfigured(), true)
  await service.send({ recipient: 'student@example.invalid', token: 'synthetic-token' })
  assert.equal(sent, 1)
})
