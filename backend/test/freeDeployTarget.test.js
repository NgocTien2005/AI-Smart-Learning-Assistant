import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateFreeDeployTarget } from '../src/utils/freeDeployTarget.js'

test('free ADMIN target guard requires explicit fresh project, exact pooler identity and strict TLS', () => {
  const env = { FREE_DEPLOY_TARGET_CONFIRMED: 'NEW_EMPTY_PROJECT', EXPECTED_PROJECT_REF: 'syntheticprojectrefxx', EXPECTED_DATABASE_HOST: 'aws-0-test.pooler.supabase.com', DATABASE_URL: 'postgresql://postgres.syntheticprojectrefxx:synthetic-password@aws-0-test.pooler.supabase.com:5432/postgres?sslmode=verify-full' }
  validateFreeDeployTarget(env)
  for (const change of [{ FREE_DEPLOY_TARGET_CONFIRMED: '' }, { EXPECTED_PROJECT_REF: 'differentprojectrefxx' }, { EXPECTED_DATABASE_HOST: 'localhost' }, { DATABASE_URL: env.DATABASE_URL.replace(':5432/', ':6543/') }, { DATABASE_URL: env.DATABASE_URL.replace('/postgres?', '/other?') }, { DATABASE_URL: env.DATABASE_URL.replace('verify-full', 'require') }, { DATABASE_URL: env.DATABASE_URL + '&uselibpqcompat=true' }]) assert.throws(() => validateFreeDeployTarget({ ...env, ...change }), /target refused/)
})
