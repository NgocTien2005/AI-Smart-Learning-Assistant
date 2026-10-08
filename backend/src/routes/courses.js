import { randomBytes, randomUUID } from 'node:crypto'
import { access, mkdir, unlink, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { uploadDirectory } from '../config/env.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { prisma } from '../lib/prisma.js'
import { answerFromDocument } from '../utils/studyAssistant.js'

const router = Router()
const maxDocumentSize = 10 * 1024 * 1024
const supportedDocumentTypes = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
])
const textDocumentTypes = new Set(['text/plain', 'text/markdown', 'text/csv'])
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxDocumentSize, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!supportedDocumentTypes.has(file.mimetype)) {
      return callback(new Error('Chỉ hỗ trợ tài liệu PDF, TXT, Markdown hoặc CSV'))
    }

    return callback(null, true)
  },
})

const parseId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const courseInclude = {
  instructor: { select: { id: true, name: true, email: true } },
  _count: { select: { lessons: true, enrollments: true } },
}

const lessonSelect = {
  id: true,
  title: true,
  content: true,
  documentName: true,
  order: true,
  courseId: true,
  createdAt: true,
  updatedAt: true,
}

const canAccessCourse = (course, user) => course && (
  course.instructorId === user.id
  || course.enrollments?.some((enrollment) => enrollment.userId === user.id)
)

const addStudentProgress = async (courses, userId) => {
  if (!courses.length) return courses
  const lessonProgress = await prisma.lessonProgress.findMany({
    where: { userId, lesson: { courseId: { in: courses.map(({ id }) => id) } } },
    select: { lesson: { select: { courseId: true } } },
  })
  const completedByCourse = new Map()
  for (const { lesson } of lessonProgress) {
    completedByCourse.set(lesson.courseId, (completedByCourse.get(lesson.courseId) || 0) + 1)
  }
  return courses.map((course) => {
    const completedLessons = completedByCourse.get(course.id) || 0
    const totalLessons = course._count.lessons
    return { ...course, completedLessons, progressPercent: totalLessons ? Math.round(completedLessons / totalLessons * 100) : 0 }
  })
}

const removeStoredFile = async (storedName) => {
  if (!storedName) return

  const filePath = resolve(uploadDirectory, storedName)
  if (!filePath.startsWith(`${resolve(uploadDirectory)}\\`) && !filePath.startsWith(`${resolve(uploadDirectory)}/`)) return

  try {
    await unlink(filePath)
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Document cleanup error:', error)
  }
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

router.get('/', async (request, response) => {
  const where = request.user.role === 'INSTRUCTOR'
    ? { instructorId: request.user.id }
    : { enrollments: { some: { userId: request.user.id } } }
  const courses = await prisma.course.findMany({
    where,
    include: courseInclude,
    orderBy: { updatedAt: 'desc' },
  })

  return response.json({ courses: request.user.role === 'STUDENT' ? await addStudentProgress(courses, request.user.id) : courses })
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
  return response.json({ course: enrolledCourse })
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
    },
  })

  if (!course) return response.status(404).json({ error: 'Không tìm thấy khóa học' })
  if (!canAccessCourse(course, request.user)) return response.status(403).json({ error: 'Bạn chưa tham gia khóa học này' })

  const lessons = course.lessons.map(({ progress, ...lesson }) => request.user.role === 'STUDENT'
    ? { ...lesson, isCompleted: progress.length > 0, completedAt: progress[0]?.completedAt || null }
    : lesson)
  return response.json({ course: { ...course, lessons } })
})

router.put('/lessons/:lessonId/progress', authorizeRole('STUDENT'), async (request, response) => {
  const lessonId = parseId(request.params.lessonId)
  if (!lessonId) return response.status(400).json({ error: 'ID bài học không hợp lệ' })

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { include: { enrollments: { where: { userId: request.user.id }, select: { userId: true } } } } },
  })
  if (!lesson) return response.status(404).json({ error: 'Không tìm thấy bài học' })
  if (!canAccessCourse(lesson.course, request.user)) return response.status(403).json({ error: 'Bạn chưa tham gia khóa học này' })

  const progress = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: request.user.id, lessonId } },
    create: { userId: request.user.id, lessonId },
    update: {},
  })
  return response.json({ isCompleted: true, completedAt: progress.completedAt })
})

router.delete('/lessons/:lessonId/progress', authorizeRole('STUDENT'), async (request, response) => {
  const lessonId = parseId(request.params.lessonId)
  if (!lessonId) return response.status(400).json({ error: 'ID bài học không hợp lệ' })

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { include: { enrollments: { where: { userId: request.user.id }, select: { userId: true } } } } },
  })
  if (!lesson) return response.status(404).json({ error: 'Không tìm thấy bài học' })
  if (!canAccessCourse(lesson.course, request.user)) return response.status(403).json({ error: 'Bạn chưa tham gia khóa học này' })

  await prisma.lessonProgress.deleteMany({ where: { userId: request.user.id, lessonId } })
  return response.json({ isCompleted: false, completedAt: null })
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

router.post('/:courseId/lessons', authorizeRole('INSTRUCTOR'), upload.single('document'), async (request, response) => {
  const courseId = parseId(request.params.courseId)
  if (!courseId) return response.status(400).json({ error: 'ID khóa học không hợp lệ' })

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { instructorId: true } })
  if (!course) return response.status(404).json({ error: 'Không tìm thấy khóa học' })
  if (course.instructorId !== request.user.id) return response.status(403).json({ error: 'Bạn không sở hữu khóa học này' })

  const title = typeof request.body.title === 'string' ? request.body.title.trim() : ''
  const content = typeof request.body.content === 'string' ? request.body.content.trim() : ''
  const order = request.body.order === undefined || request.body.order === '' ? 0 : Number(request.body.order)
  if (title.length < 2 || title.length > 160) return response.status(400).json({ error: 'Tên bài học phải từ 2 đến 160 ký tự' })
  if (content.length > 100000) return response.status(400).json({ error: 'Nội dung bài học không được vượt quá 100.000 ký tự' })
  if (!Number.isInteger(order) || order < 0 || order > 10000) return response.status(400).json({ error: 'Thứ tự bài học không hợp lệ' })
  if (!content && !request.file) return response.status(400).json({ error: 'Bài học cần có nội dung hoặc tài liệu' })

  let storedName = null
  try {
    if (request.file) {
      const allowedExtension = request.file.mimetype === 'application/pdf'
        ? '.pdf'
        : ['.txt', '.md', '.csv'].includes(extname(request.file.originalname).toLowerCase())
          ? extname(request.file.originalname).toLowerCase()
          : '.txt'
      storedName = `${randomUUID()}${allowedExtension}`
      await mkdir(uploadDirectory, { recursive: true })
      await writeFile(resolve(uploadDirectory, storedName), request.file.buffer)
    }

    const extractedText = request.file && textDocumentTypes.has(request.file.mimetype)
      ? request.file.buffer.toString('utf8').slice(0, 100000)
      : content || null
    const lesson = await prisma.lesson.create({
      data: {
        title,
        content: content || null,
        documentUrl: storedName,
        documentName: request.file?.originalname.slice(0, 255) || null,
        extractedText,
        order,
        courseId,
      },
      select: lessonSelect,
    })

    return response.status(201).json({ lesson })
  } catch (error) {
    await removeStoredFile(storedName)
    throw error
  }
})

router.patch('/lessons/:lessonId', authorizeRole('INSTRUCTOR'), async (request, response) => {
  const lessonId = parseId(request.params.lessonId)
  if (!lessonId) return response.status(400).json({ error: 'ID bài học không hợp lệ' })

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { course: { select: { instructorId: true } } } })
  if (!lesson) return response.status(404).json({ error: 'Không tìm thấy bài học' })
  if (lesson.course.instructorId !== request.user.id) return response.status(403).json({ error: 'Bạn không có quyền sửa bài học này' })

  const data = {}
  if ('title' in request.body) {
    const title = typeof request.body.title === 'string' ? request.body.title.trim() : ''
    if (title.length < 2 || title.length > 160) return response.status(400).json({ error: 'Tên bài học phải từ 2 đến 160 ký tự' })
    data.title = title
  }
  if ('content' in request.body) {
    const content = typeof request.body.content === 'string' ? request.body.content.trim() : ''
    if (content.length > 100000) return response.status(400).json({ error: 'Nội dung bài học không được vượt quá 100.000 ký tự' })
    data.content = content || null
    if (!lesson.documentUrl) data.extractedText = content || null
  }
  if ('order' in request.body) {
    const order = Number(request.body.order)
    if (!Number.isInteger(order) || order < 0 || order > 10000) return response.status(400).json({ error: 'Thứ tự bài học không hợp lệ' })
    data.order = order
  }
  if (!Object.keys(data).length) return response.status(400).json({ error: 'Không có dữ liệu cần cập nhật' })

  const updatedLesson = await prisma.lesson.update({ where: { id: lessonId }, data, select: lessonSelect })
  return response.json({ lesson: updatedLesson })
})

router.patch('/lessons/:lessonId/document', authorizeRole('INSTRUCTOR'), upload.single('document'), async (request, response) => {
  const lessonId = parseId(request.params.lessonId)
  if (!lessonId) return response.status(400).json({ error: 'ID bài học không hợp lệ' })
  if (!request.file) return response.status(400).json({ error: 'Vui lòng chọn tài liệu' })

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { course: { select: { instructorId: true } } } })
  if (!lesson) return response.status(404).json({ error: 'Không tìm thấy bài học' })
  if (lesson.course.instructorId !== request.user.id) return response.status(403).json({ error: 'Bạn không có quyền sửa bài học này' })

  const originalExtension = extname(request.file.originalname).toLowerCase()
  const allowedExtension = request.file.mimetype === 'application/pdf'
    ? '.pdf'
    : ['.txt', '.md', '.csv'].includes(originalExtension) ? originalExtension : '.txt'
  const storedName = `${randomUUID()}${allowedExtension}`

  try {
    await mkdir(uploadDirectory, { recursive: true })
    await writeFile(resolve(uploadDirectory, storedName), request.file.buffer)
    const extractedText = textDocumentTypes.has(request.file.mimetype)
      ? request.file.buffer.toString('utf8').slice(0, 100000)
      : lesson.content || null
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: { documentUrl: storedName, documentName: request.file.originalname.slice(0, 255), extractedText },
      select: lessonSelect,
    })
    await removeStoredFile(lesson.documentUrl)
    return response.json({ lesson: updatedLesson })
  } catch (error) {
    await removeStoredFile(storedName)
    throw error
  }
})

router.delete('/lessons/:lessonId/document', authorizeRole('INSTRUCTOR'), async (request, response) => {
  const lessonId = parseId(request.params.lessonId)
  if (!lessonId) return response.status(400).json({ error: 'ID bài học không hợp lệ' })

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { course: { select: { instructorId: true } } } })
  if (!lesson) return response.status(404).json({ error: 'Không tìm thấy bài học' })
  if (lesson.course.instructorId !== request.user.id) return response.status(403).json({ error: 'Bạn không có quyền sửa bài học này' })
  if (!lesson.documentUrl) return response.status(404).json({ error: 'Bài học chưa có tài liệu' })

  const updatedLesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: { documentUrl: null, documentName: null, extractedText: lesson.content || null },
    select: lessonSelect,
  })
  await removeStoredFile(lesson.documentUrl)
  return response.json({ lesson: updatedLesson })
})

router.delete('/lessons/:lessonId', authorizeRole('INSTRUCTOR'), async (request, response) => {
  const lessonId = parseId(request.params.lessonId)
  if (!lessonId) return response.status(400).json({ error: 'ID bài học không hợp lệ' })

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { course: { select: { instructorId: true } } } })
  if (!lesson) return response.status(404).json({ error: 'Không tìm thấy bài học' })
  if (lesson.course.instructorId !== request.user.id) return response.status(403).json({ error: 'Bạn không có quyền xóa bài học này' })

  await prisma.lesson.delete({ where: { id: lessonId } })
  await removeStoredFile(lesson.documentUrl)
  return response.status(204).end()
})

router.get('/lessons/:lessonId/document', async (request, response) => {
  const lessonId = parseId(request.params.lessonId)
  if (!lessonId) return response.status(400).json({ error: 'ID bài học không hợp lệ' })

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { include: { enrollments: { where: { userId: request.user.id }, select: { userId: true } } } } },
  })
  if (!lesson) return response.status(404).json({ error: 'Không tìm thấy bài học' })
  if (!canAccessCourse(lesson.course, request.user)) return response.status(403).json({ error: 'Bạn không có quyền xem tài liệu này' })
  if (!lesson.documentUrl) return response.status(404).json({ error: 'Bài học chưa có tài liệu' })

  const filePath = resolve(uploadDirectory, lesson.documentUrl)
  try {
    await access(filePath)
  } catch (error) {
    if (error.code === 'ENOENT') return response.status(404).json({ error: 'Tệp tài liệu không còn tồn tại' })
    throw error
  }

  return response.download(filePath, lesson.documentName || 'tai-lieu')
})

router.get('/lessons/:lessonId/chat', async (request, response) => {
  const lessonId = parseId(request.params.lessonId)
  if (!lessonId) return response.status(400).json({ error: 'ID bài học không hợp lệ' })

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: { include: { enrollments: { where: { userId: request.user.id }, select: { userId: true } } } },
      chatMessages: { where: { userId: request.user.id }, orderBy: { createdAt: 'asc' }, take: 50 },
    },
  })
  if (!lesson) return response.status(404).json({ error: 'Không tìm thấy bài học' })
  if (!canAccessCourse(lesson.course, request.user)) return response.status(403).json({ error: 'Bạn không có quyền xem lịch sử này' })

  return response.json({ messages: lesson.chatMessages })
})

router.post('/lessons/:lessonId/chat', async (request, response) => {
  const lessonId = parseId(request.params.lessonId)
  if (!lessonId) return response.status(400).json({ error: 'ID bài học không hợp lệ' })
  const question = typeof request.body.question === 'string' ? request.body.question.trim() : ''
  if (question.length < 3 || question.length > 1000) return response.status(400).json({ error: 'Câu hỏi phải từ 3 đến 1000 ký tự' })

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { include: { enrollments: { where: { userId: request.user.id }, select: { userId: true } } } } },
  })
  if (!lesson) return response.status(404).json({ error: 'Không tìm thấy bài học' })
  if (!canAccessCourse(lesson.course, request.user)) return response.status(403).json({ error: 'Bạn không có quyền hỏi về bài học này' })
  if (!lesson.extractedText) return response.status(422).json({ error: 'Bài học chưa có nội dung text để tra cứu' })

  const answer = answerFromDocument(question, lesson.extractedText)
  const message = await prisma.chatMessage.create({ data: { question, answer, userId: request.user.id, lessonId } })
  return response.status(201).json({ message })
})

export default router
