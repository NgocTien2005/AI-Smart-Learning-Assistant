import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { prisma } from '../lib/prisma.js'

const router = Router()
const managedRoles = new Set(['INSTRUCTOR', 'STUDENT'])
const pageSize = 25

router.use(authenticate, authorizeRole('ADMIN'))

router.get('/users', async (request, response) => {
  const search = typeof request.query.q === 'string' ? request.query.q.trim().slice(0, 120) : ''
  const requestedPage = Number(request.query.page || 1)
  if (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > 100000) {
    return response.status(400).json({ error: 'Số trang không hợp lệ' })
  }
  const where = {
    role: { in: ['INSTRUCTOR', 'STUDENT'] },
    ...(search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    } : {}),
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (requestedPage - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { courses: true, enrollments: true, submissions: true } },
      },
    }),
    prisma.user.count({ where }),
  ])
  return response.json({ users, page: requestedPage, pageSize, total, totalPages: Math.ceil(total / pageSize) })
})

router.patch('/users/:userId', async (request, response) => {
  const userId = Number(request.params.userId)
  if (!Number.isInteger(userId) || userId < 1) return response.status(400).json({ error: 'ID người dùng không hợp lệ' })
  if (userId === request.user.id) return response.status(403).json({ error: 'Bạn không thể tự thay đổi hoặc khóa tài khoản quản trị của mình' })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  })
  if (!user || !managedRoles.has(user.role)) return response.status(404).json({ error: 'Không tìm thấy giảng viên hoặc học viên' })

  const data = {}
  if ('name' in request.body) {
    const name = typeof request.body.name === 'string' ? request.body.name.trim() : ''
    if (name.length < 2 || name.length > 80) return response.status(400).json({ error: 'Họ tên phải từ 2 đến 80 ký tự' })
    data.name = name
  }
  if ('role' in request.body) {
    if (!managedRoles.has(request.body.role)) return response.status(400).json({ error: 'Vai trò chỉ có thể là INSTRUCTOR hoặc STUDENT' })
    if (request.body.role !== user.role) {
      const relatedRecords = user.role === 'INSTRUCTOR'
        ? await prisma.course.count({ where: { instructorId: userId } })
        : await prisma.enrollment.count({ where: { userId } })
      if (relatedRecords > 0) {
        return response.status(409).json({
          error: user.role === 'INSTRUCTOR'
            ? 'Không thể đổi vai trò khi tài khoản còn sở hữu khóa học'
            : 'Không thể đổi vai trò khi tài khoản còn tham gia khóa học',
        })
      }
      data.role = request.body.role
    }
  }
  if ('isActive' in request.body) {
    if (typeof request.body.isActive !== 'boolean') return response.status(400).json({ error: 'Trạng thái tài khoản không hợp lệ' })
    if (request.body.isActive !== user.isActive) data.isActive = request.body.isActive
  }
  if (!Object.keys(data).length) return response.status(400).json({ error: 'Không có thay đổi hợp lệ' })

  if ('role' in data || 'isActive' in data) data.authVersion = { increment: 1 }
  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  })
  return response.json({ user: updated })
})

export default router

