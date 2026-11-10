import assert from 'node:assert/strict'
import test from 'node:test'
import { studyEvaluationCases, evaluateStudyCase } from '../scripts/evaluate-study.mjs'

for (const item of studyEvaluationCases) test('offline study evaluation: ' + item.id, async () => {
  const nativeFetch = globalThis.fetch
  globalThis.fetch = () => { throw new Error('NETWORK_FORBIDDEN_IN_OFFLINE_EVALUATION') }
  try { assert.equal((await evaluateStudyCase(item)).passed, true, item.id) }
  finally { globalThis.fetch = nativeFetch }
})
