import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { parseId, canAccessCourse } from '../utils/courseAccess.js'

const router = Router()

router.post('/:courseId/assignments', authorizeRole('INSTRUCTOR'), async (request, response) => {
  const courseId = parseId(request.params.courseId)
  if (!courseId) return response.status(400).json({ error: 'ID khóa học không hợp lệ' })
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { instructorId: true } })
  if (!course) return response.status(404).json({ error: 'Không tìm thấy khóa học' })
  if (course.instructorId !== request.user.id) return response.status(403).json({ error: 'Bạn không sở hữu khóa học này' })

  const title = typeof request.body.title === 'string' ? request.body.title.trim() : ''
  const description = typeof request.body.description === 'string' ? request.body.description.trim() : ''
  const points = request.body.points === undefined ? 100 : Number(request.body.points)
  const dueAt = request.body.dueAt ? new Date(request.body.dueAt) : null
  if (title.length < 3 || title.length > 160) return response.status(400).json({ error: 'Tiêu đề bài tập phải từ 3 đến 160 ký tự' })
  if (!description || description.length > 20000) return response.status(400).json({ error: 'Mô tả bài tập là bắt buộc và tối đa 20.000 ký tự' })
  if (!Number.isInteger(points) || points < 1 || points > 1000) return response.status(400).json({ error: 'Điểm tối đa phải từ 1 đến 1000' })
  if (request.body.dueAt && Number.isNaN(dueAt.getTime())) return response.status(400).json({ error: 'Hạn nộp không hợp lệ' })

  const assignment = await prisma.assignment.create({ data: { title, description, points, dueAt, courseId }, include: { submissions: true } })
  return response.status(201).json({ assignment: { ...assignment, isOverdue: Boolean(assignment.dueAt && assignment.dueAt < new Date()) } })
})

router.patch('/assignments/:assignmentId', authorizeRole('INSTRUCTOR'), async (request, response) => {
  const assignmentId = parseId(request.params.assignmentId)
  if (!assignmentId) return response.status(400).json({ error: 'ID bài tập không hợp lệ' })
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId }, include: { course: { select: { instructorId: true } } } })
  if (!assignment) return response.status(404).json({ error: 'Không tìm thấy bài tập' })
  if (assignment.course.instructorId !== request.user.id) return response.status(403).json({ error: 'Bạn không có quyền sửa bài tập này' })

  const data = {}
  if ('title' in request.body) {
    const title = typeof request.body.title === 'string' ? request.body.title.trim() : ''
    if (title.length < 3 || title.length > 160) return response.status(400).json({ error: 'Tiêu đề bài tập phải từ 3 đến 160 ký tự' })
    data.title = title
  }
  if ('description' in request.body) {
    const description = typeof request.body.description === 'string' ? request.body.description.trim() : ''
    if (!description || description.length > 20000) return response.status(400).json({ error: 'Mô tả bài tập là bắt buộc và tối đa 20.000 ký tự' })
    data.description = description
  }
  if ('points' in request.body) {
    const points = Number(request.body.points)
    if (!Number.isInteger(points) || points < 1 || points > 1000) return response.status(400).json({ error: 'Điểm tối đa phải từ 1 đến 1000' })
    data.points = points
  }
  if ('dueAt' in request.body) {
    const dueAt = request.body.dueAt ? new Date(request.body.dueAt) : null
    if (request.body.dueAt && Number.isNaN(dueAt.getTime())) return response.status(400).json({ error: 'Hạn nộp không hợp lệ' })
    data.dueAt = dueAt
  }
  if (!Object.keys(data).length) return response.status(400).json({ error: 'Không có dữ liệu cần cập nhật' })
  let updated
  try {
    updated = await prisma.$transaction(async (transaction) => {
      const currentAssignment = await transaction.assignment.findUnique({
        where: { id: assignmentId },
        select: { points: true },
      })
      if (!currentAssignment) return null
      if ('points' in data && data.points < currentAssignment.points) {
        const highestGrade = await transaction.assignmentSubmission.aggregate({
          where: { assignmentId, grade: { not: null } },
          _max: { grade: true },
        })
        if (highestGrade._max.grade !== null && highestGrade._max.grade > data.points) return null
      }
      return transaction.assignment.update({ where: { id: assignmentId }, data })
    }, { isolationLevel: 'Serializable' })
  } catch (error) {
    if (error?.code === 'P2034') {
      return response.status(409).json({ error: 'Bài tập vừa được thay đổi. Hãy tải lại rồi thử lại.' })
    }
    throw error
  }
  if (!updated) return response.status(409).json({ error: 'Không thể giảm điểm tối đa thấp hơn điểm đã chấm' })
  return response.json({ assignment: updated })
})

router.delete('/assignments/:assignmentId', authorizeRole('INSTRUCTOR'), async (request, response) => {
  const assignmentId = parseId(request.params.assignmentId)
  if (!assignmentId) return response.status(400).json({ error: 'ID bài tập không hợp lệ' })
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId }, include: { course: { select: { instructorId: true } } } })
  if (!assignment) return response.status(404).json({ error: 'Không tìm thấy bài tập' })
  if (assignment.course.instructorId !== request.user.id) return response.status(403).json({ error: 'Bạn không có quyền xóa bài tập này' })
  await prisma.assignment.delete({ where: { id: assignmentId } })
  return response.status(204).end()
})

router.put('/assignments/:assignmentId/submission', authorizeRole('STUDENT'), async (request, response) => {
  const assignmentId = parseId(request.params.assignmentId)
  if (!assignmentId) return response.status(400).json({ error: 'ID bài tập không hợp lệ' })
  const content = typeof request.body.content === 'string' ? request.body.content.trim() : ''
  if (!content || content.length > 20000) return response.status(400).json({ error: 'Bài làm là bắt buộc và tối đa 20.000 ký tự' })
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: { include: { enrollments: { where: { userId: request.user.id }, select: { userId: true } } } } },
  })
  if (!assignment) return response.status(404).json({ error: 'Không tìm thấy bài tập' })
  if (!canAccessCourse(assignment.course, request.user)) return response.status(403).json({ error: 'Bạn chưa tham gia khóa học này' })
  if (assignment.dueAt && assignment.dueAt < new Date()) return response.status(409).json({ error: 'Đã quá hạn nộp bài' })
  const submissionKey = { assignmentId_studentId: { assignmentId, studentId: request.user.id } }
  const existing = await prisma.assignmentSubmission.findUnique({ where: submissionKey, select: { id: true } })
  let submission
  if (existing) {
    const updated = await prisma.assignmentSubmission.updateMany({
      where: { id: existing.id, grade: null },
      data: { content, submittedAt: new Date() },
    })
    if (updated.count !== 1) return response.status(409).json({ error: 'Bài đã được chấm và không thể sửa' })
    submission = await prisma.assignmentSubmission.findUnique({ where: { id: existing.id } })
  } else {
    try {
      submission = await prisma.assignmentSubmission.create({ data: { assignmentId, studentId: request.user.id, content } })
    } catch (error) {
      if (error?.code === 'P2002') return response.status(409).json({ error: 'Bài nộp vừa được cập nhật. Hãy tải lại rồi thử lại.' })
      throw error
    }
  }
  return response.json({ submission })
})

router.patch('/assignments/:assignmentId/submissions/:studentId', authorizeRole('INSTRUCTOR'), async (request, response) => {
  const assignmentId = parseId(request.params.assignmentId)
  const studentId = parseId(request.params.studentId)
  if (!assignmentId || !studentId) return response.status(400).json({ error: 'ID bài tập hoặc học viên không hợp lệ' })
  const grade = request.body.grade === null ? null : Number(request.body.grade)
  const feedback = typeof request.body.feedback === 'string' ? request.body.feedback.trim() : ''
  if (feedback.length > 5000) return response.status(400).json({ error: 'Nhận xét không được vượt quá 5000 ký tự' })
  let result
  try {
    result = await prisma.$transaction(async (transaction) => {
      const assignment = await transaction.assignment.findUnique({
        where: { id: assignmentId },
        include: { course: { select: { instructorId: true } } },
      })
      if (!assignment) return { status: 404, error: 'Không tìm thấy bài tập' }
      if (assignment.course.instructorId !== request.user.id) return { status: 403, error: 'Bạn không có quyền chấm bài tập này' }
      const submission = await transaction.assignmentSubmission.findUnique({
        where: { assignmentId_studentId: { assignmentId, studentId } },
      })
      if (!submission) return { status: 404, error: 'Học viên chưa nộp bài' }
      if (grade !== null && (!Number.isInteger(grade) || grade < 0 || grade > assignment.points)) {
        return { status: 400, error: `Điểm phải từ 0 đến ${assignment.points}` }
      }
      const updated = await transaction.assignmentSubmission.update({
        where: { id: submission.id },
        data: { grade, feedback: feedback || null },
      })
      return { submission: updated }
    }, { isolationLevel: 'Serializable' })
  } catch (error) {
    if (error?.code === 'P2034') return response.status(409).json({ error: 'Bài nộp hoặc bài tập vừa được thay đổi. Hãy tải lại rồi thử lại.' })
    throw error
  }
  if (result.error) return response.status(result.status).json({ error: result.error })
  return response.json({ submission: result.submission })
})

export default router
