import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { validRoles } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middleware/authenticate.js'
import { createToken, publicUser } from '../utils/auth.js'

const router = Router()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isValidPassword = (password) => typeof password === 'string' && password.length >= 6 && password.length <= 72

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

router.get('/me', authenticate, (request, response) => {
  response.json({ user: publicUser(request.user) })
})

export default router
