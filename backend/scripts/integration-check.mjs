import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'

const baseUrl = process.env.TEST_API_URL || 'http://localhost:8080/api'
const stamp = Date.now()
const instructorEmail = `integration-instructor-${stamp}@example.com`
const studentEmail = `integration-student-${stamp}@example.com`
const managedEmail = `integration-managed-${stamp}@example.com`
const adminEmail = `integration-admin-${stamp}@example.com`
const password = 'TestPass123'
const adminPassword = 'AdminTestPass123!'
let courseId = null
let instructorToken = null
let adminToken = null

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
  const sql = `DELETE FROM "User" WHERE email IN ('${instructorEmail}', '${studentEmail}', '${managedEmail}', '${adminEmail}');`
  const result = spawnSync('docker', ['compose', 'exec', '-T', 'db', 'psql', '-q', '-U', 'postgres', '-d', 'lumina_lms', '-c', sql], {
    cwd: new URL('../..', import.meta.url),
    stdio: 'pipe',
    shell: false,
  })
  if (result.status !== 0) process.stderr.write('Không thể dọn tài khoản integration test.\n')
}

const createAdmin = async () => {
  const passwordHash = await bcrypt.hash(adminPassword, 10)
  const sql = `INSERT INTO "User" (name, email, password, role, "isActive") VALUES ('Integration Admin', '${adminEmail}', '${passwordHash}', 'ADMIN', TRUE);`
  const result = spawnSync('docker', ['compose', 'exec', '-T', 'db', 'psql', '-q', '-U', 'postgres', '-d', 'lumina_lms', '-c', sql], {
    cwd: new URL('../..', import.meta.url),
    stdio: 'pipe',
    shell: false,
  })
  if (result.status !== 0) throw new Error('Could not provision integration admin account')
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

const seedChatHistory = (email, lessonId, count) => {
  const timestamp = '2099-01-01T00:00:00.000Z'
  const sql = `INSERT INTO "ChatMessage" (question, answer, "userId", "lessonId", "createdAt") SELECT 'history-' || n, 'answer-' || n, u.id, ${lessonId}, '${timestamp}'::timestamptz FROM "User" u CROSS JOIN generate_series(1, ${count}) AS n WHERE u.email = '${email}';`
  const result = spawnSync('docker', ['compose', 'exec', '-T', 'db', 'psql', '-q', '-U', 'postgres', '-d', 'lumina_lms', '-c', sql], {
    cwd: new URL('../..', import.meta.url),
    stdio: 'pipe',
    shell: false,
  })
  if (result.status !== 0) throw new Error('Could not prepare deterministic chat history')
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

  const publicAdminRegistration = await fetch(`${baseUrl}/auth/register`, jsonOptions('POST', {
    name: 'Public Admin', email: `public-admin-${stamp}@example.com`, password, role: 'ADMIN',
  }))
  if (publicAdminRegistration.status !== 400) throw new Error(`Public admin registration returned ${publicAdminRegistration.status}, expected 400`)
  const managedUser = await request('/auth/register', jsonOptions('POST', {
    name: 'Managed Account', email: managedEmail, password, role: 'STUDENT',
  }))
  await createAdmin()
  const adminLogin = await request('/auth/login', jsonOptions('POST', { email: adminEmail, password: adminPassword }))
  adminToken = adminLogin.token
  const filteredUsers = await request(`/admin/users?q=${encodeURIComponent(instructorEmail)}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  if (filteredUsers.total !== 1 || filteredUsers.users[0].email !== instructorEmail || 'password' in filteredUsers.users[0]) {
    throw new Error('Admin user search or password privacy is incorrect')
  }
  const selfLock = await fetch(`${baseUrl}/admin/users/${adminLogin.user.id}`, jsonOptions('PATCH', { isActive: false }, adminToken))
  if (selfLock.status !== 403) throw new Error(`Admin self-lock returned ${selfLock.status}, expected 403`)
  const promoted = await request(`/admin/users/${managedUser.user.id}`, jsonOptions('PATCH', { role: 'INSTRUCTOR' }, adminToken))
  if (promoted.user.role !== 'INSTRUCTOR') throw new Error('Admin could not update an unlinked user role')
  const locked = await request(`/admin/users/${managedUser.user.id}`, jsonOptions('PATCH', { isActive: false }, adminToken))
  if (locked.user.isActive) throw new Error('Admin could not disable a user account')
  const lockedLogin = await fetch(`${baseUrl}/auth/login`, jsonOptions('POST', { email: managedEmail, password }))
  if (lockedLogin.status !== 401) throw new Error(`Disabled user login returned ${lockedLogin.status}, expected 401`)
  const reactivated = await request(`/admin/users/${managedUser.user.id}`, jsonOptions('PATCH', { isActive: true, role: 'STUDENT' }, adminToken))
  if (!reactivated.user.isActive || reactivated.user.role !== 'STUDENT') throw new Error('Admin could not reactivate and restore user role')

  const protectedRoleChange = await fetch(`${baseUrl}/admin/users/${instructor.user.id}`, jsonOptions('PATCH', { role: 'STUDENT' }, adminToken))
  if (protectedRoleChange.status !== 409) throw new Error(`Linked instructor role change returned ${protectedRoleChange.status}, expected 409`)

  const beforeJoin = await fetch(`${baseUrl}/courses/${courseId}`, { headers: { Authorization: `Bearer ${student.token}` } })
  if (beforeJoin.status !== 403) throw new Error(`Course access before enrollment returned ${beforeJoin.status}, expected 403`)

  const joined = await request('/courses/join', jsonOptions('POST', {
    joinCode: createdCourse.course.joinCode,
  }, student.token))
  if (joined.course.id !== courseId) throw new Error('Joined course does not match')
  if (joined.course.completedLessons !== 0 || joined.course.progressPercent !== 0) throw new Error('New course join returned an inconsistent progress summary')
  const roster = await request(`/courses/${courseId}/students`, { headers: { Authorization: `Bearer ${instructorToken}` } })
  if (roster.students.length !== 1 || roster.students[0].email !== studentEmail) throw new Error('Instructor roster is incorrect')

  const createdLesson = await request(`/courses/${courseId}/lessons`, jsonOptions('POST', {
    title: 'Nền tảng Machine Learning',
    content: 'Machine Learning giúp hệ thống học từ dữ liệu thay vì chỉ theo quy tắc. Mạng nơ-ron là mô hình gồm các nút liên kết. Thuật toán phân loại mô tả cách gán nhãn cho dữ liệu đầu vào. Tập huấn luyện chứa ví dụ để mô hình điều chỉnh tham số. Học có giám sát cho phép mô hình học từ ví dụ đã gắn nhãn. Tập kiểm tra dùng để đánh giá khả năng tổng quát.',
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
  uploadBody.set('document', new Blob([Buffer.alloc(1024 * 1024 + 1, 65)], { type: 'text/plain' }), 'integration.txt')
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

  const allowedLimitBody = new FormData()
  allowedLimitBody.set('document', new Blob([Buffer.alloc(10 * 1024 * 1024, 66)], { type: 'text/plain' }), 'allowed-limit.txt')
  const allowedLimitResponse = await fetch(`${baseUrl}/courses/lessons/${uploadedLesson.lesson.id}/document`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${instructorToken}` }, body: allowedLimitBody,
  })
  if (allowedLimitResponse.status !== 200) {
    throw new Error(`A 10 MiB replacement returned ${allowedLimitResponse.status}, expected 200`)
  }
  const allowedLimitResult = await allowedLimitResponse.json()
  if (allowedLimitResult.lesson.documentName !== 'allowed-limit.txt') throw new Error('The 10 MiB replacement was not stored')

  const backendOversizeBody = new FormData()
  backendOversizeBody.set('title', 'Oversized upload')
  backendOversizeBody.set('document', new Blob([Buffer.alloc(10 * 1024 * 1024 + 1, 67)], { type: 'text/plain' }), 'oversized.txt')
  const backendOversizeResponse = await fetch(`${baseUrl}/courses/${courseId}/lessons`, {
    method: 'POST', headers: { Authorization: `Bearer ${instructorToken}` }, body: backendOversizeBody,
  })
  const backendOversizeText = await backendOversizeResponse.text()
  if (backendOversizeResponse.status !== 413 || !backendOversizeText.includes('10 MiB')) {
    throw new Error(`A file over 10 MiB returned ${backendOversizeResponse.status} without the size error`)
  }

  const proxyOversizeBody = new FormData()
  proxyOversizeBody.set('document', new Blob([Buffer.alloc(12 * 1024 * 1024 + 1, 68)], { type: 'text/plain' }), 'proxy-oversized.txt')
  const proxyOversizeResponse = await fetch(`${baseUrl}/courses/lessons/${uploadedLesson.lesson.id}/document`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${instructorToken}` }, body: proxyOversizeBody,
  })
  const proxyOversizeText = await proxyOversizeResponse.text()
  if (proxyOversizeResponse.status !== 413 || !proxyOversizeResponse.headers.get('content-type')?.includes('text/html') || !proxyOversizeText.length) {
    throw new Error(`Nginx oversized body was not rejected with its expected non-JSON 413 response (${proxyOversizeResponse.status})`)
  }

  const removedDocument = await request(`/courses/lessons/${uploadedLesson.lesson.id}/document`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${instructorToken}` },
  })
  if (removedDocument.lesson.documentName !== null) throw new Error('Lesson document removal did not persist')
  const removedDownload = await fetch(`${baseUrl}/courses/lessons/${uploadedLesson.lesson.id}/document`, {
    headers: { Authorization: `Bearer ${student.token}` },
  })
  if (removedDownload.status !== 404) throw new Error(`Removed document download returned ${removedDownload.status}, expected 404`)

  const textSource = [
    'The document source marker describes a stable study method for this lesson.',
    'Students compare each concept with a clear example before the next exercise.',
    'Short review sessions help learners remember the important steps.',
    'A final reflection connects the new knowledge to a practical task.',
  ].join(' ')
  const fallbackSource = [
    'The updated PDF fallback marker explains the revised lesson content clearly.',
    'Every learner can use this paragraph to understand a central concept.',
    'Practice questions use these sentences when no PDF extractor is configured.',
    'Reviewing the lesson helps prepare for the next activity.',
  ].join(' ')
  const sourceLesson = await request(`/courses/${courseId}/lessons`, jsonOptions('POST', {
    title: 'Source transition checks', content: 'Original PDF fallback content is available.', order: 3,
  }, instructorToken))
  const pdfBody = new FormData()
  pdfBody.set('document', new Blob([Buffer.from('%PDF-1.4\nnot extracted')], { type: 'application/pdf' }), 'source.pdf')
  await request(`/courses/lessons/${sourceLesson.lesson.id}/document`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${instructorToken}` }, body: pdfBody,
  })
  await request(`/courses/lessons/${sourceLesson.lesson.id}`, jsonOptions('PATCH', { content: fallbackSource }, instructorToken))
  const pdfFallbackChat = await request(`/courses/lessons/${sourceLesson.lesson.id}/chat`, jsonOptions('POST', {
    question: 'updated PDF fallback marker',
  }, student.token))
  if (!pdfFallbackChat.message.answer.includes('updated PDF fallback marker')) throw new Error('Editing PDF fallback content did not update assistant text')
  const textBody = new FormData()
  textBody.set('document', new Blob([textSource], { type: 'text/markdown' }), 'source.md')
  await request(`/courses/lessons/${sourceLesson.lesson.id}/document`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${instructorToken}` }, body: textBody,
  })
  await request(`/courses/lessons/${sourceLesson.lesson.id}`, jsonOptions('PATCH', { content: 'Edited HTML fallback is not the Markdown document source.' }, instructorToken))
  const markdownChat = await request(`/courses/lessons/${sourceLesson.lesson.id}/chat`, jsonOptions('POST', {
    question: 'document source marker',
  }, student.token))
  if (!markdownChat.message.answer.includes('document source marker') || markdownChat.message.answer.includes('Edited HTML fallback')) {
    throw new Error('Editing lesson metadata replaced document-derived Markdown text')
  }
  await request(`/courses/lessons/${sourceLesson.lesson.id}/document`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${instructorToken}` },
  })
  const removedMarkdownChat = await request(`/courses/lessons/${sourceLesson.lesson.id}/chat`, jsonOptions('POST', {
    question: 'Edited HTML fallback',
  }, student.token))
  if (!removedMarkdownChat.message.answer.includes('Edited HTML fallback')) throw new Error('Removing Markdown did not restore lesson content as assistant text')

  const detail = await request(`/courses/${courseId}`, { headers: { Authorization: `Bearer ${student.token}` } })
  if (detail.course.lessons.length !== 3) throw new Error('Student cannot see all course lessons')
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
  if (courseProgress.completedLessons !== 1 || courseProgress.progressPercent !== 33) throw new Error('Course progress summary is incorrect')
  const updatedRoster = await request(`/courses/${courseId}/students`, { headers: { Authorization: `Bearer ${instructorToken}` } })
  if (updatedRoster.students[0].completedLessons !== 1 || updatedRoster.students[0].progressPercent !== 33) throw new Error('Instructor student progress is incorrect')
  const progressDetail = await request(`/courses/${courseId}`, { headers: { Authorization: `Bearer ${student.token}` } })
  if (!progressDetail.course.lessons.find(({ id }) => id === progressLessonId).isCompleted) throw new Error('Lesson completion did not persist')
  const uncompleted = await request(`/courses/lessons/${progressLessonId}/progress`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${student.token}` },
  })
  if (uncompleted.isCompleted) throw new Error('Lesson completion could not be undone')
  await request(`/courses/lessons/${progressLessonId}/progress`, {
    method: 'PUT', headers: { Authorization: `Bearer ${student.token}` },
  })
  await request(`/courses/${courseId}/enrollment`, { method: 'DELETE', headers: { Authorization: `Bearer ${student.token}` } })
  const rejoined = await request('/courses/join', jsonOptions('POST', {
    joinCode: createdCourse.course.joinCode,
  }, student.token))
  if (rejoined.course.completedLessons !== 1 || rejoined.course.progressPercent !== 33) {
    throw new Error('Leave and rejoin did not retain and immediately return course progress')
  }

  const createdAssignment = await request(`/courses/${courseId}/assignments`, jsonOptions('POST', {
    title: 'Integration Assignment',
    description: 'Explain the loop result and show your steps.',
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    points: 20,
  }, instructorToken))
  const updatedAssignment = await request(`/courses/assignments/${createdAssignment.assignment.id}`, jsonOptions('PATCH', {
    description: 'Explain the loop result and show each addition.',
  }, instructorToken))
  if (updatedAssignment.assignment.description !== 'Explain the loop result and show each addition.') throw new Error('Assignment update did not persist')
  const studentCourseWithAssignment = await request(`/courses/${courseId}`, { headers: { Authorization: `Bearer ${student.token}` } })
  if (studentCourseWithAssignment.course.assignments.length !== 1 || studentCourseWithAssignment.course.assignments[0].submissions.length !== 0) {
    throw new Error('Student assignment visibility or submission privacy is incorrect')
  }
  const submittedWork = await request(`/courses/assignments/${createdAssignment.assignment.id}/submission`, jsonOptions('PUT', {
    content: 'The loop adds each even number from 2 through 20, for a total of 110.',
  }, student.token))
  if (!submittedWork.submission.id) throw new Error('Student submission was not saved')
  const raceResponses = await Promise.all([
    fetch(`${baseUrl}/courses/assignments/${createdAssignment.assignment.id}/submission`, jsonOptions('PUT', {
      content: 'Concurrent edited submission content.',
    }, student.token)),
    fetch(`${baseUrl}/courses/assignments/${createdAssignment.assignment.id}/submissions/${student.user.id}`, jsonOptions('PATCH', {
      grade: 18, feedback: 'Correct method and result; explain the stop condition more clearly next time.',
    }, instructorToken)),
  ])
  const concurrentSubmission = raceResponses[0]
  const concurrentGrade = raceResponses[1]
  if (![200, 409].includes(concurrentSubmission.status) || ![200, 409].includes(concurrentGrade.status)) {
    throw new Error(`Concurrent submission/grading statuses were ${concurrentSubmission.status}/${concurrentGrade.status}`)
  }
  let gradedWork
  if (concurrentGrade.status === 409) {
    gradedWork = await request(`/courses/assignments/${createdAssignment.assignment.id}/submissions/${student.user.id}`, jsonOptions('PATCH', {
      grade: 18, feedback: 'Correct method and result; explain the stop condition more clearly next time.',
    }, instructorToken))
  } else {
    gradedWork = await concurrentGrade.json()
  }
  if (gradedWork.submission.grade !== 18) throw new Error('Instructor grade did not persist')
  if (concurrentSubmission.status === 409) {
    const finalSubmissionState = await request(`/courses/${courseId}`, { headers: { Authorization: `Bearer ${student.token}` } })
    if (finalSubmissionState.course.assignments[0].submissions[0].content !== submittedWork.submission.content) {
      throw new Error('A rejected concurrent submission changed already-graded content')
    }
  }
  const lowerPoints = await fetch(`${baseUrl}/courses/assignments/${createdAssignment.assignment.id}`, jsonOptions('PATCH', { points: 17 }, instructorToken))
  if (lowerPoints.status !== 409) throw new Error(`Lowering assignment points beneath an awarded grade returned ${lowerPoints.status}, expected 409`)
  const gradedAssignment = await request(`/courses/${courseId}`, { headers: { Authorization: `Bearer ${student.token}` } })
  const studentResult = gradedAssignment.course.assignments[0].submissions[0]
  if (studentResult.grade !== 18 || !studentResult.feedback) throw new Error('Student cannot see grade and feedback')
  const resubmitGraded = await fetch(`${baseUrl}/courses/assignments/${createdAssignment.assignment.id}/submission`, jsonOptions('PUT', {
    content: 'Edited after grading.',
  }, student.token))
  if (resubmitGraded.status !== 409) throw new Error(`Graded assignment update returned ${resubmitGraded.status}, expected 409`)

  const chat = await request(`/courses/lessons/${createdLesson.lesson.id}/chat`, jsonOptions('POST', {
    question: 'Machine Learning học từ đâu?',
  }, student.token))
  if (!chat.message.answer.includes('dữ liệu')) throw new Error('Study assistant did not return the relevant passage')
  seedChatHistory(studentEmail, createdLesson.lesson.id, 55)
  const history = await request(`/courses/lessons/${createdLesson.lesson.id}/chat`, {
    headers: { Authorization: `Bearer ${student.token}` },
  })
  if (history.messages.length !== 50 || history.messages[0].question !== 'history-6' || history.messages.at(-1).question !== 'history-55') {
    throw new Error('Chat history did not return the latest 50 rows in deterministic chronological order')
  }

  const quiz = await request(`/courses/lessons/${createdLesson.lesson.id}/quizzes`, jsonOptions('POST', { count: 5 }, student.token))
  if (quiz.questions.length !== 5 || quiz.questions.some((question) => 'correctIndex' in question || 'sourcePassage' in question || 'explanation' in question)) {
    throw new Error('Practice quiz did not hide its answer key')
  }
  const reopenedQuiz = await request(`/courses/quiz-attempts/${quiz.attemptId}`, { headers: { Authorization: `Bearer ${student.token}` } })
  if (reopenedQuiz.version !== 0 || reopenedQuiz.answers.length !== quiz.questions.length || reopenedQuiz.questions.some((question) => 'correctIndex' in question)) {
    throw new Error('Practice quiz did not reopen as a protected draft')
  }
  const draftAnswers = quiz.questions.map(() => 0)
  const savedDraft = await request(`/courses/quiz-attempts/${quiz.attemptId}/draft`, jsonOptions('PUT', {
    answers: draftAnswers, version: reopenedQuiz.version,
  }, student.token))
  const resumedQuiz = await request(`/courses/quiz-attempts/${quiz.attemptId}`, { headers: { Authorization: `Bearer ${student.token}` } })
  if (savedDraft.version !== 1 || resumedQuiz.answers.some((answer) => answer !== 0)) throw new Error('Practice quiz draft did not persist')
  const quizOwnerCheck = await fetch(`${baseUrl}/courses/quiz-attempts/${quiz.attemptId}/submit`, jsonOptions('POST', {
    answers: draftAnswers, version: resumedQuiz.version,
  }, instructorToken))
  if (quizOwnerCheck.status !== 404) throw new Error(`Another user quiz submission returned ${quizOwnerCheck.status}, expected 404`)
  const submittedQuiz = await request(`/courses/quiz-attempts/${quiz.attemptId}/submit`, jsonOptions('POST', {
    answers: draftAnswers, version: resumedQuiz.version,
  }, student.token))
  if (submittedQuiz.total !== 5 || submittedQuiz.score !== submittedQuiz.questions.filter(({ isCorrect }) => isCorrect).length) {
    throw new Error('Practice quiz score did not match the answer review')
  }
  const quizHistory = await request(`/courses/lessons/${createdLesson.lesson.id}/quizzes`, {
    headers: { Authorization: `Bearer ${student.token}` },
  })
  if (quizHistory.attempts[0].score !== submittedQuiz.score) throw new Error('Practice quiz result was not persisted')
  const detailedQuizResult = await request(`/courses/quiz-attempts/${quiz.attemptId}`, { headers: { Authorization: `Bearer ${student.token}` } })
  if (detailedQuizResult.questions.some((question) => !('selectedIndex' in question) || !question.sourcePassage)) throw new Error('Detailed practice quiz result did not persist')
  const duplicateQuizSubmit = await fetch(`${baseUrl}/courses/quiz-attempts/${quiz.attemptId}/submit`, jsonOptions('POST', {
    answers: draftAnswers, version: resumedQuiz.version,
  }, student.token))
  if (duplicateQuizSubmit.status !== 409) throw new Error(`Repeated quiz submission returned ${duplicateQuizSubmit.status}, expected 409`)

  const forbiddenResponse = await fetch(`${baseUrl}/courses/${courseId}`, jsonOptions('PATCH', {
    title: 'Unauthorized change',
  }, student.token))
  if (forbiddenResponse.status !== 403) throw new Error(`Student update returned ${forbiddenResponse.status}, expected 403`)

  await request(`/courses/${courseId}/enrollment`, { method: 'DELETE', headers: { Authorization: `Bearer ${student.token}` } })
  const afterLeaving = await fetch(`${baseUrl}/courses/${courseId}`, { headers: { Authorization: `Bearer ${student.token}` } })
  if (afterLeaving.status !== 403) throw new Error(`Course access after leaving returned ${afterLeaving.status}, expected 403`)
  const quizAfterLeaving = await fetch(`${baseUrl}/courses/quiz-attempts/${quiz.attemptId}`, { headers: { Authorization: `Bearer ${student.token}` } })
  if (quizAfterLeaving.status !== 403) throw new Error(`Quiz access after leaving returned ${quizAfterLeaving.status}, expected 403`)

  const resetToken = 'a'.repeat(64)
  const newPassword = 'NewTestPass456'
  seedResetToken(studentEmail, resetToken)
  await request('/auth/reset-password', jsonOptions('POST', { token: resetToken, password: newPassword }))

  const oldSession = await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${student.token}` } })
  if (oldSession.status !== 401 || (await oldSession.json()).code !== 'SESSION_INVALID') throw new Error('Password reset did not return a revoked-session error')
  const expiredDocumentDownload = await fetch(`${baseUrl}/courses/lessons/${createdLesson.lesson.id}/document`, {
    headers: { Authorization: `Bearer ${student.token}` },
  })
  if (expiredDocumentDownload.status !== 401 || (await expiredDocumentDownload.json()).code !== 'SESSION_INVALID') {
    throw new Error('Protected document download did not identify the expired session')
  }
  const oldLogin = await fetch(`${baseUrl}/auth/login`, jsonOptions('POST', { email: studentEmail, password }))
  if (oldLogin.status !== 401) throw new Error(`Old password returned ${oldLogin.status}, expected 401`)
  const oldLoginError = await oldLogin.json()
  if (oldLoginError.code !== 'INVALID_CREDENTIALS') throw new Error('Invalid login did not return a distinct authentication error code')
  const newLogin = await request('/auth/login', jsonOptions('POST', { email: studentEmail, password: newPassword }))
  if (!newLogin.token) throw new Error('New password login did not return a token')
  const reusedToken = await fetch(`${baseUrl}/auth/reset-password`, jsonOptions('POST', { token: resetToken, password }))
  if (reusedToken.status !== 400) throw new Error(`Reused reset token returned ${reusedToken.status}, expected 400`)
  const finalPassword = 'FinalTestPass789'
  const wrongCurrentPassword = await fetch(`${baseUrl}/auth/change-password`, jsonOptions('POST', {
    currentPassword: 'IncorrectPass456', newPassword: finalPassword,
  }, newLogin.token))
  if (wrongCurrentPassword.status !== 400 || (await wrongCurrentPassword.json()).code !== 'CURRENT_PASSWORD_INVALID') {
    throw new Error('Incorrect current password did not return a distinct non-session error')
  }
  const sessionAfterWrongPassword = await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${newLogin.token}` } })
  if (sessionAfterWrongPassword.status !== 200) throw new Error('Incorrect current password invalidated a valid session')
  const outstandingResetToken = 'b'.repeat(64)
  seedResetToken(studentEmail, outstandingResetToken)
  await request('/auth/change-password', jsonOptions('POST', { currentPassword: newPassword, newPassword: finalPassword }, newLogin.token))
  const invalidatedSession = await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${newLogin.token}` } })
  if (invalidatedSession.status !== 401 || (await invalidatedSession.json()).code !== 'SESSION_INVALID') throw new Error('Password change did not invalidate the prior session')
  const invalidatedResetToken = await fetch(`${baseUrl}/auth/reset-password`, jsonOptions('POST', { token: outstandingResetToken, password }))
  if (invalidatedResetToken.status !== 400) throw new Error('Password change did not invalidate the outstanding reset link')
  const finalLogin = await request('/auth/login', jsonOptions('POST', { email: studentEmail, password: finalPassword }))
  if (!finalLogin.token) throw new Error('Changed password login did not return a token')

  await request(`/courses/${courseId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${instructorToken}` } })
  courseId = null
  console.log('Integration flow passed: auth, password reset, authorization, course, enrollment, lesson progress, assignments, grading, practice quiz, upload, assistant and cascade delete.')
} finally {
  if (courseId && instructorToken) {
    await fetch(`${baseUrl}/courses/${courseId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${instructorToken}` } }).catch(() => {})
  }
  cleanupUsers()
}
