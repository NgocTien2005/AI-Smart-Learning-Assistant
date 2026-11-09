import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { parseId, canAccessCourse } from '../utils/courseAccess.js'
import { randomBytes } from 'node:crypto'
import { authenticate } from '../middleware/authenticate.js'
import quizAttemptsRouter from './quizAttempts.js'
import assignmentsRouter from './assignments.js'
import lessonsRouter, { lessonSelect } from './lessons.js'
import { removeStoredFile } from '../services/courseDocuments.js'
import { addStudentProgress } from '../services/courseProgress.js'

const router = Router()

const courseInclude = {
  instructor: { select: { id: true, name: true, email: true } },
  _count: { select: { lessons: true, enrollments: true } },
}

const createJoinCode = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const joinCode = randomBytes(4).toString('hex').toUpperCase()
    const existing = await prisma.course.findUnique({ where: { joinCode }, select: { id: true } })
    if (!existing) return joinCode
  }

  throw new Error('Không thể tạo mã tham gia duy nhất')
}

router.use(authenticate)
router.use(quizAttemptsRouter)
router.use(assignmentsRouter)
router.use(lessonsRouter)

router.get('/', async (request, response) => {
  const where = request.user.role === 'INSTRUCTOR'
    ? { instructorId: request.user.id }
    : { enrollments: { some: { userId: request.user.id } } }
  const courses = await prisma.course.findMany({
    where,
    include: courseInclude,
    orderBy: { updatedAt: 'desc' },
  })

  return response.json({ courses: request.user.role === 'STUDENT' ? await addStudentProgress(prisma, courses, request.user.id) : courses })
})

router.post('/', authorizeRole('INSTRUCTOR'), async (request, response) => {
  const { title, description = '' } = request.body
  const normalizedTitle = typeof title === 'string' ? title.trim() : ''
  const normalizedDescription = typeof description === 'string' ? description.trim() : ''

  if (normalizedTitle.length < 3 || normalizedTitle.length > 120) {
    return response.status(400).json({ error: 'Tên khóa học phải từ 3 đến 120 ký tự' })
  }

  if (normalizedDescription.length > 4000) {
    return response.status(400).json({ error: 'Mô tả khóa học không được vượt quá 4000 ký tự' })
  }

  const course = await prisma.course.create({
    data: {
      title: normalizedTitle,
      description: normalizedDescription,
      joinCode: await createJoinCode(),
      instructorId: request.user.id,
    },
    include: courseInclude,
  })

  return response.status(201).json({ course })
})

router.post('/join', authorizeRole('STUDENT'), async (request, response) => {
  const joinCode = typeof request.body.joinCode === 'string' ? request.body.joinCode.trim().toUpperCase() : ''
  if (!/^[A-F0-9]{8}$/.test(joinCode)) {
    return response.status(400).json({ error: 'Mã tham gia phải gồm 8 ký tự' })
  }

  const course = await prisma.course.findUnique({ where: { joinCode }, select: { id: true } })
  if (!course) return response.status(404).json({ error: 'Không tìm thấy khóa học với mã này' })

  try {
    await prisma.enrollment.create({ data: { courseId: course.id, userId: request.user.id } })
  } catch (error) {
    if (error?.code !== 'P2002') throw error
  }

  const enrolledCourse = await prisma.course.findUnique({ where: { id: course.id }, include: courseInclude })
  const [courseWithProgress] = await addStudentProgress(prisma, [enrolledCourse], request.user.id)
  return response.json({ course: courseWithProgress })
})

router.delete('/:courseId/enrollment', authorizeRole('STUDENT'), async (request, response) => {
  const courseId = parseId(request.params.courseId)
  if (!courseId) return response.status(400).json({ error: 'ID khóa học không hợp lệ' })

  const result = await prisma.enrollment.deleteMany({
    where: { courseId, userId: request.user.id },
  })
  if (result.count === 0) return response.status(404).json({ error: 'Bạn chưa tham gia khóa học này' })

  return response.status(204).end()
})

router.get('/:courseId/students', authorizeRole('INSTRUCTOR'), async (request, response) => {
  const courseId = parseId(request.params.courseId)
  if (!courseId) return response.status(400).json({ error: 'ID khóa học không hợp lệ' })

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      instructorId: true,
      enrollments: {
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, user: { select: { id: true, name: true, email: true } } },
      },
      lessons: { select: { id: true } },
    },
  })
  if (!course) return response.status(404).json({ error: 'Không tìm thấy khóa học' })
  if (course.instructorId !== request.user.id) return response.status(403).json({ error: 'Bạn không sở hữu khóa học này' })

  const progressRows = course.lessons.length && course.enrollments.length
    ? await prisma.lessonProgress.findMany({
      where: {
        lessonId: { in: course.lessons.map(({ id }) => id) },
        userId: { in: course.enrollments.map(({ user }) => user.id) },
      },
      select: { userId: true },
    })
    : []
  const completedByStudent = new Map()
  for (const { userId } of progressRows) completedByStudent.set(userId, (completedByStudent.get(userId) || 0) + 1)
  const totalLessons = course.lessons.length
  const students = course.enrollments.map(({ user, createdAt }) => {
    const completedLessons = completedByStudent.get(user.id) || 0
    return {
      ...user,
      enrolledAt: createdAt,
      completedLessons,
      totalLessons,
      progressPercent: totalLessons ? Math.round(completedLessons / totalLessons * 100) : 0,
    }
  })
  return response.json({ students })
})

router.get('/:courseId', async (request, response) => {
  const courseId = parseId(request.params.courseId)
  if (!courseId) return response.status(400).json({ error: 'ID khóa học không hợp lệ' })

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      ...courseInclude,
      enrollments: { where: { userId: request.user.id }, select: { userId: true } },
      lessons: {
        select: { ...lessonSelect, progress: { where: { userId: request.user.id }, select: { completedAt: true } } },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      },
      assignments: {
        orderBy: { createdAt: 'asc' },
        include: {
          submissions: request.user.role === 'INSTRUCTOR'
            ? { orderBy: { submittedAt: 'desc' }, include: { student: { select: { id: true, name: true, email: true } } } }
            : { where: { studentId: request.user.id } },
        },
      },
    },
  })

  if (!course) return response.status(404).json({ error: 'Không tìm thấy khóa học' })
  if (!canAccessCourse(course, request.user)) return response.status(403).json({ error: 'Bạn chưa tham gia khóa học này' })

  const lessons = course.lessons.map(({ progress, ...lesson }) => request.user.role === 'STUDENT'
    ? { ...lesson, isCompleted: progress.length > 0, completedAt: progress[0]?.completedAt || null }
    : lesson)
  const assignments = course.assignments.map((assignment) => ({
    ...assignment,
    isOverdue: Boolean(assignment.dueAt && assignment.dueAt < new Date()),
  }))
  return response.json({ course: { ...course, lessons, assignments } })
})

router.patch('/:courseId', authorizeRole('INSTRUCTOR'), async (request, response) => {
  const courseId = parseId(request.params.courseId)
  if (!courseId) return response.status(400).json({ error: 'ID khóa học không hợp lệ' })

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { instructorId: true } })
  if (!course) return response.status(404).json({ error: 'Không tìm thấy khóa học' })
  if (course.instructorId !== request.user.id) return response.status(403).json({ error: 'Bạn không sở hữu khóa học này' })

  const data = {}
  if ('title' in request.body) {
    const title = typeof request.body.title === 'string' ? request.body.title.trim() : ''
    if (title.length < 3 || title.length > 120) return response.status(400).json({ error: 'Tên khóa học phải từ 3 đến 120 ký tự' })
    data.title = title
  }
  if ('description' in request.body) {
    const description = typeof request.body.description === 'string' ? request.body.description.trim() : ''
    if (description.length > 4000) return response.status(400).json({ error: 'Mô tả khóa học không được vượt quá 4000 ký tự' })
    data.description = description
  }
  if (!Object.keys(data).length) return response.status(400).json({ error: 'Không có dữ liệu cần cập nhật' })

  const updatedCourse = await prisma.course.update({ where: { id: courseId }, data, include: courseInclude })
  return response.json({ course: updatedCourse })
})

router.delete('/:courseId', authorizeRole('INSTRUCTOR'), async (request, response) => {
  const courseId = parseId(request.params.courseId)
  if (!courseId) return response.status(400).json({ error: 'ID khóa học không hợp lệ' })

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: { select: { documentUrl: true } } },
  })
  if (!course) return response.status(404).json({ error: 'Không tìm thấy khóa học' })
  if (course.instructorId !== request.user.id) return response.status(403).json({ error: 'Bạn không sở hữu khóa học này' })

  await prisma.course.delete({ where: { id: courseId } })
  await Promise.all(course.lessons.map(({ documentUrl }) => removeStoredFile(documentUrl)))
  return response.status(204).end()
})

export default router
