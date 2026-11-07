import { Router } from 'express'
import { createChallengeStore, createGoogleVerifier, googleError } from '../services/googleIdentity.js'

const COOKIE = 'lumina_google_binding'
const messages = {
  GOOGLE_NOT_CONFIGURED: 'Đăng nhập Google hiện chưa sẵn sàng. Hãy dùng email và mật khẩu.',
  GOOGLE_INVALID: 'Yêu cầu Google không hợp lệ hoặc đã hết hạn. Hãy bắt đầu lại.',
  GOOGLE_UNAVAILABLE: 'Chưa thể xác minh với Google. Hãy thử lại sau hoặc dùng mật khẩu.',
  GOOGLE_RATE_LIMIT: 'Có quá nhiều yêu cầu Google. Hãy thử lại sau.',
  GOOGLE_NOT_LINKED: 'Không thể đăng nhập Google. Hãy dùng tài khoản Lumina đã có và liên kết Google trong Tài khoản.',
  GOOGLE_LINK_CONFLICT: 'Không thể liên kết. Email Google phải trùng email Lumina và chưa liên kết với tài khoản khác.',
}
const userSelect = { id: true, name: true, email: true, role: true, isActive: true, authVersion: true, googleSubject: true }
const readBinding = request => {
  const values = (request.headers.cookie || '').split(';').map(value => value.trim()).filter(value => value.startsWith(COOKIE + '='))
  return values.length === 1 ? values[0].slice(COOKIE.length + 1) : undefined
}

export function createGoogleAuthRouter({ prisma, authenticate, createToken, publicUser, clientId = '', secureCookie = false, verify = createGoogleVerifier({ clientId }), challenges = createChallengeStore() }) {
  const router = Router()
  const configured = (_request, response, next) => clientId ? next() : response.status(503).json({ code: 'GOOGLE_NOT_CONFIGURED', error: messages.GOOGLE_NOT_CONFIGURED })
  const failure = (response, error) => {
    const code = Object.hasOwn(messages, error?.code) ? error.code : 'GOOGLE_INTERNAL_ERROR'
    return response.status(code === 'GOOGLE_INTERNAL_ERROR' ? 500 : error.status || 401).json({ code, error: messages[code] || 'Không thể hoàn tất yêu cầu Google. Hãy kiểm tra trạng thái trước khi thử lại.' })
  }
  const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: secureCookie, path: '/api/auth/google', maxAge: 300000 }

  router.post('/challenge', configured, (request, response, next) => {
    if (!['login', 'link'].includes(request.body?.intent)) return response.status(400).json({ error: 'Mục đích yêu cầu Google không hợp lệ' })
    return request.body.intent === 'link' ? authenticate(request, response, next) : next()
  }, (request, response) => {
    try {
      const { binding, ...challenge } = challenges.issue({ ip: request.ip, intent: request.body.intent, user: request.body.intent === 'link' ? request.user : undefined })
      response.set('Cache-Control', 'no-store')
      response.cookie(COOKIE, binding, cookieOptions)
      return response.json(challenge)
    } catch (error) { return failure(response, error) }
  })

  router.get('/link', authenticate, async (request, response) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: request.user.id }, select: userSelect })
      if (!user?.isActive || user.authVersion !== request.user.authVersion) return response.status(401).json({ code: 'SESSION_INVALID', error: 'Phiên đăng nhập không hợp lệ' })
      response.set('Cache-Control', 'no-store')
      return response.json({ linked: Boolean(user.googleSubject) })
    } catch (error) { return failure(response, error) }
  })

  const exchange = intent => async (request, response) => {
    const { challengeId, credential } = request.body || {}
    if (typeof challengeId !== 'string' || !/^[a-f0-9]{64}$/.test(challengeId) || typeof credential !== 'string' || !credential || credential.length > 20000) return response.status(400).json({ error: 'Dữ liệu yêu cầu Google không hợp lệ' })
    response.set('Cache-Control', 'no-store')
    try {
      const owner = intent === 'link' ? request.user : undefined
      const { nonce } = challenges.consume(challengeId, readBinding(request), intent, owner)
      response.clearCookie(COOKIE, { ...cookieOptions, maxAge: undefined })
      const identity = await verify(credential, nonce)
      if (intent === 'login') {
        // Deliberately no email lookup, registration, role assignment or link write.
        const user = await prisma.user.findUnique({ where: { googleSubject: identity.sub }, select: userSelect })
        if (!user?.isActive) throw googleError('GOOGLE_NOT_LINKED', 403)
        return response.json({ user: publicUser(user), token: createToken(user) })
      }
      const user = await prisma.user.findUnique({ where: { id: owner.id }, select: userSelect })
      if (!user?.isActive || user.authVersion !== owner.authVersion) return response.status(401).json({ code: 'SESSION_INVALID', error: 'Phiên đăng nhập không hợp lệ' })
      if (user.email.trim().toLowerCase() !== identity.email || (user.googleSubject && user.googleSubject !== identity.sub)) throw googleError('GOOGLE_LINK_CONFLICT', 409)
      const result = await prisma.user.updateMany({
        where: { id: user.id, isActive: true, authVersion: owner.authVersion, email: user.email, googleSubject: user.googleSubject },
        data: { googleSubject: identity.sub },
      })
      if (result.count !== 1) throw googleError('GOOGLE_LINK_CONFLICT', 409)
      return response.json({ linked: true })
    } catch (error) {
      // Never log provider credentials/claims or Prisma request arguments.
      return failure(response, error?.code === 'P2002' ? googleError('GOOGLE_LINK_CONFLICT', 409) : error)
    }
  }
  router.post('/login', configured, exchange('login'))
  router.post('/link', configured, authenticate, exchange('link'))
  return router
}
