const mutation = request => ['POST', 'PUT', 'PATCH'].includes(request.method)
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)

export function requireObjectBody(request, response, next) {
  if (!mutation(request) || isObject(request.body)) return next()
  return response.status(400).json({ error: 'Nội dung yêu cầu phải là một đối tượng JSON' })
}

// Bodyless commands (progress/process) are valid. Give their existing handlers
// an empty object while rejecting parsed arrays. Multer must parse its own body.
export function requestBoundary(request, response, next) {
  if (!mutation(request) || request.is('multipart/form-data')) return next()
  if (request.body === undefined) request.body = {}
  return requireObjectBody(request, response, next)
}
