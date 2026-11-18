import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createDocumentStorage } from '../src/services/documentStorage.js'

const remoteEnv = { DOCUMENT_STORAGE: 'supabase', SUPABASE_URL: 'https://synthetic.supabase.co', SUPABASE_STORAGE_BUCKET: 'documents', SUPABASE_STORAGE_KEY: 'sb_secret_synthetic_not_real' }
const json = (value, status = 200) => new Response(JSON.stringify(value), { status })
const fixture = () => {
  const calls = [], objects = new Map()
  const fetchImpl = async (url, options) => {
    const path = new URL(url).pathname
    calls.push({ path, ...options })
    assert.equal(options.redirect, 'error')
    assert.equal(options.headers.apikey, remoteEnv.SUPABASE_STORAGE_KEY)
    assert.equal(options.headers.Authorization, undefined)
    if (path.includes('/bucket/')) return json({ id: 'documents', public: false })
    if (options.method === 'POST') { objects.set(path.split('/documents/')[1], Buffer.from(options.body)); return json({ Key: 'not-disclosed' }) }
    if (options.method === 'DELETE') { for (const key of JSON.parse(options.body).prefixes) objects.delete(key); return json([]) }
    const bytes = objects.get(path.split('/documents/')[1])
    return bytes ? new Response(bytes) : json({ statusCode: '404', error: 'not_found' }, 400)
  }
  return { calls, objects, fetchImpl }
}

test('remote private documents round-trip across adapter restart, exact removal, no public URLs', async () => {
  const f = fixture(), store = createDocumentStorage({ env: remoteEnv, fetchImpl: f.fetchImpl })
  const bytes = Buffer.from('Synthetic lesson text')
  const ref = await store.save(bytes, '.txt')
  assert.match(ref, /^supabase:documents\/lumina\/[a-f0-9-]+\.txt$/)
  assert.equal(f.calls[1].headers['x-upsert'], 'false')
  assert.deepEqual(await createDocumentStorage({ env: remoteEnv, fetchImpl: f.fetchImpl }).read(ref), bytes)
  await store.remove(ref)
  assert.equal(f.objects.size, 0)
  await assert.rejects(store.read(ref), { code: 'DOCUMENT_NOT_FOUND' })
})

test('storage rejects public bucket, wrong identity and bad configuration without object IO', async () => {
  let calls = 0
  const store = createDocumentStorage({ env: remoteEnv, fetchImpl: async () => { calls++; return json({ id: 'documents', public: true }) } })
  await assert.rejects(store.save(Buffer.from('test'), '.txt'), { code: 'STORAGE_UNAVAILABLE' })
  assert.equal(calls, 1)
  for (const ref of ['../private.env', '/absolute.txt', 'supabase:other/lumina/test.txt', 'supabase:documents/lumina/../secret', 'https://foreign.invalid/file']) await assert.rejects(store.read(ref))
  assert.equal(calls, 1)
  for (const env of [{ DOCUMENT_STORAGE: 'unknown' }, { ...remoteEnv, SUPABASE_STORAGE_KEY: '' }, { ...remoteEnv, SUPABASE_URL: 'http://synthetic.supabase.co' }, { ...remoteEnv, SUPABASE_URL: 'https://evil.invalid' }]) assert.throws(() => createDocumentStorage({ env }))
})

test('storage rejects remote failures, oversize/slow bodies with sanitized errors and no fallback', async () => {
  for (const status of [401, 403, 429, 500]) {
    const store = createDocumentStorage({ env: remoteEnv, fetchImpl: async () => json({ secret: 'upstream-secret' }, status) })
    await assert.rejects(store.save(Buffer.from('test'), '.txt'), error => error.code === 'STORAGE_UNAVAILABLE' && !error.message.includes('upstream-secret'))
  }
  const store = createDocumentStorage({ env: remoteEnv, fetchImpl: async () => new Response('x'.repeat(65537)) })
  await assert.rejects(store.save(Buffer.from('test'), '.txt'), { code: 'STORAGE_UNAVAILABLE' })
  const f = fixture()
  const slow = createDocumentStorage({ env: remoteEnv, timeoutMs: 20, fetchImpl: async (url, opts) => {
    if (url.includes('/bucket/')) return f.fetchImpl(url, opts)
    return new Response(new ReadableStream({ start() {} }))
  } })
  await assert.rejects(slow.read('supabase:documents/lumina/00000000-0000-4000-8000-000000000000.txt'), { code: 'STORAGE_UNAVAILABLE' })
  await assert.rejects(store.save(Buffer.alloc(10 * 1024 * 1024 + 1), '.txt'))
})

test('local references remain local after remote selection and local writes do not need providers', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'lumina-storage-'))
  t.after(() => rm(directory, { recursive: true, force: true })) // only this newly-created test temp directory
  const local = createDocumentStorage({ env: {}, directory })
  const ref = await local.save(Buffer.from('local'), '.md')
  const remote = createDocumentStorage({ env: remoteEnv, directory, fetchImpl: async () => { throw Error('Must not call provider for legacy reference') } })
  assert.equal((await remote.read(ref)).toString(), 'local')
  await remote.remove(ref)
  await assert.rejects(local.read(ref), { code: 'DOCUMENT_NOT_FOUND' })
})

test('remote download caps actual streamed bytes, validates bucket identity and sanitizes network faults', async () => {
  const ref = 'supabase:documents/lumina/00000000-0000-4000-8000-000000000000.txt'
  const huge = createDocumentStorage({ env: remoteEnv, fetchImpl: async url => url.includes('/bucket/') ? json({ id: 'documents', public: false }) : new Response(Buffer.alloc(10 * 1024 * 1024 + 1)) })
  await assert.rejects(huge.read(ref), { code: 'STORAGE_UNAVAILABLE' })
  const wrong = createDocumentStorage({ env: remoteEnv, fetchImpl: async () => json({ id: 'other', public: false }) })
  await assert.rejects(wrong.read(ref), { code: 'STORAGE_UNAVAILABLE' })
  const network = createDocumentStorage({ env: remoteEnv, fetchImpl: async () => { throw Error('sensitive-provider-url') } })
  await assert.rejects(network.read(ref), error => error.code === 'STORAGE_UNAVAILABLE' && !error.message.includes('sensitive'))
})
