import { createHash, createPublicKey, randomBytes, timingSafeEqual } from 'node:crypto'
import jwt from 'jsonwebtoken'

const TTL = 300000
const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs'
const digest = (value) => createHash('sha256').update(value).digest()
const same = (a, b) => typeof a === 'string' && typeof b === 'string' && timingSafeEqual(digest(a), digest(b))
export const googleError = (code, status = 401) => Object.assign(new Error(code), { code, status })

export function createChallengeStore({ now = Date.now, maxEntries = 1000, maxPerIp = 20 } = {}) {
  const entries = new Map()
  const limits = new Map()
  return {
    issue({ ip, intent, user }) {
      const time = now()
      for (const [id, item] of entries) if (item.expiresAt <= time) entries.delete(id)
      for (const [id, item] of limits) if (item.expiresAt <= time) limits.delete(id)
      const limit = limits.get(ip)
      if (entries.size >= maxEntries || (!limit && limits.size >= maxEntries) || limit?.count >= maxPerIp) throw googleError('GOOGLE_RATE_LIMIT', 429)
      limits.set(ip, { count: (limit?.count || 0) + 1, expiresAt: limit?.expiresAt || time + TTL })
      const challengeId = randomBytes(32).toString('hex')
      const nonce = randomBytes(32).toString('hex')
      const binding = randomBytes(32).toString('hex')
      entries.set(challengeId, { nonce, bindingHash: digest(binding), intent, userId: user?.id, authVersion: user?.authVersion, expiresAt: time + TTL })
      return { challengeId, nonce, binding, expiresIn: TTL / 1000 }
    },
    consume(id, binding, intent, user) {
      const entry = entries.get(id)
      entries.delete(id)
      if (!entry || typeof binding !== 'string' || entry.expiresAt <= now() || entry.intent !== intent || entry.userId !== user?.id || entry.authVersion !== user?.authVersion || !timingSafeEqual(entry.bindingHash, digest(binding))) throw googleError('GOOGLE_INVALID')
      return { nonce: entry.nonce }
    },
  }
}

async function boundedJson(response) {
  if (!response.ok || Number(response.headers.get('content-length')) > 65536 || !response.body) throw googleError('GOOGLE_UNAVAILABLE', 503)
  const reader = response.body.getReader()
  const parts = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 65536) throw googleError('GOOGLE_UNAVAILABLE', 503)
      parts.push(Buffer.from(value))
    }
    return JSON.parse(Buffer.concat(parts).toString('utf8'))
  } finally {
    await reader.cancel().catch(() => {})
  }
}

export function createGoogleVerifier({ clientId, fetchKeys = (url, options) => fetch(url, options), now = Date.now } = {}) {
  let cache = null
  let pending = null
  let refreshedAt = -Infinity
  async function keys(kid) {
    const time = now()
    if (cache?.expiresAt > time && cache.keys.has(kid)) return cache.keys
    if (cache?.expiresAt > time && time - refreshedAt < 30000) return cache.keys
    if (!pending) {
      refreshedAt = time
      pending = (async () => {
        const response = await fetchKeys(JWKS_URL, { signal: AbortSignal.timeout(5000), redirect: 'error' })
        const data = await boundedJson(response)
        if (!Array.isArray(data.keys) || data.keys.length < 1 || data.keys.length > 10) throw googleError('GOOGLE_UNAVAILABLE', 503)
        const parsed = new Map()
        for (const jwk of data.keys) {
          if (jwk.kty !== 'RSA' || jwk.alg !== 'RS256' || jwk.use !== 'sig' || typeof jwk.kid !== 'string' || jwk.kid.length > 128 || parsed.has(jwk.kid)) throw googleError('GOOGLE_UNAVAILABLE', 503)
          const key = createPublicKey({ key: jwk, format: 'jwk' })
          if (key.asymmetricKeyDetails?.modulusLength < 2048) throw googleError('GOOGLE_UNAVAILABLE', 503)
          parsed.set(jwk.kid, key)
        }
        const maxAge = Number(response.headers.get('cache-control')?.match(/\bmax-age=(\d+)/)?.[1]) || 60
        cache = { keys: parsed, expiresAt: now() + Math.min(maxAge, 3600) * 1000 }
        return parsed
      })().catch(() => { throw googleError('GOOGLE_UNAVAILABLE', 503) }).finally(() => { pending = null })
    }
    return pending
  }
  return async (credential, nonce) => {
    if (!clientId) throw googleError('GOOGLE_NOT_CONFIGURED', 503)
    if (typeof credential !== 'string' || credential.length > 20000) throw googleError('GOOGLE_INVALID')
    let decoded
    try { decoded = jwt.decode(credential, { complete: true }) } catch { /* fail closed below */ }
    const { alg, kid } = decoded?.header || {}
    if (alg !== 'RS256' || typeof kid !== 'string' || !kid || kid.length > 128) throw googleError('GOOGLE_INVALID')
    const key = (await keys(kid)).get(kid)
    if (!key) throw googleError('GOOGLE_INVALID')
    try {
      const claims = jwt.verify(credential, key, { algorithms: ['RS256'], audience: clientId, issuer: ['accounts.google.com', 'https://accounts.google.com'], clockTimestamp: Math.floor(now() / 1000) })
      const time = Math.floor(now() / 1000)
      if (claims.aud !== clientId || (claims.azp && claims.azp !== clientId) || !Number.isInteger(claims.exp) || !Number.isInteger(claims.iat) || claims.iat > time + 30 || claims.iat < time - 3660 || typeof claims.sub !== 'string' || !/^[\x21-\x7e]{1,255}$/.test(claims.sub) || claims.email_verified !== true || typeof claims.email !== 'string' || claims.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claims.email.trim()) || !same(claims.nonce, nonce)) throw googleError('GOOGLE_INVALID')
      return { sub: claims.sub, email: claims.email.trim().toLowerCase() }
    } catch {
      throw googleError('GOOGLE_INVALID')
    }
  }
}
