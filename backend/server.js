import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.ts'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const app = express()
const port = Number(process.env.PORT) || 3000
const connectionString = process.env.DATABASE_URL
const jwtSecret = process.env.JWT_SECRET || 'development-only-secret'
const validRoles = new Set(['INSTRUCTOR', 'STUDENT'])

if (!connectionString) {
  throw new Error('DATABASE_URL is required to start the backend')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

app.use(cors())
app.use(express.json())

const createToken = (user) => jwt.sign(
  { userId: user.id, role: user.role },
  jwtSecret,
  { expiresIn: '1d' },
)

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
})

const authenticate = async (request, response, next) => {
  const authorization = request.headers.authorization
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null

  if (!token) {
    return response.status(401).json({ error: 'Bạn chưa đăng nhập' })
  }

  try {
    const { userId } = jwt.verify(token, jwtSecret)
    const user = await prisma.user.findUnique({ where: { id: userId } })

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
  response.json({
    status: 'ok',
    service: 'ai-smart-learning-assistant-api',
  })
})

app.post('/api/auth/register', async (request, response) => {
  const { name, email, password, role } = request.body

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    return response.status(400).json({ error: 'Họ và tên phải từ 2 đến 80 ký tự' })
  }

  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || password.length < 6) {
    return response.status(400).json({ error: 'Email và mật khẩu tối thiểu 6 ký tự là bắt buộc' })
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
    console.error('Register error:', error)
    return response.status(500).json({ error: 'Không thể tạo tài khoản' })
  }
})

app.post('/api/auth/login', async (request, response) => {
  const { email, password } = request.body

  if (typeof email !== 'string' || typeof password !== 'string') {
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

app.get('/api/auth/me', authenticate, (request, response) => {
  response.json({ user: publicUser(request.user) })
})

const server = app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`)
})

const shutdown = async () => {
  server.close()
  await prisma.$disconnect()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
