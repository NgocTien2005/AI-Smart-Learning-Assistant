import { Router } from 'express'
import { prisma as productionPrisma } from '../lib/prisma.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { parseId, canAccessCourse } from '../utils/courseAccess.js'
import { extname } from 'node:path'
import { answerFromDocument } from '../utils/studyAssistant.js'
import { lessonTextAfterContentEdit, resolveLessonSource, createExtractiveSummary } from '../utils/lessonText.js'
import { processDocument } from '../services/documentProcessing.js'
import { upload, documentStorage, removeStoredFile as cleanupStoredFile, processUploadForStorage } from '../services/courseDocuments.js'

export const lessonSelect = {
  id: true,
  title: true,
  content: true,
  documentName: true,
  extractionStatus: true,
  extractionErrorCode: true,
  extractionTruncated: true,
  sourceRevision: true,
  order: true,
  courseId: true,
  createdAt: true,
  updatedAt: true,
}

export const createLessonsRouter = ({ prisma = productionPrisma, storage = documentStorage } = {}) => {
const router = Router()
const removeStoredFile = reference => cleanupStoredFile(reference, storage)

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
    const processed = request.file ? await processUploadForStorage(request.file) : null
    if (request.file) {
      const allowedExtension = request.file.mimetype === 'application/pdf'
        ? '.pdf'
        : ['.txt', '.md', '.csv'].includes(extname(request.file.originalname).toLowerCase())
          ? extname(request.file.originalname).toLowerCase()
          : '.txt'
      storedName = await storage.save(request.file.buffer, allowedExtension)
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        content: content || null,
        documentUrl: storedName,
        documentName: request.file?.originalname.slice(0, 255) || null,
        extractedText: null,
        documentText: processed?.text || null,
        documentHash: processed?.hash || null,
        extractionStatus: processed?.status || null,
        extractionErrorCode: processed?.status === 'NO_TEXT' ? 'NO_TEXT' : null,
        extractionTruncated: Boolean(processed?.truncated),
        sourceRevision: 0,
        order,
        courseId,
      },
      select: lessonSelect,
    })

    return response.status(201).json({ lesson })
  } catch (error) {
    // An uncertain database outcome may have committed; retain potential orphans.
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
    data.extractedText = lessonTextAfterContentEdit(lesson, content)
    if (!(lesson.extractionStatus === 'SUCCESS' && lesson.documentText)) data.sourceRevision = { increment: 1 }
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

  let parsed
  try { parsed = await processUploadForStorage(request.file) }
  catch (error) { return response.status(error.code === 'SIZE_LIMIT' ? 413 : 400).json({ code: error.code || 'INVALID_DOCUMENT', error: error.message }) }
  const originalExtension = extname(request.file.originalname).toLowerCase()
  const allowedExtension = originalExtension === '.markdown' ? '.md' : originalExtension
  let storedName

  try {
    storedName = await storage.save(request.file.buffer, allowedExtension)
    const committed = await prisma.lesson.updateMany({
      where: { id: lessonId, documentUrl: lesson.documentUrl },
      data: { documentUrl: storedName, documentName: request.file.originalname.slice(0, 255), extractedText: null,
        documentText: parsed.text, documentHash: parsed.hash, extractionStatus: parsed.status,
        extractionErrorCode: parsed.errorCode || (parsed.status === 'NO_TEXT' ? 'NO_TEXT' : null), extractionTruncated: parsed.truncated,
        sourceRevision: { increment: 1 } },
    })
    if (committed.count !== 1) { await removeStoredFile(storedName); return response.status(409).json({ error: 'Bài học vừa được cập nhật. Hãy tải lại trước khi thay tài liệu.' }) }
    const updatedLesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: lessonSelect })
    await removeStoredFile(lesson.documentUrl)
    return response.json({ lesson: updatedLesson })
  } catch (error) {
    // An uncertain database outcome may have committed; retain potential orphans.
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

  const removed = await prisma.lesson.updateMany({
    where: { id: lessonId, documentUrl: lesson.documentUrl },
    data: { documentUrl: null, documentName: null, extractedText: null, documentText: null, documentHash: null,
      extractionStatus: null, extractionErrorCode: null, extractionTruncated: false, sourceRevision: { increment: 1 } },
  })
  if (removed.count !== 1) return response.status(409).json({ error: 'Tài liệu vừa được thay đổi. Hãy tải lại trước khi gỡ.' })
  const updatedLesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: lessonSelect })
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

router.post('/lessons/:lessonId/document/process', authorizeRole('INSTRUCTOR'), async (request, response) => {
  const lessonId = parseId(request.params.lessonId)
  if (!lessonId) return response.status(400).json({ error: 'ID bài học không hợp lệ' })
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { course: { select: { instructorId: true } } } })
  if (!lesson) return response.status(404).json({ error: 'Không tìm thấy bài học' })
  if (lesson.course.instructorId !== request.user.id) return response.status(403).json({ error: 'Chỉ giảng viên sở hữu khóa học được xử lý tài liệu' })
  if (!lesson.documentUrl) return response.status(404).json({ error: 'Bài học chưa có tài liệu' })
  // Storage outages leave the existing extracted source intact.
  const buffer = await storage.read(lesson.documentUrl)
  let processed
  try { processed = await processDocument({ name: lesson.documentName, buffer }) }
  catch (error) {
    await prisma.lesson.updateMany({ where: { id: lessonId, documentUrl: lesson.documentUrl }, data: {
      documentText: null, documentHash: null, extractionStatus: 'FAILED', extractionErrorCode: error.code || 'PROCESSING_FAILED',
      extractionTruncated: false, sourceRevision: { increment: 1 },
    } })
    return response.status(422).json({ code: error.code || 'PROCESSING_FAILED', error: error.message })
  }
  const saved = await prisma.lesson.updateMany({ where: { id: lessonId, documentUrl: lesson.documentUrl }, data: {
    documentText: processed.text, documentHash: processed.hash, extractionStatus: processed.status,
    extractionErrorCode: processed.status === 'NO_TEXT' ? 'NO_TEXT' : null,
    extractionTruncated: processed.truncated, sourceRevision: { increment: 1 },
  } })
  if (saved.count !== 1) return response.status(409).json({ error: 'Tài liệu đã thay đổi trong lúc xử lý. Hãy thử lại.' })
  return response.json({ lesson: await prisma.lesson.findUnique({ where: { id: lessonId }, select: lessonSelect }) })
})

router.get('/lessons/:lessonId/summary', async (request, response) => {
  const lessonId = parseId(request.params.lessonId)
  if (!lessonId) return response.status(400).json({ error: 'ID bài học không hợp lệ' })
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { course: { include: { enrollments: { where: { userId: request.user.id }, select: { userId: true } } } } } })
  if (!lesson) return response.status(404).json({ error: 'Không tìm thấy bài học' })
  if (!canAccessCourse(lesson.course, request.user)) return response.status(403).json({ error: 'Bạn chưa tham gia khóa học này' })
  const source = resolveLessonSource(lesson)
  if (!source.text) return response.status(422).json({ code: 'SOURCE_UNAVAILABLE', error: 'Chưa có nội dung văn bản để tóm tắt.', extractionStatus: lesson.extractionStatus || 'NOT_PROCESSED' })
  return response.json({ title: 'Tóm tắt trích xuất', points: createExtractiveSummary(source), sourceType: source.sourceType,
    sourceRevision: source.revision, truncated: source.truncated })
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

  const buffer = await storage.read(lesson.documentUrl)
  response.set('Cache-Control', 'private, no-store')
  response.attachment(lesson.documentName || 'tai-lieu')
  return response.send(buffer)
})

router.get('/lessons/:lessonId/chat', async (request, response) => {
  const lessonId = parseId(request.params.lessonId)
  if (!lessonId) return response.status(400).json({ error: 'ID bài học không hợp lệ' })

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { include: { enrollments: { where: { userId: request.user.id }, select: { userId: true } } } } },
  })
  if (!lesson) return response.status(404).json({ error: 'Không tìm thấy bài học' })
  if (!canAccessCourse(lesson.course, request.user)) return response.status(403).json({ error: 'Bạn không có quyền xem lịch sử này' })

  const latestMessages = await prisma.chatMessage.findMany({
    where: { lessonId, userId: request.user.id },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 50,
  })
  return response.json({ messages: latestMessages.reverse() })
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
  const source = resolveLessonSource(lesson)
  if (!source.text) return response.status(422).json({ error: 'Bài học chưa có nội dung text để tra cứu' })

  const answer = answerFromDocument(question, source.text)
  const message = await prisma.chatMessage.create({ data: { question, answer, userId: request.user.id, lessonId } })
  return response.status(201).json({ message })
})

return router
}

export default createLessonsRouter()
