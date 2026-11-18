import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile, stat, unlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import { readBounded, withProviderDeadline } from './providerHttp.js'

const MAX_BYTES = 10 * 1024 * 1024
const extensions = new Set(['.pdf', '.txt', '.md', '.csv'])
const localName = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,199}$/
const objectName = /^lumina\/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.(pdf|txt|md|csv)$/
const unavailable = () => Object.assign(new Error('Kho tài liệu tạm thời không khả dụng'), { code: 'STORAGE_UNAVAILABLE' })
const missing = () => Object.assign(new Error('Tệp tài liệu không còn tồn tại'), { code: 'DOCUMENT_NOT_FOUND' })

export const createDocumentStorage = ({ env = process.env, directory = resolve(env.UPLOAD_DIR || 'uploads'), fetchImpl = fetch, timeoutMs = 15000 } = {}) => {
  const provider = env.DOCUMENT_STORAGE || 'local'
  if (!['local', 'supabase'].includes(provider)) throw unavailable()
  const bucket = env.SUPABASE_STORAGE_BUCKET
  const key = env.SUPABASE_STORAGE_KEY
  let origin
  if (provider === 'supabase') {
    try {
      const url = new URL(env.SUPABASE_URL)
      if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) || url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(bucket || '') || !key || /\s/.test(key)) throw unavailable()
      origin = url.origin
    } catch { throw unavailable() }
  }
  const headers = () => ({ apikey: key, ...(key?.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}) })
  const identity = reference => {
    if (typeof reference !== 'string') throw unavailable()
    if (reference.startsWith('supabase:')) {
      const prefix = `supabase:${bucket}/`
      if (provider !== 'supabase' || !reference.startsWith(prefix) || !objectName.test(reference.slice(prefix.length))) throw unavailable()
      return { remote: true, name: reference.slice(prefix.length) }
    }
    if (!localName.test(reference) || reference === '.' || reference === '..') throw unavailable()
    return { remote: false, name: reference }
  }
  const remote = async (action, name, buffer) => {
    try {
      return await withProviderDeadline(async signal => {
        const request = (path, options = {}) => fetchImpl(`${origin}/storage/v1${path}`, { ...options, headers: { ...headers(), ...options.headers }, signal, redirect: 'error' })
        const metadata = await request(`/bucket/${bucket}`)
        if (!metadata.ok) { void metadata.body?.cancel().catch(() => {}); throw unavailable() }
        const info = JSON.parse((await readBounded(metadata, 65536)).toString())
        if (info.id !== bucket || info.public !== false) throw unavailable()
        const encoded = name.split('/').map(encodeURIComponent).join('/')
        let response
        if (action === 'read') response = await request(`/object/authenticated/${bucket}/${encoded}`)
        else if (action === 'save') response = await request(`/object/${bucket}/${encoded}`, { method: 'POST', headers: { 'content-type': 'application/octet-stream', 'x-upsert': 'false' }, body: buffer })
        else response = await request(`/object/${bucket}`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prefixes: [name] }) })
        if (!response.ok) {
          // Storage uses HTTP400 + statusCode404 for some missing-object responses.
          if (action === 'read' && [400, 404].includes(response.status)) {
            if (response.status === 404) { void response.body?.cancel().catch(() => {}); throw missing() }
            const body = JSON.parse((await readBounded(response, 65536)).toString())
            if (String(body.statusCode) === '404') throw missing()
          }
          void response.body?.cancel().catch(() => {})
          throw unavailable()
        }
        const bytes = await readBounded(response, action === 'read' ? MAX_BYTES : 65536)
        if (action === 'read') return bytes
      }, timeoutMs)
    } catch (error) { if (error.code === 'DOCUMENT_NOT_FOUND') throw error; throw unavailable() }
  }
  return {
    async save(buffer, extension) {
      if (!Buffer.isBuffer(buffer) || buffer.length > MAX_BYTES || !extensions.has(extension)) throw unavailable()
      const name = `${randomUUID()}${extension}`
      if (provider === 'supabase') { await remote('save', `lumina/${name}`, buffer); return `supabase:${bucket}/lumina/${name}` }
      await mkdir(directory, { recursive: true })
      await writeFile(resolve(directory, name), buffer, { flag: 'wx' })
      return name
    },
    async read(reference) {
      const ref = identity(reference)
      if (ref.remote) return remote('read', ref.name)
      try {
        const file = resolve(directory, ref.name)
        if ((await stat(file)).size > MAX_BYTES) throw unavailable()
        const bytes = await readFile(file)
        if (bytes.length > MAX_BYTES) throw unavailable()
        return bytes
      } catch (error) { if (error.code === 'ENOENT') throw missing(); throw unavailable() }
    },
    async remove(reference) {
      if (!reference) return
      const ref = identity(reference)
      if (ref.remote) return remote('remove', ref.name)
      try { await unlink(resolve(directory, ref.name)) }
      catch (error) { if (error.code !== 'ENOENT') throw unavailable() }
    },
  }
}
