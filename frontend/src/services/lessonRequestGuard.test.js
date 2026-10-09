import assert from 'node:assert/strict'
import test from 'node:test'
import { LessonRequestGuard } from './lessonRequestGuard.js'

test('ignores out-of-order lesson history and send responses after selection changes', async () => {
  const guard = new LessonRequestGuard()
  let resolveA
  let resolveB
  const historyA = new Promise((resolve) => { resolveA = resolve })
  const historyB = new Promise((resolve) => { resolveB = resolve })
  const selectionA = guard.select('lesson-A')
  const selectionB = guard.select('lesson-B')
  const visible = []

  resolveB('B history')
  const responseB = await historyB
  if (guard.isCurrent(selectionB)) visible.push(responseB)
  resolveA('A history')
  const responseA = await historyA
  if (guard.isCurrent(selectionA)) visible.push(responseA)
  assert.deepEqual(visible, ['B history'])

  const sendA = guard.select('lesson-A')
  const sendB = guard.select('lesson-B')
  if (guard.isCurrent(sendA)) visible.push('A answer')
  if (guard.isCurrent(sendB)) visible.push('B answer')
  assert.deepEqual(visible, ['B history', 'B answer'])
})

test('clearing the assistant invalidates pending requests', () => {
  const guard = new LessonRequestGuard()
  const request = guard.select('lesson-A')
  guard.clear()
  assert.equal(guard.isCurrent(request), false)
})
