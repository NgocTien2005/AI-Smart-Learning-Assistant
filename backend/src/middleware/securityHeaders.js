export function securityHeaders(_request, response, next) {
  response.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
  })
  next()
}

// Never serialize arbitrary errors: Prisma/provider errors can contain payloads,
// credentials, queries or URLs. Event text is an internal constant, not input.
export function logSafeError(event, error) {
  const knownCodes = new Set(['EAUTH', 'ECONNECTION', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EENVELOPE', 'ESOCKET'])
  const code = typeof error?.code === 'string' && (/^P\d{4}$/.test(error.code) || knownCodes.has(error.code))
    ? error.code : 'INTERNAL_ERROR'
  console.error(event, code)
}
