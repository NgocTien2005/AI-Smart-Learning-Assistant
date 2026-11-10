import test from 'node:test'
import assert from 'node:assert/strict'
import { assertOperationsTarget, assertPrivateAccessLog } from '../operations-check.mjs'

test('operations recovery refuses absent, reserved or mismatched target before commands', () => {
  const valid = { project: 'lumina-acceptance-ci-123-abc', baseUrl: 'http://127.0.0.1:56000/api', database: 'lumina_acceptance', containers: { db: 'a'.repeat(64), backend: 'b'.repeat(64), frontend: 'c'.repeat(64) } }
  assert.doesNotThrow(() => assertOperationsTarget(valid))
  for (const target of [undefined, {}, { ...valid, project: 'ai-smart-learning-assistant' }, { ...valid, baseUrl: 'http://127.0.0.1:8081/api' }, { ...valid, database: 'lumina_lms' }, { ...valid, containers: {} }]) {
    assert.throws(() => assertOperationsTarget(target), /OPERATIONS_TARGET/)
  }
})

test('proxy evidence rejects canaries, empty logs and unexpected JSON fields', () => {
  const safe = JSON.stringify({ status: 200, bytes: 123, seconds: 0.001 })
  assert.doesNotThrow(() => assertPrivateAccessLog(safe, 'synthetic-marker'))
  for (const log of ['', 'synthetic-marker', JSON.stringify({ status: 200, request: '/reset?synthetic-marker' }), JSON.stringify({ status: 200, bytes: 1, seconds: 1, url: '/private' })]) {
    assert.throws(() => assertPrivateAccessLog(log, 'synthetic-marker'), /OPERATIONS_LOG/)
  }
})
