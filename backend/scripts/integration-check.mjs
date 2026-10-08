import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const baseUrl = process.env.TEST_API_URL || 'http://localhost:8080/api'
const stamp = Date.now()
const instructorEmail = `integration-instructor-${stamp}@example.com`
const studentEmail = `integration-student-${stamp}@example.com`
const password = 'TestPass123'
let courseId = null
let instructorToken = null

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options)
  const data = response.status === 204 ? null : await response.json()
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path}: ${response.status} ${data?.error || ''}`)
  return data
}

const jsonOptions = (method, body, token) => ({
  method,
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: body ? JSON.stringify(body) : undefined,
})

const cleanupUsers = () => {
  const sql = `DELETE FROM "User" WHERE email IN ('${instructorEmail}', '${studentEmail}');`
  const result = spawnSync('docker', ['compose', 'exec', '-T', 'db', 'psql', '-q', '-U', 'postgres', '-d', 'lumina_lms', '-c', sql], {
    cwd: new URL('../..', import.meta.url),
    stdio: 'pipe',
    shell: false,
  })
  if (result.status !== 0) process.stderr.write('Không thể dọn tài khoản integration test.\n')
}

const seedResetToken = (email, token) => {
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const sql = `UPDATE "User" SET "passwordResetTokenHash" = '${tokenHash}', "passwordResetExpiresAt" = NOW() + INTERVAL '30 minutes', "passwordResetRequestedAt" = NOW() WHERE email = '${email}';`
  const result = spawnSync('docker', ['compose', 'exec', '-T', 'db', 'psql', '-q', '-U', 'postgres', '-d', 'lumina_lms', '-c', sql], {
    cwd: new URL('../..', import.meta.url),
    stdio: 'pipe',
    shell: false,
  })
  if (result.status !== 0) throw new Error('Không thể chuẩn bị token đặt lại mật khẩu cho integration test')
}

try {
  const instructor = await request('/auth/register', jsonOptions('POST', {
    name: 'Integration Instructor', email: instructorEmail, password, role: 'INSTRUCTOR',
  }))
  instructorToken = instructor.token
  if ('password' in instructor.user) throw new Error('Password leaked in instructor response')
  const currentInstructor = await request('/auth/me', { headers: { Authorization: `Bearer ${instructorToken}` } })
  if (currentInstructor.user.email !== instructorEmail) throw new Error('/auth/me returned the wrong user')
  const updatedProfile = await request('/auth/me', jsonOptions('PATCH', { name: 'Updated Integration Instructor' }, instructorToken))
  if (updatedProfile.user.name !== 'Updated Integration Instructor') throw new Error('Profile update did not persist')

  const createdCourse = await request('/courses', jsonOptions('POST', {
    title: 'Integration Course', description: 'Course created by automated integration verification.',
  }, instructorToken))
  courseId = createdCourse.course.id

  const student = await request('/auth/register', jsonOptions('POST', {
    name: 'Integration Student', email: studentEmail, password, role: 'STUDENT',
  }))
  if ('password' in student.user) throw new Error('Password leaked in student response')

  const beforeJoin = await fetch(`${baseUrl}/courses/${courseId}`, { headers: { Authorization: `Bearer ${student.token}` } })
  if (beforeJoin.status !== 403) throw new Error(`Course access before enrollment returned ${beforeJoin.status}, expected 403`)

  const joined = await request('/courses/join', jsonOptions('POST', {
    joinCode: createdCourse.course.joinCode,
  }, student.token))
  if (joined.course.id !== courseId) throw new Error('Joined course does not match')
  const roster = await request(`/courses/${courseId}/students`, { headers: { Authorization: `Bearer ${instructorToken}` } })
  if (roster.students.length !== 1 || roster.students[0].email !== studentEmail) throw new Error('Instructor roster is incorrect')

  const createdLesson = await request(`/courses/${courseId}/lessons`, jsonOptions('POST', {
    title: 'Nền tảng Machine Learning',
    content: 'Machine Learning giúp hệ thống học từ dữ liệu thay vì chỉ theo quy tắc. Mạng nơ-ron thường dùng trong nhận dạng hình ảnh.',
    order: 1,
  }, instructorToken))
  const updatedLesson = await request(`/courses/lessons/${createdLesson.lesson.id}`, jsonOptions('PATCH', {
    title: 'Nền tảng Machine Learning đã cập nhật', order: 2,
  }, instructorToken))
  if (updatedLesson.lesson.title !== 'Nền tảng Machine Learning đã cập nhật' || updatedLesson.lesson.order !== 2) {
    throw new Error('Lesson update did not persist')
  }

  const uploadBody = new FormData()
  uploadBody.set('title', 'Tài liệu kiểm thử')
  uploadBody.set('order', '2')
  uploadBody.set('document', new Blob([
    'Machine Learning giúp hệ thống học từ dữ liệu. Mạng nơ-ron được dùng để nhận dạng hình ảnh.',
  ], { type: 'text/plain' }), 'integration.txt')
  const uploadedLesson = await request(`/courses/${courseId}/lessons`, {
    method: 'POST', headers: { Authorization: `Bearer ${instructorToken}` }, body: uploadBody,
  })
  if (!uploadedLesson.lesson.documentName) throw new Error('Uploaded lesson has no document name')
  const replacementBody = new FormData()
  replacementBody.set('document', new Blob(['Replacement document content for integration verification.'], { type: 'text/plain' }), 'replacement.txt')
  const replacedDocument = await request(`/courses/lessons/${uploadedLesson.lesson.id}/document`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${instructorToken}` }, body: replacementBody,
  })
  if (replacedDocument.lesson.documentName !== 'replacement.txt') throw new Error('Lesson document replacement did not persist')
  const downloadResponse = await fetch(`${baseUrl}/courses/lessons/${uploadedLesson.lesson.id}/document`, {
    headers: { Authorization: `Bearer ${student.token}` },
  })
  if (!downloadResponse.ok || !(await downloadResponse.text()).includes('Replacement document content')) {
    throw new Error('Protected document download did not return the uploaded content')
  }
  const removedDocument = await request(`/courses/lessons/${uploadedLesson.lesson.id}/document`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${instructorToken}` },
  })
  if (removedDocument.lesson.documentName !== null) throw new Error('Lesson document removal did not persist')
  const removedDownload = await fetch(`${baseUrl}/courses/lessons/${uploadedLesson.lesson.id}/document`, {
    headers: { Authorization: `Bearer ${student.token}` },
  })
  if (removedDownload.status !== 404) throw new Error(`Removed document download returned ${removedDownload.status}, expected 404`)

  const detail = await request(`/courses/${courseId}`, { headers: { Authorization: `Bearer ${student.token}` } })
  if (detail.course.lessons.length !== 2) throw new Error('Student cannot see both lessons')
  const progressLessonId = createdLesson.lesson.id
  if (detail.course.lessons.find(({ id }) => id === progressLessonId).isCompleted) throw new Error('New lesson should start incomplete')
  const completed = await request(`/courses/lessons/${progressLessonId}/progress`, {
    method: 'PUT', headers: { Authorization: `Bearer ${student.token}` },
  })
  if (!completed.isCompleted) throw new Error('Lesson completion was not recorded')
  const instructorProgress = await fetch(`${baseUrl}/courses/lessons/${progressLessonId}/progress`, {
    method: 'PUT', headers: { Authorization: `Bearer ${instructorToken}` },
  })
  if (instructorProgress.status !== 403) throw new Error(`Instructor progress update returned ${instructorProgress.status}, expected 403`)
  const studentCourses = await request('/courses', { headers: { Authorization: `Bearer ${student.token}` } })
  const courseProgress = studentCourses.courses.find(({ id }) => id === courseId)
  if (courseProgress.completedLessons !== 1 || courseProgress.progressPercent !== 50) throw new Error('Course progress summary is incorrect')
  const updatedRoster = await request(`/courses/${courseId}/students`, { headers: { Authorization: `Bearer ${instructorToken}` } })
  if (updatedRoster.students[0].completedLessons !== 1 || updatedRoster.students[0].progressPercent !== 50) throw new Error('Instructor student progress is incorrect')
  const progressDetail = await request(`/courses/${courseId}`, { headers: { Authorization: `Bearer ${student.token}` } })
  if (!progressDetail.course.lessons.find(({ id }) => id === progressLessonId).isCompleted) throw new Error('Lesson completion did not persist')
  const uncompleted = await request(`/courses/lessons/${progressLessonId}/progress`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${student.token}` },
  })
  if (uncompleted.isCompleted) throw new Error('Lesson completion could not be undone')
  await request(`/courses/lessons/${progressLessonId}/progress`, {
    method: 'PUT', headers: { Authorization: `Bearer ${student.token}` },
  })

  const chat = await request(`/courses/lessons/${createdLesson.lesson.id}/chat`, jsonOptions('POST', {
    question: 'Machine Learning học từ đâu?',
  }, student.token))
  if (!chat.message.answer.includes('dữ liệu')) throw new Error('Study assistant did not return the relevant passage')
  const history = await request(`/courses/lessons/${createdLesson.lesson.id}/chat`, {
    headers: { Authorization: `Bearer ${student.token}` },
  })
  if (history.messages.length !== 1) throw new Error('Chat history was not persisted')

  const forbiddenResponse = await fetch(`${baseUrl}/courses/${courseId}`, jsonOptions('PATCH', {
    title: 'Unauthorized change',
  }, student.token))
  if (forbiddenResponse.status !== 403) throw new Error(`Student update returned ${forbiddenResponse.status}, expected 403`)

  await request(`/courses/${courseId}/enrollment`, { method: 'DELETE', headers: { Authorization: `Bearer ${student.token}` } })
  const afterLeaving = await fetch(`${baseUrl}/courses/${courseId}`, { headers: { Authorization: `Bearer ${student.token}` } })
  if (afterLeaving.status !== 403) throw new Error(`Course access after leaving returned ${afterLeaving.status}, expected 403`)

  const resetToken = 'a'.repeat(64)
  const newPassword = 'NewTestPass456'
  seedResetToken(studentEmail, resetToken)
  await request('/auth/reset-password', jsonOptions('POST', { token: resetToken, password: newPassword }))

  const oldSession = await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${student.token}` } })
  if (oldSession.status !== 401) throw new Error(`Old session returned ${oldSession.status}, expected 401`)
  const oldLogin = await fetch(`${baseUrl}/auth/login`, jsonOptions('POST', { email: studentEmail, password }))
  if (oldLogin.status !== 401) throw new Error(`Old password returned ${oldLogin.status}, expected 401`)
  const newLogin = await request('/auth/login', jsonOptions('POST', { email: studentEmail, password: newPassword }))
  if (!newLogin.token) throw new Error('New password login did not return a token')
  const reusedToken = await fetch(`${baseUrl}/auth/reset-password`, jsonOptions('POST', { token: resetToken, password }))
  if (reusedToken.status !== 400) throw new Error(`Reused reset token returned ${reusedToken.status}, expected 400`)
  const finalPassword = 'FinalTestPass789'
  await request('/auth/change-password', jsonOptions('POST', { currentPassword: newPassword, newPassword: finalPassword }, newLogin.token))
  const invalidatedSession = await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${newLogin.token}` } })
  if (invalidatedSession.status !== 401) throw new Error(`Session after password change returned ${invalidatedSession.status}, expected 401`)
  const finalLogin = await request('/auth/login', jsonOptions('POST', { email: studentEmail, password: finalPassword }))
  if (!finalLogin.token) throw new Error('Changed password login did not return a token')

  await request(`/courses/${courseId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${instructorToken}` } })
  courseId = null
  console.log('Integration flow passed: auth, password reset, authorization, course, enrollment, lesson progress, upload, assistant and cascade delete.')
} finally {
  if (courseId && instructorToken) {
    await fetch(`${baseUrl}/courses/${courseId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${instructorToken}` } }).catch(() => {})
  }
  cleanupUsers()
}
