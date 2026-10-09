import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { createServer } from 'node:http'
import { createQuizAttemptsRouter } from '../src/routes/quizAttempts.js'

const content = [
  'Lập trình mô tả các bước để máy tính thực hiện một nhiệm vụ.',
  'Biến lưu trữ giá trị để chương trình có thể sử dụng lại.',
  'Vòng lặp giúp thực hiện lại một nhóm lệnh nhiều lần.',
  'Kiểu dữ liệu bao gồm số, chuỗi và giá trị boolean.',
].join('\n')

const setup = async () => {
  let nextId = 1
  let enrolled = true
  let lessonText = content
  const attempts = new Map()
  const prisma = {
    lesson: { findUnique: async ({ where, include }) => where.id === 9 ? ({ id: 9, extractedText: lessonText, content: lessonText, course: { instructorId: 8, enrollments: enrolled ? [{ userId: 7 }] : [] }, include }) : null },
    quizAttempt: {
      findMany: async ({ where }) => [...attempts.values()].filter((attempt) => attempt.userId === where.userId && attempt.lessonId === where.lessonId).sort((a, b) => b.id - a.id),
      findUnique: async ({ where }) => attempts.get(where.id) || null,
      create: async ({ data }) => {
        const attempt = { id: nextId++, ...data, score: null, submittedAt: null, selectedAnswers: null, createdAt: new Date(), version: 0 }
        attempts.set(attempt.id, attempt)
        return attempt
      },
      updateMany: async ({ where, data }) => {
        const attempt = attempts.get(where.id)
        if (!attempt || attempt.userId !== where.userId || attempt.submittedAt !== where.submittedAt || attempt.version !== where.version) return { count: 0 }
        const nextVersion = data.version?.increment ? attempt.version + data.version.increment : data.version
        Object.assign(attempt, data, { version: nextVersion })
        return { count: 1 }
      },
    },
  }
  const app = express()
  app.use(express.json())
  app.use((request, _response, next) => {
    request.user = { id: Number(request.headers['x-user-id'] || 7), role: 'STUDENT' }
    next()
  })
  app.use('/api/courses', createQuizAttemptsRouter({ prisma }))
  const server = createServer(app)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}/api/courses`
  return { base, attempts, server, setEnrolled: (value) => { enrolled = value }, setLessonText: (value) => { lessonText = value } }
}

const call = (base, path, { method = 'GET', body, userId = 7 } = {}) => fetch(`${base}${path}`, {
  method,
  headers: { 'content-type': 'application/json', 'x-user-id': String(userId) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})

test('production quiz handlers persist drafts, hide keys, enforce versioning and return durable results', async (t) => {
  const context = await setup()
  t.after(() => context.server.close())
  const create = await call(context.base, '/lessons/9/quizzes', { method: 'POST', body: { count: 4 } })
  assert.equal(create.status, 201)
  const created = await create.json()
  assert.equal(created.actualCount, 4)
  assert.ok(created.questions.every((question) => !('correctIndex' in question) && !('explanation' in question) && !('sourcePassage' in question)))

  const attemptPath = `/quiz-attempts/${created.attemptId}`
  assert.equal((await call(context.base, attemptPath, { userId: 99 })).status, 404)
  assert.equal((await call(context.base, `${attemptPath}/draft`, { method: 'PUT', userId: 99, body: { answers: [0, 0, 0, 0], version: 0 } })).status, 404)
  const draft = [0, null, 2, null]
  const save = await call(context.base, `${attemptPath}/draft`, { method: 'PUT', body: { answers: draft, version: 0 } })
  assert.equal(save.status, 200)
  const saveResult = await save.json()
  assert.equal(saveResult.version, 1)
  const reopened = await (await call(context.base, attemptPath)).json()
  assert.deepEqual(reopened.answers, draft)
  assert.ok(reopened.questions.every((question) => !('correctIndex' in question) && !('explanation' in question) && !('sourcePassage' in question)))

  const staleDrafts = await Promise.all([
    call(context.base, `${attemptPath}/draft`, { method: 'PUT', body: { answers: draft, version: 1 } }),
    call(context.base, `${attemptPath}/draft`, { method: 'PUT', body: { answers: draft, version: 1 } }),
  ])
  assert.deepEqual(staleDrafts.map(({ status }) => status).sort(), [200, 409])

  const afterDraft = await (await call(context.base, attemptPath)).json()
  const selections = afterDraft.questions.map((question) => question.options.findIndex((option) => option === question.options[0]))
  const submit = await call(context.base, `${attemptPath}/submit`, { method: 'POST', body: { answers: selections, version: afterDraft.version } })
  assert.equal(submit.status, 200)
  const result = await submit.json()
  assert.equal(result.total, 4)
  assert.equal(result.questions.length, 4)
  assert.ok(result.questions.every((question) => 'correctIndex' in question && 'selectedIndex' in question && question.sourcePassage))
  assert.deepEqual(context.attempts.get(created.attemptId).selectedAnswers, selections)
  const persistedResult = await (await call(context.base, attemptPath)).json()
  assert.deepEqual(persistedResult.questions.map(({ selectedIndex }) => selectedIndex), selections)
  assert.equal((await call(context.base, attemptPath, { userId: 99 })).status, 404)
  assert.equal((await call(context.base, `${attemptPath}/submit`, { method: 'POST', userId: 99, body: { answers: selections, version: afterDraft.version } })).status, 404)
  assert.equal((await call(context.base, `${attemptPath}/submit`, { method: 'POST', body: { answers: selections, version: afterDraft.version } })).status, 409)
  assert.equal((await call(context.base, `${attemptPath}/draft`, { method: 'PUT', body: { answers: selections, version: afterDraft.version } })).status, 409)
})

test('rechecks enrollment for every attempt operation and keeps old snapshots immutable', async (t) => {
  const context = await setup()
  t.after(() => context.server.close())
  const create = await call(context.base, '/lessons/9/quizzes', { method: 'POST', body: { count: 4 } })
  const created = await create.json()
  const originalQuestion = context.attempts.get(created.attemptId).questions[0]
  context.setEnrolled(false)
  const attemptPath = `/quiz-attempts/${created.attemptId}`
  assert.equal((await call(context.base, attemptPath)).status, 403)
  assert.equal((await call(context.base, `${attemptPath}/draft`, { method: 'PUT', body: { answers: [0, 0, 0, 0], version: 0 } })).status, 403)
  assert.equal((await call(context.base, `${attemptPath}/submit`, { method: 'POST', body: { answers: [0, 0, 0, 0], version: 0 } })).status, 403)
  context.setLessonText('Nội dung bài học đã được sửa sau khi tạo attempt.')
  assert.deepEqual(context.attempts.get(created.attemptId).questions[0], originalQuestion)
  context.setEnrolled(true)
  const reopened = await (await call(context.base, `/quiz-attempts/${created.attemptId}`)).json()
  assert.equal(reopened.questions[0].prompt, originalQuestion.prompt)
})

test('serializes a concurrent draft write and submission with optimistic versions', async (t) => {
  const context = await setup()
  t.after(() => context.server.close())
  const created = await (await call(context.base, '/lessons/9/quizzes', { method: 'POST', body: { count: 4 } })).json()
  const path = `/quiz-attempts/${created.attemptId}`
  const answers = [0, 0, 0, 0]
  const [draft, submit] = await Promise.all([
    call(context.base, `${path}/draft`, { method: 'PUT', body: { answers, version: 0 } }),
    call(context.base, `${path}/submit`, { method: 'POST', body: { answers, version: 0 } }),
  ])
  assert.deepEqual([draft.status, submit.status].sort(), [200, 409])
  if (submit.status === 409) {
    const current = await (await call(context.base, path)).json()
    assert.equal((await call(context.base, `${path}/submit`, { method: 'POST', body: { answers, version: current.version } })).status, 200)
  }
})

test('legacy submitted attempts show no fabricated selections', async (t) => {
  const context = await setup()
  t.after(() => context.server.close())
  const questions = [{ prompt: 'Prompt', options: ['a', 'b', 'c', 'd'], correctIndex: 1 }]
  context.attempts.set(4, { id: 4, userId: 7, lessonId: 9, questions, draftAnswers: [], selectedAnswers: null, score: 1, submittedAt: new Date(), version: 0 })
  const response = await call(context.base, '/quiz-attempts/4')
  assert.equal(response.status, 200)
  const result = await response.json()
  assert.equal(result.legacyAnswersUnavailable, true)
  assert.equal(result.questions[0].selectedIndex, null)
})

test('validates requested count and returns 422 when too little supported source is available', async (t) => {
  const context = await setup()
  t.after(() => context.server.close())
  const invalidCount = await call(context.base, '/lessons/9/quizzes', { method: 'POST', body: { count: 2 } })
  assert.equal(invalidCount.status, 400)
  context.setLessonText('Một câu không có mẫu định nghĩa được hỗ trợ.')
  const insufficient = await call(context.base, '/lessons/9/quizzes', { method: 'POST', body: { count: 5 } })
  assert.equal(insufficient.status, 422)
  assert.match((await insufficient.json()).error, /khái niệm kèm định nghĩa rõ ràng/iu)
})
