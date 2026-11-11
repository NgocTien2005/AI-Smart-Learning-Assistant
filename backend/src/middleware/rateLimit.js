import { createHash, randomBytes } from 'node:crypto'

const message = 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau.'
const ipKey = request => request.ip || request.socket?.remoteAddress || 'unknown'
const emailKey = request => `${ipKey(request)}:${typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : 'invalid'}`
const userKey = request => String(request.user.id)
const quarterHour = 15 * 60 * 1000

// Single-process protection only. Never trust client-supplied forwarding headers.
// Capacity fails closed instead of evicting active entries and resetting budgets.
export function createRateLimit({ max, windowMs, key = ipKey, maxKeys = 10000, now = Date.now }) {
  if (![max, windowMs, maxKeys].every(value => Number.isSafeInteger(value) && value > 0)) throw new Error('Invalid rate limit configuration')
  const entries = new Map()
  const salt = randomBytes(32)
  let nextSweep = 0
  return (request, response, next) => {
    const time = now()
    if (time >= nextSweep || entries.size >= maxKeys) {
      for (const [storedKey, entry] of entries) if (entry.expiresAt <= time) entries.delete(storedKey)
      nextSweep = time + Math.min(windowMs, 30000)
    }
    const hashedKey = createHash('sha256').update(salt).update(String(key(request))).digest('hex')
    let entry = entries.get(hashedKey)
    if (entry?.expiresAt <= time) { entries.delete(hashedKey); entry = undefined }
    if (!entry && entries.size < maxKeys) {
      entry = { count: 0, expiresAt: time + windowMs }
      entries.set(hashedKey, entry)
    }
    if (!entry || entry.count >= max) {
      response.set('Retry-After', String(Math.max(1, Math.ceil(((entry?.expiresAt ?? nextSweep) - time) / 1000))))
      return response.status(429).json({ code: 'RATE_LIMITED', error: message })
    }
    entry.count++
    return next()
  }
}

export function createAuthLimits(options = {}) {
  const limit = (max, windowMs, key) => createRateLimit({ ...options, max, windowMs, key })
  return {
    login: [limit(100, quarterHour, ipKey), limit(10, quarterHour, emailKey)],
    register: limit(40, 60 * 60 * 1000, ipKey),
    forgot: [limit(20, quarterHour, ipKey), limit(5, quarterHour, emailKey)],
    reset: limit(30, quarterHour, ipKey),
    change: limit(20, quarterHour, userKey),
  }
}

export const createJoinLimit = options => createRateLimit({ ...options, max: 20, windowMs: quarterHour, key: userKey })
