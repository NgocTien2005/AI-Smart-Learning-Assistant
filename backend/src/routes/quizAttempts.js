import { Router } from 'express'
import { prisma as defaultPrisma } from '../lib/prisma.js'
import { createPracticeQuestions, publicQuizQuestion } from '../utils/studyQuiz.js'

const parseId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const publicResult = (attempt) => {
  const questions = Array.isArray(attempt.questions) ? attempt.questions : []
  const selected = Array.isArray(attempt.selectedAnswers) ? attempt.selectedAnswers : null
  return {
    attemptId: attempt.id,
    score: attempt.score,
    total: questions.length,
    submittedAt: attempt.submittedAt,
    legacyAnswersUnavailable: selected === null,
    questions: questions.map((question, index) => ({
      ...publicQuizQuestion(question, index),
      correctIndex: question.correctIndex,
      selectedIndex: selected?.[index] ?? null,
      isCorrect: selected ? question.correctIndex === selected[index] : null,
      explanation: question.explanation || '',
      sourcePassage: question.sourcePassage || '',
    })),
  }
}

export const createQuizAttemptsRouter = ({ prisma = defaultPrisma, requireStudent = (_req, _res, next) => next() } = {}) => {
  const router = Router()
  router.use(requireStudent)

  const findAccessibleLesson = async (lessonId, userId) => prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { include: { enrollments: { where: { userId }, select: { userId: true } } } } },
  })
  const canAccess = (lesson, user) => lesson && (lesson.course.instructorId === user.id
    || lesson.course.enrollments.some(({ userId }) => userId === user.id))

  const findOwnedAccessibleAttempt = async (attemptId, user) => {
    const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } })
    if (!attempt || attempt.userId !== user.id) return { error: 'NOT_FOUND' }
    const lesson = await findAccessibleLesson(attempt.lessonId, user.id)
    if (!canAccess(lesson, user)) return { error: 'FORBIDDEN' }
    return { attempt }
  }
  const respondAccessError = (response, error) => error === 'FORBIDDEN'
    ? response.status(403).json({ error: 'Bạn cần tham gia lại khóa học để tiếp tục bài ôn tập' })
    : response.status(404).json({ error: 'Không tìm thấy bài ôn tập' })

  router.get('/lessons/:lessonId/quizzes', async (request, response) => {
    const lessonId = parseId(request.params.lessonId)
    if (!lessonId) return response.status(400).json({ error: 'ID bài học không hợp lệ' })
    const lesson = await findAccessibleLesson(lessonId, request.user.id)
    if (!lesson) return response.status(404).json({ error: 'Không tìm thấy bài học' })
    if (!canAccess(lesson, request.user)) return response.status(403).json({ error: 'Bạn không có quyền xem bài học này' })
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: request.user.id, lessonId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true, score: true, questions: true, createdAt: true, submittedAt: true, version: true },
    })
    return response.json({ attempts: attempts.map(({ questions, ...attempt }) => ({ ...attempt, questionCount: questions.length })) })
  })

  router.post('/lessons/:lessonId/quizzes', async (request, response) => {
    const lessonId = parseId(request.params.lessonId)
    if (!lessonId) return response.status(400).json({ error: 'ID bài học không hợp lệ' })
    const lesson = await findAccessibleLesson(lessonId, request.user.id)
    if (!lesson) return response.status(404).json({ error: 'Không tìm thấy bài học' })
    if (!canAccess(lesson, request.user)) return response.status(403).json({ error: 'Bạn không có quyền ôn tập bài học này' })
    const requestedCount = request.body.count === undefined ? 5 : Number(request.body.count)
    if (!Number.isInteger(requestedCount) || requestedCount < 3 || requestedCount > 10) {
      return response.status(400).json({ error: 'Số câu hỏi phải từ 3 đến 10' })
    }
    const source = lesson.extractedText || lesson.content || ''
    const generated = createPracticeQuestions(source, requestedCount)
    if (generated.error || !generated.questions.length) return response.status(422).json({ error: generated.error })
    const attempt = await prisma.quizAttempt.create({
      data: { userId: request.user.id, lessonId, questions: generated.questions, draftAnswers: generated.questions.map(() => null), version: 0 },
    })
    return response.status(201).json({
      attemptId: attempt.id,
      version: attempt.version,
      requestedCount,
      actualCount: generated.actualCount,
      message: generated.actualCount < requestedCount ? `Chỉ tạo được ${generated.actualCount} câu hợp lệ từ nội dung hiện có.` : null,
      questions: generated.questions.map(publicQuizQuestion),
    })
  })

  router.get('/quiz-attempts/:attemptId', async (request, response) => {
    const attemptId = parseId(request.params.attemptId)
    if (!attemptId) return response.status(400).json({ error: 'ID bài ôn tập không hợp lệ' })
    const found = await findOwnedAccessibleAttempt(attemptId, request.user)
    if (found.error) return respondAccessError(response, found.error)
    const { attempt } = found
    if (attempt.submittedAt) return response.json({ ...publicResult(attempt), version: attempt.version })
    return response.json({
      attemptId: attempt.id,
      submittedAt: null,
      version: attempt.version,
      answers: attempt.questions.map((_, index) => Array.isArray(attempt.draftAnswers) ? attempt.draftAnswers[index] ?? null : null),
      questions: attempt.questions.map(publicQuizQuestion),
    })
  })

  router.put('/quiz-attempts/:attemptId/draft', async (request, response) => {
    const attemptId = parseId(request.params.attemptId)
    if (!attemptId) return response.status(400).json({ error: 'ID bài ôn tập không hợp lệ' })
    const found = await findOwnedAccessibleAttempt(attemptId, request.user)
    if (found.error) return respondAccessError(response, found.error)
    const { attempt } = found
    if (attempt.submittedAt) return response.status(409).json({ code: 'ATTEMPT_SUBMITTED', error: 'Bài ôn tập đã được nộp' })
    const { answers, version } = request.body
    if (!Array.isArray(answers) || answers.length !== attempt.questions.length
      || answers.some((answer, index) => answer !== null && (!Number.isInteger(answer) || answer < 0 || answer >= attempt.questions[index].options.length))
      || !Number.isInteger(version)) {
      return response.status(400).json({ error: 'Bản nháp hoặc phiên bản không hợp lệ' })
    }
    const update = await prisma.quizAttempt.updateMany({
      where: { id: attemptId, userId: request.user.id, submittedAt: null, version },
      data: { draftAnswers: answers, version: { increment: 1 } },
    })
    if (update.count !== 1) return response.status(409).json({ code: 'ATTEMPT_VERSION_CONFLICT', error: 'Bản nháp đã cũ hoặc bài ôn tập vừa được nộp. Hãy tải lại trạng thái mới nhất.' })
    return response.json({ version: version + 1, answers })
  })

  router.post('/quiz-attempts/:attemptId/submit', async (request, response) => {
    const attemptId = parseId(request.params.attemptId)
    if (!attemptId) return response.status(400).json({ error: 'ID bài ôn tập không hợp lệ' })
    const found = await findOwnedAccessibleAttempt(attemptId, request.user)
    if (found.error) return respondAccessError(response, found.error)
    const { attempt } = found
    if (attempt.submittedAt) return response.status(409).json({ code: 'ATTEMPT_SUBMITTED', error: 'Bài ôn tập đã được nộp' })
    const { answers, version } = request.body
    if (!Array.isArray(answers) || answers.length !== attempt.questions.length
      || answers.some((answer, index) => !Number.isInteger(answer) || answer < 0 || answer >= attempt.questions[index].options.length)
      || !Number.isInteger(version)) {
      return response.status(400).json({ error: 'Vui lòng trả lời tất cả câu hỏi trước khi nộp' })
    }
    const score = attempt.questions.reduce((total, question, index) => total + (question.correctIndex === answers[index] ? 1 : 0), 0)
    const submittedAt = new Date()
    const saved = await prisma.quizAttempt.updateMany({
      where: { id: attemptId, userId: request.user.id, submittedAt: null, version },
      data: { selectedAnswers: answers, draftAnswers: answers, score, submittedAt, version: { increment: 1 } },
    })
    if (saved.count !== 1) return response.status(409).json({ code: 'ATTEMPT_VERSION_CONFLICT', error: 'Bản nháp đã cũ hoặc bài ôn tập vừa được nộp. Hãy tải lại kết quả mới nhất.' })
    return response.json(publicResult({ ...attempt, selectedAnswers: answers, score, submittedAt, version: version + 1 }))
  })

  return router
}

export default createQuizAttemptsRouter()
