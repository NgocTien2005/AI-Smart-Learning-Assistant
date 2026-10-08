import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetToken,
  PASSWORD_RESET_TTL_MS,
} from '../src/utils/passwordReset.js'

test('password reset token is random, valid and stored as a hash', () => {
  const first = createPasswordResetToken()
  const second = createPasswordResetToken()

  assert.equal(first.length, 64)
  assert.equal(isPasswordResetToken(first), true)
  assert.notEqual(first, second)
  assert.match(hashPasswordResetToken(first), /^[a-f\d]{64}$/)
  assert.notEqual(hashPasswordResetToken(first), first)
  assert.equal(PASSWORD_RESET_TTL_MS, 30 * 60 * 1000)
})

test('password reset token validation rejects malformed input', () => {
  assert.equal(isPasswordResetToken(undefined), false)
  assert.equal(isPasswordResetToken('short'), false)
  assert.equal(isPasswordResetToken('z'.repeat(64)), false)
})
