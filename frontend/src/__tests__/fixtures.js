// Synthetic component fixtures and per-file cleanup only. No real credentials.
import { afterEach, test, vi } from 'vitest'

import assert from 'node:assert/strict'

import React from 'react'

import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import { SessionProvider, useSession } from '../app/SessionContext.jsx'

import { MemoryRouter, Route, Routes, Link, useParams } from 'react-router-dom'

import AppLayout from '../components/AppLayout.jsx'

import CourseWorkspacePage from '../pages/CourseWorkspacePage.jsx'

import DashboardPage from '../pages/DashboardPage.jsx'

import AdminPage from '../pages/AdminPage.jsx'

import AuthPage from '../pages/AuthPage.jsx'

import ResetPasswordPage from '../pages/ResetPasswordPage.jsx'

import { validateEntry, validateReset } from '../services/authEntry.js'

import AccountPage from '../pages/AccountPage.jsx'

import { useLocation, useNavigate } from 'react-router-dom'

import PracticeQuizPanel from '../components/PracticeQuizPanel.jsx'

import AssignmentsPanel from '../components/AssignmentsPanel.jsx'

import LessonSummaryPanel from '../components/LessonSummaryPanel.jsx'

import DocumentAssistantPanel from '../components/DocumentAssistantPanel.jsx'

import { apiRequest, fetchDocument } from '../services/api.js'

import { resolvePostLoginDestination } from '../services/navigation.js'

import App from '../app/App.jsx'

import { assignmentId, filterAssignments, orderAssignments, studentAssignmentState } from '../services/assignmentView.js'

const fixtureRequestUrl = (url) => new URL(String(url), window.location.href)

function EntryControls() {
  const navigate = useNavigate()
  const session = useSession()
  return h('aside', null,
    h('button', { onClick: () => navigate(-1) }, 'Test back'),
    h('button', { onClick: () => navigate(1) }, 'Test forward'),
    h('button', { onClick: () => navigate('/elsewhere') }, 'Test depart'),
    h('button', { onClick: () => navigate('/reset-password?token=' + 'b'.repeat(64)) }, 'Test replace link'),
    h('button', { onClick: () => session.logout() }, 'Test logout'),
    h('button', { onClick: () => session.acceptCredentials({ token: 'replacement-fixture' }).catch(() => {}) }, 'Test replace session'))
}

function entryRender(path = '/auth', state) {
  return render(h(MemoryRouter, { initialEntries: [{ pathname: path.split('?')[0], search: path.includes('?') ? '?' + path.split('?')[1] : '', state }] }, h(SessionProvider, null,
    h(EntryControls), h(Routes, null,
      h(Route, { path: '/auth', element: h(AuthPage) }),
      h(Route, { path: '/reset-password', element: h(ResetPasswordPage) }),
      h(Route, { path: '*', element: h(LocationEcho) })))))
}

function LocationEcho() { const l = useLocation(); return h('output', null, l.pathname + l.search + l.hash) }

function entryFill(email = 'fixture@example.test', password = ' rawpw ') {
  fireEvent.change(document.querySelector('#email'), { target: { value: email } })
  if (document.querySelector('#password')) fireEvent.change(document.querySelector('#password'), { target: { value: password } })
}

function resetFill(password = ' rawpw ', confirmation = password) {
  fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: password } })
  fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), { target: { value: confirmation } })
}

const entrySubmit = () => fireEvent.submit(document.querySelector('form.auth-card'))

function assignmentFixture(id, changes = {}) {
  return { id, title: `Bài ${id}`, description: `Yêu cầu ${id}`, points: 10, dueAt: '2099-05-02T10:00:00.000Z', createdAt: `2026-01-0${id}T00:00:00.000Z`, submissions: [], ...changes }
}

function submissionFixture(id, changes = {}) {
  return { id, studentId: id + 100, content: `Nội dung đã nộp ${id}`, grade: null, feedback: null, submittedAt: '2026-01-01T00:00:00.000Z', student: { id: id + 100, name: `Người học ${id}`, email: `learner${id}@example.test` }, ...changes }
}

function AssignmentHarness({ assignments, isInstructor = false, courseId = 4 }) {
  const [course, setCourse] = React.useState({ id: courseId, assignments })
  return h(AssignmentsPanel, { course, isInstructor, onAssignmentsChange: (updater) => setCourse((current) => ({ ...current, assignments: typeof updater === 'function' ? updater(current.assignments) : updater })) })
}

const assignmentChoice = (name) => screen.getByRole('button', { name: `Mở bài tập ${name}` })

function AssignmentHistory() {
  const navigate = useNavigate(); const location = useLocation()
  return h('div', null, h('output', { 'aria-label': 'Địa chỉ kiểm tra' }, location.pathname + location.search), h('button', { onClick: () => navigate(-1) }, 'Quay lại kiểm tra'), h('button', { onClick: () => navigate(1) }, 'Tiến tới kiểm tra'))
}

const nativeFetch = globalThis.fetch

afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); globalThis.fetch = nativeFetch; vi.useRealTimers() })

const h = React.createElement

const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

const learnerCourse = (id = 1) => ({ id, title: `Khóa ${id}`, description: 'Nội dung khóa học', instructor: { name: 'Giảng viên' }, _count: { lessons: 3, enrollments: 1 }, completedLessons: 1, progressPercent: 33 })

function renderDashboard() {
  localStorage.setItem('luminaToken', 'test-session')
  return render(h(MemoryRouter, { initialEntries: ['/dashboard'] }, h(SessionProvider, null,
    h(AppLayout, null, h(DashboardPage), h(CurrentPath)))))
}

function renderAdminFixture(identity = () => ({ id: 90, name: 'ADMIN thử', role: 'ADMIN', email: 'admin90@example.test' }), controls = false) {
  const handle = globalThis.fetch
  localStorage.setItem('luminaToken', 'fixture-same')
  globalThis.fetch = async (url, options = {}) => String(url).endsWith('/api/auth/me') ? jsonResponse({ user: identity() }) : handle(url, options)
  return render(h(SessionProvider, null, h(MemoryRouter, { initialEntries: ['/admin'] }, h(AdminPage), controls && h(AccountSessionControls))))
}

async function selectAdmin(id = 1) {
  await userEvent.click(await screen.findByRole('button', { name: 'Chỉnh sửa learner' + id + '@example.test' }))
  return screen.findByLabelText('Họ tên')
}

function adminRecord(id = 1) { return { id, name: `Học viên ${id}`, email: `learner${id}@example.test`, role: 'STUDENT', isActive: true, createdAt: '2026-01-01', _count: { enrollments: 1, submissions: 0 } } }

function dialogTestSupport() {
  // jsdom support for component semantics only; native modal behavior requires browser verification.
  const prototype = window.HTMLDialogElement.prototype
  prototype.showModal = function () { this.setAttribute('open', '') }
  prototype.close = function () { this.removeAttribute('open') }
}

function SessionStatus() { const session = useSession(); return h('div', null, h('span', null, session.status), h('button', { onClick: session.logout }, 'logout')) }

function CurrentPath() { const location = useLocation(); return h('span', { 'data-testid': 'current-path' }, location.pathname + location.search) }

const workspaceLesson = (id, extra = {}) => ({ id, title: 'Bài ' + id, content: 'Nội dung đọc ' + id, order: id, createdAt: '2026-01-01', isCompleted: false, ...extra })

const workspaceCourse = () => ({ id: 4, title: 'Không gian học thử', description: 'Mô tả khóa', joinCode: 'ABCD1234', instructor: { name: 'Giảng viên thử' }, _count: { enrollments: 3 }, lessons: [workspaceLesson(1), workspaceLesson(2, { isCompleted: true }), workspaceLesson(3)], assignments: [] })

function workspaceFetch(role = 'STUDENT', handler, course = workspaceCourse()) {
  localStorage.setItem('luminaToken', 'test-session')
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).endsWith('/api/auth/me')) return jsonResponse({ user: { id: 10, name: 'Người thử', role, email: 'test@example.test' } })
    if (handler) { const result = handler(String(url), options); if (result !== undefined) return result }
    if (String(url).endsWith('/api/courses/4')) return jsonResponse({ course })
    throw new Error('Unexpected workspace request: ' + url)
  }
}

function renderWorkspace(initial = '/courses/4?section=lessons&lessonId=1') {
  return render(h(SessionProvider, null, h(MemoryRouter, { initialEntries: [initial] }, h(React.Fragment, null,
    h(CurrentPath), h(Routes, null, h(Route, { path: '/courses/:courseId', element: h(CourseWorkspacePage) }))))))
}

function quizDraft(id, changes = {}) {
  return { attemptId: id, submittedAt: null, version: 0, answers: [null], questions: [{ id: 'q' + id, prompt: 'Câu hỏi ' + id, options: ['Lựa chọn A', 'Lựa chọn B'] }], ...changes }
}

function quizHistory(id, changes = {}) {
  return { id, createdAt: '2026-01-0' + id + 'T10:00:00Z', submittedAt: null, score: null, questionCount: 1, version: 0, ...changes }
}

function quizResult(id, changes = {}) {
  return { attemptId: id, submittedAt: '2026-02-01T10:00:00Z', score: 0, total: 1, questions: [{ ...quizDraft(id).questions[0], selectedIndex: 1, correctIndex: 0, isCorrect: false, explanation: 'Giải thích từ nguồn', sourcePassage: 'Đoạn nguồn' }], ...changes }
}

function quizApi(history = [quizHistory(1), quizHistory(2)], handle = () => undefined) {
  const calls = []
  globalThis.fetch = (url, options = {}) => {
    const path = fixtureRequestUrl(url).pathname, method = options.method || 'GET'
    const body = options.body ? JSON.parse(options.body) : undefined
    const call = { path, method, body }; calls.push(call)
    const custom = handle(call, calls)
    if (custom !== undefined) return Promise.resolve(custom)
    if (path.endsWith('/quizzes')) return Promise.resolve(jsonResponse(method === 'GET' ? { attempts: history } : { ...quizDraft(3), actualCount: 1, requestedCount: body.count }))
    const id = Number(path.match(/quiz-attempts\/(\d+)/)?.[1])
    if (path.endsWith('/draft')) return Promise.resolve(jsonResponse({ version: body.version + 1, answers: body.answers }))
    if (path.endsWith('/submit')) return Promise.resolve(jsonResponse(quizResult(id)))
    return Promise.resolve(jsonResponse(quizDraft(id)))
  }
  return calls
}

const tickQuizSave = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 650)) })

async function showQuiz(id = 1) { await userEvent.click(await screen.findByRole('button', { name: 'Tiếp tục bài ôn #' + id })); return screen.findByRole('radio', { name: 'Lựa chọn A' }) }

function QuizBrowserHistory() {
  const navigate = useNavigate()
  return h('div', null, h('button', { onClick: () => navigate(-1) }, 'Lùi quiz'), h('button', { onClick: () => navigate(1) }, 'Tiến quiz'))
}

function studyJson(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

function studyMessage(id, question = 'Khái niệm ' + id, answer = 'Nội dung tra cứu ' + id) {
  return { id, question, answer, createdAt: new Date(1700000000000 + id * 1000).toISOString() }
}

function studyDeferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

function renderLookup(lesson = { id: 41, title: 'Bài nguồn', sourceRevision: 1 }, onClose = vi.fn()) {
  return render(h(DocumentAssistantPanel, { lesson, onClose }))
}

function studySummary(changes = {}) {
  return { title: 'Tóm tắt trích xuất', points: [{ text: 'Các câu được chọn trực tiếp từ nguồn bài học.', page: null }], sourceType: 'LESSON_CONTENT', sourceRevision: 1, truncated: false, ...changes }
}

function StudyBrowserHistory() {
  const navigate = useNavigate()
  return h('div', null, h('button', { onClick: () => navigate(-1) }, 'Back study'), h('button', { onClick: () => navigate(1) }, 'Forward study'))
}

const accountUser = (id = 10, role = 'STUDENT', name = 'Người dùng ' + id) => ({ id, role, name, email: 'user' + id + '@example.test' })

function AccountSessionControls() {
  const session = useSession()
  return h('div', null, h('span', { 'data-testid': 'session-name' }, session.user?.name || 'no-user'),
    h('span', { 'data-testid': 'session-status' }, session.status),
    h('button', { onClick: () => session.acceptCredentials({ token: 'fixture-same' }).catch(() => {}) }, 'Install same'),
    h('button', { onClick: () => session.acceptCredentials({ token: 'fixture-new' }).catch(() => {}) }, 'Install new'),
    h('button', { onClick: session.logout }, 'Fixture logout'))
}

function renderAccountFixture(role = 'STUDENT', handler = () => undefined) {
  localStorage.setItem('luminaToken', 'fixture-same')
  const user = accountUser(10, role)
  globalThis.fetch = async (url, options = {}) => {
    const result = handler(String(url), options)
    if (result !== undefined) return result
    return studyJson({ user })
  }
  return render(h(SessionProvider, null, h(MemoryRouter, { initialEntries: ['/account'] }, h(AppLayout, null, h(AccountPage)), h(AccountSessionControls))))
}

function renderRealAccount(handler) {
  localStorage.setItem('luminaToken', 'fixture-same')
  window.history.replaceState(null, '', '/account')
  globalThis.fetch = async (url, options = {}) => handler(String(url), options)
  return render(h(App))
}

async function openAccountPasswords() {
  await screen.findByLabelText('Họ và tên')
  await userEvent.click(screen.getByRole('button', { name: 'Mở biểu mẫu đổi mật khẩu' }))
  return screen.getByLabelText('Mật khẩu hiện tại')
}

function fillAccountPasswords(currentPassword = 'old-fixture', newPassword = 'new-fixture', confirmation = newPassword) {
  for (const [label, value] of [['Mật khẩu hiện tại',currentPassword],['Mật khẩu mới',newPassword],['Xác nhận mật khẩu mới',confirmation]]) fireEvent.change(screen.getByLabelText(label), { target: { value } })
  return screen.getByLabelText('Mật khẩu hiện tại').closest('form')
}

const adminList = (users = [adminRecord()], extra = {}) => ({ users, total: users.length, totalPages: users.length ? 1 : 0, page: 1, pageSize: 25, ...extra })

export { afterEach, test, vi, assert, React, act, cleanup, fireEvent, render, screen, waitFor, within, userEvent, SessionProvider, useSession, MemoryRouter, Route, Routes, Link, useParams, AppLayout, CourseWorkspacePage, DashboardPage, AdminPage, AuthPage, ResetPasswordPage, validateEntry, validateReset, AccountPage, useLocation, useNavigate, PracticeQuizPanel, AssignmentsPanel, LessonSummaryPanel, DocumentAssistantPanel, apiRequest, fetchDocument, resolvePostLoginDestination, App, assignmentId, filterAssignments, orderAssignments, studentAssignmentState, fixtureRequestUrl, EntryControls, entryRender, LocationEcho, entryFill, resetFill, entrySubmit, assignmentFixture, submissionFixture, AssignmentHarness, assignmentChoice, AssignmentHistory, nativeFetch, h, jsonResponse, learnerCourse, renderDashboard, renderAdminFixture, selectAdmin, adminRecord, dialogTestSupport, SessionStatus, CurrentPath, workspaceLesson, workspaceCourse, workspaceFetch, renderWorkspace, quizDraft, quizHistory, quizResult, quizApi, tickQuizSave, showQuiz, QuizBrowserHistory, studyJson, studyMessage, studyDeferred, renderLookup, studySummary, StudyBrowserHistory, accountUser, AccountSessionControls, renderAccountFixture, renderRealAccount, openAccountPasswords, fillAccountPasswords, adminList }
