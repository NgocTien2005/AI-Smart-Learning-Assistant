import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'

const VALID_ROLES = new Set(['INSTRUCTOR', 'STUDENT'])
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
})

const normalizeEmail = (email) => email.trim().toLowerCase()

export const createApp = ({ prisma, jwtSecret, corsOrigin = '*' }) => {
  if (!prisma) throw new Error('prisma is required')
  if (!jwtSecret) throw new Error('jwtSecret is required')

  const app = express()
  const allowedOrigins = corsOrigin === '*'
    ? '*'
    : corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean)

  app.use(cors({ origin: allowedOrigins }))
  app.use(express.json({ limit: '10kb' }))

  const createToken = (user) => jwt.sign(
    { userId: user.id, role: user.role },
    jwtSecret,
    { expiresIn: '1d' },
  )

  const authenticate = async (request, response, next) => {
    const authorization = request.headers.authorization
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : null

    if (!token) {
      return response.status(401).json({ error: 'Bạn chưa đăng nhập' })
    }

    try {
      const payload = jwt.verify(token, jwtSecret)
      if (typeof payload !== 'object' || !Number.isInteger(payload.userId)) {
        return response.status(401).json({ error: 'Phiên đăng nhập không hợp lệ' })
      }

      const user = await prisma.user.findUnique({ where: { id: payload.userId } })
      if (!user) {
        return response.status(401).json({ error: 'Phiên đăng nhập không hợp lệ' })
      }

      request.user = user
      return next()
    } catch {
      return response.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' })
    }
  }

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok', service: 'ai-smart-learning-assistant-api' })
  })

  app.post('/api/auth/register', async (request, response) => {
    const { name, email, password, role = 'STUDENT' } = request.body ?? {}
    const normalizedName = typeof name === 'string' ? name.trim() : ''
    const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : ''

    if (normalizedName.length < 2 || normalizedName.length > 80) {
      return response.status(400).json({ error: 'Họ và tên phải từ 2 đến 80 ký tự' })
    }
    if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) {
      return response.status(400).json({ error: 'Email không hợp lệ' })
    }
    if (typeof password !== 'string' || password.length < 6 || password.length > 72) {
      return response.status(400).json({ error: 'Mật khẩu phải từ 6 đến 72 ký tự' })
    }
    if (!VALID_ROLES.has(role)) {
      return response.status(400).json({ error: 'Role phải là INSTRUCTOR hoặc STUDENT' })
    }

    try {
      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
      if (existingUser) {
        return response.status(409).json({ error: 'Email đã được đăng ký' })
      }

      const user = await prisma.user.create({
        data: {
          name: normalizedName,
          email: normalizedEmail,
          password: await bcrypt.hash(password, 10),
          role,
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

  app.post('/api/auth/login', async (request, response) => {
    const { email, password } = request.body ?? {}
    const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : ''

    if (!EMAIL_PATTERN.test(normalizedEmail) || typeof password !== 'string' || !password) {
      return response.status(400).json({ error: 'Email và mật khẩu là bắt buộc' })
    }

    try {
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
      const passwordMatches = user ? await bcrypt.compare(password, user.password) : false
      if (!passwordMatches) {
        return response.status(401).json({ error: 'Email hoặc mật khẩu không đúng' })
      }

      return response.json({ user: publicUser(user), token: createToken(user) })
    } catch (error) {
      console.error('Login error:', error)
      return response.status(500).json({ error: 'Không thể đăng nhập' })
    }
  })

  app.get('/api/auth/me', authenticate, (request, response) => {
    response.json({ user: publicUser(request.user) })
  })

  app.use((error, _request, response, next) => {
    if (error?.type === 'entity.parse.failed') {
      return response.status(400).json({ error: 'Dữ liệu JSON không hợp lệ' })
    }
    return next(error)
  })

  return app
}
