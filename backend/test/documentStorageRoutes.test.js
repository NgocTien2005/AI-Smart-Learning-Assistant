import assert from 'node:assert/strict'
import { test } from 'node:test'
import express from 'express'
import jwt from 'jsonwebtoken'
import { createAuthenticate } from '../src/middleware/authenticateFactory.js'

// Prevent dotenv from loading any developer credentials into this process.
process.env.DOTENV_CONFIG_PATH = 'unit-nonexistent.env'
process.env.DATABASE_URL = 'postgresql://unused:unused@127.0.0.1:1/unused'
process.env.JWT_SECRET = 'unit-only-storage-secret'
const { createLessonsRouter } = await import('../src/routes/lessons.js')

const users = [
  { id: 1, role: 'INSTRUCTOR' }, { id: 2, role: 'INSTRUCTOR' },
  { id: 3, role: 'STUDENT' }, { id: 4, role: 'STUDENT' }, { id: 5, role: 'ADMIN' },
].map(user => ({ ...user, isActive: true, authVersion: 0 }))
const secret = process.env.JWT_SECRET
const token = id => jwt.sign({ userId: id, authVersion: 0 }, secret)

test('production document routes authorize before storage and preserve replacement/source lifecycle', async t => {
  let enrolled = true, reads = 0, saves = 0, deletes = [], updates = 0, conflict = false, uncertain = false, unavailable = false
  let lesson = { id: 10, courseId: 20, title: 'Synthetic lesson', documentUrl: 'supabase:documents/lumina/00000000-0000-4000-8000-000000000000.txt', documentName: 'lesson.txt', documentText: 'Original source', extractionStatus: 'SUCCESS', sourceRevision: 0 }
  const bytes = Buffer.from('A database is a collection of related data.')
  const storage = {
    read: async () => { reads++; if (unavailable) throw Object.assign(new Error('safe'), { code: 'STORAGE_UNAVAILABLE' }); return bytes },
    save: async () => { saves++; return `new-object-${saves}.txt` },
    remove: async ref => { deletes.push(ref) },
  }
  const prisma = {
    user: { findUnique: async ({ where }) => users.find(user => user.id === where.id) || null },
    course: { findUnique: async () => ({ instructorId: 1 }) },
    lesson: {
      findUnique: async ({ include }) => ({ ...lesson, course: { instructorId: 1, enrollments: enrolled && include?.course?.include?.enrollments?.where?.userId === 3 ? [{ userId: 3 }] : [] } }),
      updateMany: async ({ data }) => { updates++; if (uncertain) throw Error('Simulated unknown commit outcome'); if (conflict) return { count: 0 }; lesson = { ...lesson, ...data, sourceRevision: lesson.sourceRevision + 1 }; return { count: 1 } },
      create: async ({ data }) => { if (uncertain) throw Error('Simulated unknown create outcome'); lesson = { ...lesson, ...data }; return lesson },
    },
  }
  const app = express()
  app.use(express.json())
  app.use('/api/courses', createAuthenticate({ prisma, jwtSecret: secret }), createLessonsRouter({ prisma, storage }))
  app.use((error, _req, res, _next) => res.status(error.code === 'STORAGE_UNAVAILABLE' ? 503 : 500).json({ error: 'safe', code: error.code }))
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}/api/courses`
  const request = (path, id, opts = {}) => fetch(base + path, { ...opts, headers: { ...opts.headers, ...(id ? { Authorization: `Bearer ${token(id)}` } : {}) } })
  const upload = () => { const form = new FormData(); form.set('title', 'New lesson'); form.set('document', new Blob([bytes], { type: 'text/plain' }), 'lesson.txt'); return form }

  for (const id of [undefined, 2, 4, 5]) {
    const res = await request('/lessons/10/document', id)
    assert.equal(res.status, id ? 403 : 401)
    await res.arrayBuffer()
  }
  assert.equal(reads, 0)
  for (const id of [2, 3, 4, 5]) {
    const res = await request('/lessons/10/document', id, { method: 'PATCH', body: upload() })
    assert.equal(res.status, 403)
    await res.arrayBuffer()
  }
  assert.equal(saves, 0)
  for (const id of [1, 3]) {
    const res = await request('/lessons/10/document', id)
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('cache-control'), 'private, no-store')
    assert.ok(res.headers.get('content-disposition').includes('lesson.txt'))
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), bytes)
  }
  enrolled = false
  assert.equal((await request('/lessons/10/document', 3)).status, 403)
  assert.equal(reads, 2)

  const original = lesson.documentUrl
  let res = await request('/lessons/10/document', 1, { method: 'PATCH', body: upload() })
  assert.equal(res.status, 200); await res.json()
  assert.deepEqual(deletes, [original])
  assert.equal(lesson.sourceRevision, 1)
  conflict = true
  res = await request('/lessons/10/document', 1, { method: 'PATCH', body: upload() })
  assert.equal(res.status, 409); await res.json()
  assert.deepEqual(deletes, [original, 'new-object-2.txt'])
  conflict = false; uncertain = true
  res = await request('/lessons/10/document', 1, { method: 'PATCH', body: upload() })
  assert.equal(res.status, 500); await res.json()
  assert.equal(deletes.length, 2, 'uncertain commit must not remove potentially referenced object')
  res = await request('/20/lessons', 1, { method: 'POST', body: upload() })
  assert.equal(res.status, 500); await res.json()
  assert.equal(deletes.length, 2)
  uncertain = false; unavailable = true
  const before = updates
  res = await request('/lessons/10/document/process', 1, { method: 'POST' })
  assert.equal(res.status, 503); await res.json()
  assert.equal(updates, before, 'storage outage must preserve extracted text and revision')
})
