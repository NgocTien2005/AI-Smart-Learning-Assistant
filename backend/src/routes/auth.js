import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { validRoles } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middleware/authenticate.js'
import { isEmailConfigured, sendPasswordResetEmail } from '../services/email.js'
import { createToken, publicUser } from '../utils/auth.js'
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetToken,
  PASSWORD_RESET_TTL_MS,
} from '../utils/passwordReset.js'

const router = Router()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isValidPassword = (password) => typeof password === 'string' && password.length >= 6 && password.length <= 72
const forgotPasswordMessage = 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.'
const resetRateLimits = new Map()
const RESET_RATE_WINDOW_MS = 15 * 60 * 1000
const RESET_RATE_MAX_REQUESTS = 5

const forgotPasswordRateLimit = (request, response, next) => {
  const now = Date.now()
  for (const [storedKey, storedEntry] of resetRateLimits) {
    if (now - storedEntry.startedAt >= RESET_RATE_WINDOW_MS) resetRateLimits.delete(storedKey)
  }

  const normalizedEmail = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : 'invalid'
  const key = `${request.ip || request.socket.remoteAddress || 'unknown'}:${normalizedEmail}`
  const entry = resetRateLimits.get(key)

  if (!entry || now - entry.startedAt >= RESET_RATE_WINDOW_MS) {
    resetRateLimits.set(key, { startedAt: now, count: 1 })
    return next()
  }

  if (entry.count >= RESET_RATE_MAX_REQUESTS) {
    return response.status(429).json({ error: 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau.' })
  }

  entry.count += 1
  return next()
}

router.post('/register', async (request, response) => {
  const { name, email, password, role } = request.body

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    return response.status(400).json({ error: 'Họ và tên phải từ 2 đến 80 ký tự' })
  }

  if (typeof email !== 'string' || !emailPattern.test(email.trim()) || !isValidPassword(password)) {
    return response.status(400).json({ error: 'Email hợp lệ và mật khẩu từ 6 đến 72 ký tự là bắt buộc' })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const normalizedRole = role || 'STUDENT'

  if (!validRoles.has(normalizedRole)) {
    return response.status(400).json({ error: 'Role phải là INSTRUCTOR hoặc STUDENT' })
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })

    if (existingUser) {
      return response.status(409).json({ error: 'Email đã được đăng ký' })
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        role: normalizedRole,
      },
    })

    return response.status(201).json({ user: publicUser(user), token: createToken(user) })
  } catch (error) {
    if (error?.code === 'P2002') {
      return response.status(409).json({ error: 'Email đã được đăng ký' })
    }

    console.error('Register error:', error)
    return response.status(500).json({ error: 'Không thể tạo tài khoản' })
  }
})

router.post('/login', async (request, response) => {
  const { email, password } = request.body

  if (typeof email !== 'string' || !emailPattern.test(email.trim()) || !isValidPassword(password)) {
    return response.status(400).json({ error: 'Email và mật khẩu là bắt buộc' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    const passwordMatches = user && await bcrypt.compare(password, user.password)

    if (!passwordMatches) {
      return response.status(401).json({ error: 'Email hoặc mật khẩu không đúng' })
    }

    return response.json({ user: publicUser(user), token: createToken(user) })
  } catch (error) {
    console.error('Login error:', error)
    return response.status(500).json({ error: 'Không thể đăng nhập' })
  }
})

router.post('/forgot-password', forgotPasswordRateLimit, async (request, response) => {
  const { email } = request.body

  if (typeof email !== 'string' || !emailPattern.test(email.trim())) {
    return response.status(400).json({ error: 'Email không hợp lệ' })
  }

  if (!isEmailConfigured()) {
    return response.status(503).json({ error: 'Dịch vụ email chưa được cấu hình' })
  }

  const normalizedEmail = email.trim().toLowerCase()

  try {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    const cooldownStartedAt = new Date(Date.now() - 60 * 1000)

    if (!user || (user.passwordResetRequestedAt && user.passwordResetRequestedAt > cooldownStartedAt)) {
      return response.json({ message: forgotPasswordMessage })
    }

    const token = createPasswordResetToken()
    const tokenHash = hashPasswordResetToken(token)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        passwordResetRequestedAt: new Date(),
      },
    })

    try {
      await sendPasswordResetEmail({ recipient: normalizedEmail, token })
    } catch (error) {
      await prisma.user.updateMany({
        where: { id: user.id, passwordResetTokenHash: tokenHash },
        data: { passwordResetTokenHash: null, passwordResetExpiresAt: null },
      })
      console.error('Password reset email delivery failed:', error?.code || 'UNKNOWN_ERROR')
    }

    return response.json({ message: forgotPasswordMessage })
  } catch (error) {
    console.error('Forgot password error:', error)
    return response.status(500).json({ error: 'Không thể xử lý yêu cầu đặt lại mật khẩu' })
  }
})

router.post('/reset-password', async (request, response) => {
  const { token, password } = request.body

  if (!isPasswordResetToken(token) || !isValidPassword(password)) {
    return response.status(400).json({ error: 'Liên kết không hợp lệ hoặc mật khẩu phải từ 6 đến 72 ký tự' })
  }

  const tokenHash = hashPasswordResetToken(token)

  try {
    const user = await prisma.user.findUnique({ where: { passwordResetTokenHash: tokenHash } })

    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date()) {
      return response.status(400).json({ error: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' })
    }

    const result = await prisma.user.updateMany({
      where: {
        id: user.id,
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
      data: {
        password: await bcrypt.hash(password, 10),
        authVersion: { increment: 1 },
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordResetRequestedAt: null,
      },
    })

    if (result.count !== 1) {
      return response.status(400).json({ error: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' })
    }

    return response.json({ message: 'Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.' })
  } catch (error) {
    console.error('Reset password error:', error)
    return response.status(500).json({ error: 'Không thể đặt lại mật khẩu' })
  }
})

router.get('/me', authenticate, (request, response) => {
  response.json({ user: publicUser(request.user) })
})

export default router
