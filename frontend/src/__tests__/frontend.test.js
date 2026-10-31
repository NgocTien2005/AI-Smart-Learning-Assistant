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
import AccountPage from '../pages/AccountPage.jsx'
import { useLocation } from 'react-router-dom'
import PracticeQuizPanel from '../components/PracticeQuizPanel.jsx'
import AssignmentsPanel from '../components/AssignmentsPanel.jsx'
import LessonSummaryPanel from '../components/LessonSummaryPanel.jsx'
import { resolvePostLoginDestination } from '../services/navigation.js'
import App from '../app/App.jsx'

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
function adminRecord(id = 1) { return { id, name: `Học viên ${id}`, email: `learner${id}@example.test`, role: 'STUDENT', isActive: true, createdAt: '2026-01-01', _count: { enrollments: 1, submissions: 0 } } }
function dialogTestSupport() {
  // jsdom support for component semantics only; native modal behavior requires browser verification.
  const prototype = window.HTMLDialogElement.prototype
  prototype.showModal = function () { this.setAttribute('open', '') }
  prototype.close = function () { this.removeAttribute('open') }
}
function SessionStatus() { const session = useSession(); return h('div', null, h('span', null, session.status), h('button', { onClick: session.logout }, 'logout')) }

test('lesson summary exposes retry and renders source points and page references', async () => {
  let attempts = 0
  globalThis.fetch = async () => {
    attempts += 1
    if (attempts === 1) return new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify({ title: 'Tóm tắt trích xuất', points: [{ text: 'Nguồn lưu trữ nội dung.', page: 3 }], sourceType: 'DOCUMENT', sourceRevision: 4, truncated: false }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  render(h(LessonSummaryPanel, { lesson: { id: 41, title: 'Bài học' }, onClose: vi.fn() }))
  await screen.findByText('Không tải được tóm tắt')
  await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  await screen.findByText('Nguồn lưu trữ nội dung.')
  assert.ok(screen.getByText(/Trang 3/))
  assert.equal(attempts, 2)
})

test('switching lessons ignores an older summary response', async () => {
  const requests = []
  globalThis.fetch = () => new Promise((resolve) => requests.push(resolve))
  const view = render(h(LessonSummaryPanel, { lesson: { id: 1, title: 'Cũ' }, onClose: vi.fn() }))
  await waitFor(() => assert.equal(requests.length, 1))
  view.rerender(h(LessonSummaryPanel, { lesson: { id: 2, title: 'Mới' }, onClose: vi.fn() }))
  await waitFor(() => assert.equal(requests.length, 2))
  const result = (text) => new Response(JSON.stringify({ points: [{ text, page: null }], sourceType: 'LESSON_CONTENT', sourceRevision: 1, truncated: false }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  requests[1](result('Nội dung bài mới.'))
  await screen.findByText('Nội dung bài mới.')
  requests[0](result('Nội dung bài cũ.'))
  await new Promise((resolve) => setTimeout(resolve, 0))
  assert.ok(screen.queryByText('Nội dung bài cũ.') === null)
})

test('startup /me network failure preserves the valid stored session token', async () => {
  localStorage.setItem('luminaToken', 'valid-session')
  globalThis.fetch = async () => { throw new TypeError('offline') }
  render(h(SessionProvider, null, h(SessionStatus)))
  await screen.findByText('error')
  assert.equal(localStorage.getItem('luminaToken'), 'valid-session')
})

test('login destination preserves internal query and rejects external or forbidden destinations', () => {
  assert.equal(resolvePostLoginDestination({ pathname: '/courses/12', search: '?section=lessons&lessonId=7' }, 'STUDENT'), '/courses/12?section=lessons&lessonId=7')
  assert.equal(resolvePostLoginDestination('//evil.example', 'STUDENT'), '/dashboard')
  assert.equal(resolvePostLoginDestination({ pathname: '/admin', search: '?page=2' }, 'STUDENT'), '/dashboard')
})

test('quiz choice is flushed before closing ahead of debounce', async () => {
  localStorage.setItem('luminaToken', 'test')
  const calls = []
  globalThis.fetch = async (url, options = {}) => {
    calls.push([String(url), options.method || 'GET'])
    let body = {}
    if (String(url).endsWith('/quizzes') && (options.method || 'GET') === 'GET') body = { attempts: [] }
    else if (String(url).endsWith('/quizzes')) body = { attemptId: 'a1', version: 0, requestedCount: 3, actualCount: 1, questions: [{ id: 'q1', prompt: '_____ lặp lại.', options: ['Vòng lặp', 'Biến'] }] }
    else if (String(url).endsWith('/a1/draft')) body = { version: 1 }
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  const user = userEvent.setup()
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Bài 9' }, onClose() {} }))
  await user.click(await screen.findByRole('button', { name: 'Tạo bài ôn nhanh' }))
  await user.click(await screen.findByRole('radio', { name: /Vòng lặp/ }))
  await user.click(screen.getByRole('button', { name: 'Đóng bài ôn tập' }))
  await waitFor(() => assert.ok(calls.some(([url, method]) => url.endsWith('/a1/draft') && method === 'PUT')))
  assert.equal(screen.queryByText('Bản nháp chưa lưu'), null)
})

test('student can still read submitted content and feedback without a grade after deadline', () => {
  const assignment = { id: 5, title: 'Bài tập', points: 10, dueAt: '2020-01-01T00:00:00.000Z', isOverdue: true, description: 'Yêu cầu', submissions: [{ id: 8, studentId: 3, content: 'Bài làm đã nộp', grade: null, feedback: 'Cần bổ sung ví dụ', submittedAt: '2020-01-01T00:00:00.000Z' }] }
  render(h(AssignmentsPanel, { course: { id: 1, assignments: [assignment] }, isInstructor: false }))
  assert.ok(screen.getByText('Bài làm đã nộp'))
  assert.ok(screen.getByText('Cần bổ sung ví dụ'))
})

test('instructor grade zero remains visible as a saved value', () => {
  const assignment = { id: 5, title: 'Bài tập', points: 10, dueAt: null, description: 'Yêu cầu', submissions: [{ id: 8, studentId: 3, content: 'Bài làm', grade: 0, feedback: '', submittedAt: '2026-01-01T00:00:00.000Z', student: { id: 3, name: 'Học viên', email: 'learner@example.test' } }] }
  render(h(AssignmentsPanel, { course: { id: 1, assignments: [assignment] }, isInstructor: true }))
  assert.equal(screen.getByLabelText('Điểm').value, '0')
})


test('late /me response cannot restore a session after logout', async () => {
  localStorage.setItem('luminaToken', 'valid-session')
  let resolveMe
  globalThis.fetch = () => new Promise((resolve) => { resolveMe = resolve })
  const user = userEvent.setup()
  render(h(SessionProvider, null, h(SessionStatus)))
  await user.click(await screen.findByRole('button', { name: 'logout' }))
  resolveMe(new Response(JSON.stringify({ user: { id: 1, role: 'STUDENT', name: 'Learner' } }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
  await waitFor(() => assert.equal(screen.getByText('anonymous').textContent, 'anonymous'))
  assert.equal(localStorage.getItem('luminaToken'), null)
})

test('changing course keys the workspace so a late course A response cannot appear under B', async () => {
  localStorage.setItem('luminaToken', 'test')
  let resolveA
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/api/auth/me')) return new Response(JSON.stringify({ user: { id: 2, role: 'STUDENT', name: 'Student' } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    if (String(url).endsWith('/api/courses/1')) return new Promise((resolve) => { resolveA = resolve })
    if (String(url).endsWith('/api/courses/2')) return new Response(JSON.stringify({ course: { id: 2, title: 'Course B', description: '', lessons: [], assignments: [], instructor: { name: 'Teacher' }, _count: { enrollments: 1 } } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    throw new Error(String(url))
  }
  function WorkspaceRoute() { const { courseId } = useParams(); return h(CourseWorkspacePage, { key: courseId }) }
  render(h(SessionProvider, null, h(MemoryRouter, { initialEntries: ['/courses/1'] }, h(React.Fragment, null, h(Link, { to: '/courses/2' }, 'Go B'), h(Routes, null, h(Route, { path: '/courses/:courseId', element: h(WorkspaceRoute) }))))))
  await userEvent.setup().click(await screen.findByRole('link', { name: 'Go B' }))
  await screen.findByRole('heading', { name: 'Course B' })
  resolveA(new Response(JSON.stringify({ course: { id: 1, title: 'Course A', lessons: [], assignments: [], instructor: { name: 'Teacher' }, _count: { enrollments: 1 } } }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
  await new Promise((resolve) => setTimeout(resolve, 10))
  assert.equal(screen.queryByRole('heading', { name: 'Course A' }), null)
})

test('instructor course overview uses role-specific actions and URL-backed styled section links', async () => {
  localStorage.setItem('luminaToken', 'test')
  const user = userEvent.setup()
  const writeText = vi.fn().mockResolvedValue(undefined)
  const lessonPosts = []
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).endsWith('/api/auth/me')) return new Response(JSON.stringify({ user: { id: 4, name: 'Teacher', role: 'INSTRUCTOR', email: 'teacher@example.test' } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    if (String(url).endsWith('/api/courses/4/lessons') && options.method === 'POST') { lessonPosts.push(options.body); return new Response(JSON.stringify({ lesson: { id: 10, title: 'Bài mới', content: 'Nội dung bài mới', order: 2, isCompleted: false } }), { status: 201, headers: { 'Content-Type': 'application/json' } }) }
    if (String(url).endsWith('/api/courses/4')) return new Response(JSON.stringify({ course: { id: 4, title: 'Lập trình căn bản', description: 'Khóa học thử nghiệm.', joinCode: 'ABCD1234', instructor: { name: 'Teacher' }, lessons: [{ id: 8, title: 'Bài học đầu tiên', content: 'Nội dung', order: 1, isCompleted: false }], assignments: [{ id: 9, title: 'Bài tập đầu tiên', points: 10, submissions: [] }], _count: { enrollments: 3 } } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    throw new Error(String(url))
  }
  function CurrentUrl() { const location = useLocation(); return h('output', null, location.pathname + location.search) }
  const router = h(MemoryRouter, { initialEntries: ['/courses/4?section=overview'] }, h(React.Fragment, null, h(CurrentUrl), h(Routes, null, h(Route, { path: '/courses/:courseId', element: h(CourseWorkspacePage) }))))
  render(h(SessionProvider, null, router))

  await screen.findByRole('heading', { name: 'Lập trình căn bản' })
  assert.ok(screen.getByText('Học viên đang tham gia'))
  assert.equal(screen.queryByRole('button', { name: 'Tiếp tục học' }), null)
  assert.ok(screen.getByRole('link', { name: 'Bài học' }))
  assert.equal(screen.getByRole('button', { name: /Học viên đang tham gia/ }).className, 'course-stat-card')
  await user.click(screen.getByRole('button', { name: 'Sao chép mã' }))
  assert.deepEqual(writeText.mock.calls[0], ['ABCD1234'])
  await screen.findByText('Đã sao chép mã tham gia.')
  await user.click(screen.getByRole('button', { name: 'Thêm bài học' }))
  await screen.findByLabelText('Nội dung')
  assert.equal(screen.getByRole('link', { name: 'Bài học' }).getAttribute('aria-current'), 'page')
  assert.equal(screen.getByText('/courses/4?section=lessons').textContent, '/courses/4?section=lessons')
  await user.type(screen.getByLabelText('Tiêu đề'), 'Bài mới')
  await user.type(screen.getByLabelText('Nội dung'), 'Nội dung bài mới')
  await user.click(screen.getByRole('button', { name: 'Thêm bài học' }))
  await screen.findByText('Đã thêm bài học.')
  assert.equal(lessonPosts.length, 1)
})

function CurrentPath() { const location = useLocation(); return h('span', { 'data-testid': 'current-path' }, location.pathname + location.search) }

test.each([
  [{ id: 1, name: 'Đặng Ngọc Tiên', email: 'student@example.test', role: 'STUDENT' }, 'Học viên', 'ĐT'],
  [{ id: 2, name: 'Nguyễn Minh Anh', email: 'teacher@example.test', role: 'INSTRUCTOR' }, 'Giảng viên', 'NA'],
  [{ id: 3, name: 'Quản trị Lumina', email: 'admin@example.test', role: 'ADMIN' }, 'Quản trị viên', 'QL'],
  [{ id: 4, name: 'Nguyễn Thị Phương Thảo có tên hiển thị rất dài', email: 'long@example.test', role: 'STUDENT' }, 'Học viên', 'ND'],
])('renders an accessible compact profile for %s', async (userData, roleLabel, avatarText) => {
  localStorage.setItem('luminaToken', 'test-session')
  globalThis.fetch = async (url) => String(url).endsWith('/api/auth/me')
    ? new Response(JSON.stringify({ user: userData }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    : new Response(JSON.stringify({ courses: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  render(h(MemoryRouter, { initialEntries: ['/dashboard'] }, h(SessionProvider, null, h(AppLayout, null, h(CurrentPath)))))

  const profile = await screen.findByRole('group', { name: `${userData.name}, ${roleLabel}` })
  assert.ok(profile)
  assert.equal(within(profile).getByText(avatarText).getAttribute('aria-hidden'), 'true')
  const profileName = within(profile).getByText(userData.name)
  assert.equal(profileName.title, userData.name)
  assert.ok(within(profile).getByText(roleLabel))
  assert.equal(screen.getByRole('link', { name: 'Tài khoản' }).getAttribute('href'), '/account')

  await userEvent.setup().click(screen.getByRole('button', { name: 'Đăng xuất' }))
  await waitFor(() => assert.equal(screen.getByTestId('current-path').textContent, '/auth'))
  assert.equal(localStorage.getItem('luminaToken'), null)
})

test('dashboard omits its redundant breadcrumb and keeps course search and progress filtering aligned', async () => {
  localStorage.setItem('luminaToken', 'test-session')
  const user = userEvent.setup()
  const courses = [
    { id: 1, title: 'Python cơ bản', description: 'Nhập môn Python', instructor: { name: 'Giảng viên' }, _count: { lessons: 2, enrollments: 1 }, completedLessons: 2, progressPercent: 100, createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 2, title: 'Cấu trúc dữ liệu', description: 'Danh sách và cây', instructor: { name: 'Giảng viên' }, _count: { lessons: 3, enrollments: 1 }, completedLessons: 1, progressPercent: 33, createdAt: '2026-01-02T00:00:00.000Z' },
  ]
  globalThis.fetch = async (url) => {
    const payload = String(url).endsWith('/api/auth/me')
      ? { user: { id: 10, name: 'Học viên kiểm thử', email: 'student@example.test', role: 'STUDENT' } }
      : { courses }
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  render(h(MemoryRouter, { initialEntries: ['/dashboard'] }, h(SessionProvider, null, h(Routes, null,
    h(Route, { path: '/dashboard', element: h(AppLayout, null, h(DashboardPage)) }),
    h(Route, { path: '/courses/:courseId', element: h(AppLayout, null, h('main', null, 'Chi tiết khóa học')) }),
  ))))

  await screen.findByRole('heading', { name: 'Khóa học của tôi' })
  assert.equal(screen.getAllByRole('link', { name: 'Tổng quan' }).length, 1)
  assert.equal(screen.queryByRole('navigation', { name: 'Đường dẫn' }), null)
  const search = screen.getByRole('searchbox', { name: 'Tìm kiếm' })
  assert.equal(search.placeholder, 'Tìm khóa học…')
  assert.ok(screen.getByRole('combobox', { name: 'Tiến độ' }))
  assert.ok(screen.getByText('Python cơ bản'))
  assert.ok(screen.getByText('Cấu trúc dữ liệu'))

  await user.selectOptions(screen.getByRole('combobox', { name: 'Tiến độ' }), 'complete')
  assert.ok(screen.getByText('Python cơ bản'))
  assert.equal(screen.queryByText('Cấu trúc dữ liệu'), null)
  await user.selectOptions(screen.getByRole('combobox', { name: 'Tiến độ' }), 'all')
  await user.type(search, 'khong co ket qua')
  assert.ok(await screen.findByText('Không tìm thấy khóa học'))
})

test('nested course routes keep useful breadcrumbs', async () => {
  localStorage.setItem('luminaToken', 'test-session')
  globalThis.fetch = async () => new Response(JSON.stringify({ user: { id: 10, name: 'Học viên', email: 'student@example.test', role: 'STUDENT' } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  render(h(MemoryRouter, { initialEntries: ['/courses/15?section=lessons'] }, h(SessionProvider, null, h(AppLayout, null, h(CurrentPath)))))

  await screen.findByRole('group', { name: 'Học viên, Học viên' })
  const breadcrumbs = screen.getByRole('navigation', { name: 'Đường dẫn' })
  assert.ok(within(breadcrumbs).getByRole('link', { name: 'Tổng quan' }))
  assert.ok(within(breadcrumbs).getByText('Khóa học'))
})

test('account route has no redundant overview breadcrumb and only marks account active', async () => {
  localStorage.setItem('luminaToken', 'test-session')
  globalThis.fetch = async () => new Response(JSON.stringify({ user: { id: 10, name: 'Học viên', email: 'student@example.test', role: 'STUDENT' } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  render(h(MemoryRouter, { initialEntries: ['/account'] }, h(SessionProvider, null, h(AppLayout, null, h(AccountPage)))))

  await screen.findByRole('heading', { name: 'Hồ sơ cá nhân' })
  assert.equal(screen.queryByRole('navigation', { name: 'Đường dẫn' }), null)
  assert.equal(screen.getByRole('link', { name: 'Tài khoản' }).getAttribute('aria-current'), 'page')
  assert.equal(screen.getByRole('link', { name: 'Tổng quan' }).getAttribute('aria-current'), null)
})

test('course cards use compact non-nested actions and honest student progress states', async () => {
  localStorage.setItem('luminaToken', 'test-session')
  const courses = [
    { id: 20, title: 'Khóa học chưa có bài', description: '...', instructor: { name: 'Giảng viên có tên dài để kiểm tra cách hiển thị không tràn khỏi thẻ' }, _count: { lessons: 0, enrollments: 2 }, completedLessons: 0, progressPercent: 0 },
    { id: 21, title: 'Chưa bắt đầu', description: '', instructor: { name: 'Giảng viên' }, _count: { lessons: 3, enrollments: 1 }, completedLessons: 0, progressPercent: 0 },
    { id: 22, title: 'Đang học', description: 'Mô tả khóa học.', instructor: { name: 'Giảng viên' }, _count: { lessons: 3, enrollments: 1 }, completedLessons: 1, progressPercent: 33 },
    { id: 23, title: 'Đã học xong', description: 'Đã hoàn thành.', instructor: { name: 'Giảng viên' }, _count: { lessons: 2, enrollments: 1 }, completedLessons: 2, progressPercent: 100 },
    { id: 24, title: 'Thiếu dữ liệu tiến độ', description: null, instructor: { name: 'Giảng viên' }, _count: { lessons: 4, enrollments: 1 } },
  ]
  globalThis.fetch = async (url) => {
    const payload = String(url).endsWith('/api/auth/me')
      ? { user: { id: 10, name: 'Học viên', email: 'student@example.test', role: 'STUDENT' } }
      : { courses }
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  render(h(MemoryRouter, { initialEntries: ['/dashboard'] }, h(SessionProvider, null, h(DashboardPage))))

  await screen.findByRole('heading', { name: 'Khóa học chưa có bài' })
  const cards = document.querySelectorAll('.dashboard-main .course-card')
  assert.equal(cards.length, 5)
  const noLessons = [...cards].find((card) => card.textContent.includes('Khóa học chưa có bài'))
  assert.ok(noLessons)
  assert.ok(within(noLessons).getByText('Chưa có bài học'))
  assert.ok(within(noLessons).getByText('Giảng viên chưa đăng nội dung'))
  assert.equal(within(noLessons).queryByText(/0\/0/), null)
  assert.equal(within(noLessons).getByRole('link', { name: 'Xem khóa học' }).getAttribute('href'), '/courses/20')
  assert.ok(within(noLessons).getByText('Chưa có mô tả.'))
  assert.ok(within(noLessons).queryByRole('button', { name: 'Tiếp tục học' }) === null)
  assert.ok(within(cards[1]).getByRole('button', { name: 'Bắt đầu học' }))
  assert.ok(within(cards[2]).getByRole('button', { name: 'Tiếp tục học' }))
  assert.equal(within(cards[3]).getByRole('link', { name: 'Ôn tập lại' }).getAttribute('href'), '/courses/23?section=lessons')
  assert.ok(within(cards[4]).getByText('Tiến độ chưa có dữ liệu'))
  assert.equal(within(cards[4]).getByRole('link', { name: 'Xem khóa học' }).getAttribute('href'), '/courses/24')
  for (const card of cards) assert.equal(card.querySelector('a a, a button, button a'), null)
})

test('instructor cards link to course management and keep personal progress out', async () => {
  localStorage.setItem('luminaToken', 'test-session')
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  globalThis.fetch = async (url) => {
    const payload = String(url).endsWith('/api/auth/me')
      ? { user: { id: 4, name: 'Giảng viên', email: 'teacher@example.test', role: 'INSTRUCTOR' } }
      : { courses: [{ id: 31, title: 'Khóa học giảng viên', description: '', joinCode: 'ABCD1234', _count: { lessons: 2, enrollments: 7 } }] }
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  render(h(MemoryRouter, { initialEntries: ['/dashboard'] }, h(SessionProvider, null, h(DashboardPage))))

  const title = await screen.findByRole('link', { name: 'Khóa học giảng viên' })
  const card = title.closest('article')
  assert.equal(within(card).getByRole('link', { name: 'Quản lý khóa học' }).getAttribute('href'), '/courses/31?section=overview')
  assert.ok(within(card).getByText('7 học viên đang tham gia'))
  assert.equal(within(card).queryByText(/Tiến độ|bài hoàn thành/), null)
  await userEvent.setup().click(within(card).getByRole('button', { name: 'Sao chép mã tham gia' }))
  await screen.findByText('Đã sao chép mã ABCD1234.')
})

test('admin ignores an obsolete search response after a faster newer result', async () => {
  let resolveOld
  globalThis.fetch = async (url) => {
    const query = new URL(String(url)).searchParams.get('q')
    if (query === 'old') return new Promise((resolve) => { resolveOld = resolve })
    const user = { id: query ? 2 : 1, name: query === 'new' ? 'New Learner' : 'Initial Learner', email: query === 'new' ? 'new@example.test' : 'initial@example.test', role: 'STUDENT', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', _count: { enrollments: 1, submissions: 0 } }
    return new Response(JSON.stringify({ users: [user], total: 1, totalPages: 1 }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  const user = userEvent.setup()
  render(h(AdminPage))
  await screen.findByText('initial@example.test')
  const search = screen.getByRole('searchbox')
  await user.type(search, 'old')
  await waitFor(() => assert.ok(resolveOld))
  await user.clear(search); await user.type(search, 'new')
  await screen.findByText('new@example.test')
  resolveOld(new Response(JSON.stringify({ users: [{ id: 3, name: 'Old Result', email: 'old@example.test', role: 'STUDENT', isActive: true, createdAt: '2026-01-01T00:00:00Z', _count: {} }], total: 1, totalPages: 1 }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
  await new Promise((resolve) => setTimeout(resolve, 10))
  assert.equal(screen.queryByText('old@example.test'), null)
})


test('quiz save conflict preserves selections and exposes a retry action', async () => {
  localStorage.setItem('luminaToken', 'test')
  let draftCount = 0
  let reviewedDraft
  globalThis.fetch = async (url, options = {}) => {
    const path = String(url)
    if (path.endsWith('/quizzes') && (options.method || 'GET') === 'GET') return new Response(JSON.stringify({ attempts: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    if (path.endsWith('/quizzes')) return new Response(JSON.stringify({ attemptId: 'conflict1', version: 0, questions: [{ id: 'q', prompt: 'Choose?', options: ['Option A', 'Option B'] }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    if (path.endsWith('/conflict1/draft')) {
      draftCount += 1; reviewedDraft = JSON.parse(options.body)
      if (draftCount === 1) return new Response(JSON.stringify({ error: 'Version conflict', code: 'VERSION_CONFLICT' }), { status: 409, headers: { 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify({ version: 2 }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    if (path.endsWith('/conflict1')) return new Response(JSON.stringify({ version: 1, submittedAt: null, answers: [null], questions: [{ id: 'q', prompt: 'Choose?', options: ['Option A', 'Option B'] }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    throw new Error(path)
  }
  const user = userEvent.setup()
  render(h(PracticeQuizPanel, { lesson: { id: 10, title: 'Lesson conflict' }, onClose() {} }))
  await user.click(document.querySelector('.practice-create button'))
  const choice = await screen.findByRole('radio', { name: 'Option A' })
  await user.click(choice)
  await waitFor(() => assert.ok(document.querySelector('.practice-save-status button')))
  assert.equal(choice.checked, true)
  await user.click(document.querySelector('.practice-save-status button'))
  await waitFor(() => assert.equal(draftCount, 2))
  assert.deepEqual(reviewedDraft.answers, [0])
  await waitFor(() => assert.equal(document.querySelector('.practice-save-status button'), null))
})


test('assignment deadline updates when the tab regains focus', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-05-01T10:00:00.000Z'))
  const assignment = { id: 5, title: 'Deadline', points: 10, dueAt: '2026-05-01T10:01:00.000Z', description: 'Answer', submissions: [] }
  render(h(AssignmentsPanel, { course: { id: 1, assignments: [assignment] }, isInstructor: false }))
  assert.equal(document.querySelector('.status-warning'), null)
  vi.setSystemTime(new Date('2026-05-01T10:02:00.000Z'))
  act(() => window.dispatchEvent(new Event('focus')))
  assert.ok(document.querySelector('.status-warning'))
  vi.useRealTimers()
})



test('rendered login returns to the intended course section and query', async () => {
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/api/auth/login')) return new Response(JSON.stringify({ token: 'new-token' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    if (String(url).endsWith('/api/auth/me')) return new Response(JSON.stringify({ user: { id: 7, name: 'Student', email: 'student@example.test', role: 'STUDENT' } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    throw new Error(String(url))
  }
  function Destination() { const location = useLocation(); return h('output', null, location.pathname + location.search) }
  const router = h(MemoryRouter, { initialEntries: [{ pathname: '/auth', state: { from: { pathname: '/courses/7', search: '?section=lessons&lessonId=2' } } }] }, h(Routes, null, h(Route, { path: '/auth', element: h(AuthPage) }), h(Route, { path: '/courses/:courseId', element: h(Destination) }), h(Route, { path: '/dashboard', element: h('output', null, '/dashboard') })))
  const user = userEvent.setup()
  render(h(SessionProvider, null, router))
  await user.type(document.getElementById('email'), 'student@example.test')
  await user.type(document.getElementById('password'), 'password123')
  await user.click(document.querySelector('.submit-button'))
  await waitFor(() => assert.equal(document.querySelector('output')?.textContent, '/courses/7?section=lessons&lessonId=2'))
})

test('role disclosure retains draft and focus without sending on open, close or Escape', async () => {
  const posts = []
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === 'POST') posts.push(url)
    return jsonResponse(String(url).endsWith('/me') ? { user: { id: 1, name: 'Học viên', role: 'STUDENT' } } : { courses: [learnerCourse()] })
  }
  renderDashboard()
  const trigger = await screen.findByRole('button', { name: 'Tham gia khóa học' })
  assert.equal(trigger.getAttribute('aria-expanded'), 'false')
  assert.equal(screen.queryByRole('textbox', { name: 'Mã tham gia' }), null)
  await userEvent.click(trigger)
  const input = screen.getByRole('textbox', { name: 'Mã tham gia' })
  assert.equal(document.activeElement, input)
  await userEvent.type(input, 'ab12')
  await userEvent.keyboard('{Escape}')
  assert.equal(trigger.getAttribute('aria-expanded'), 'false')
  assert.equal(document.activeElement, trigger)
  await userEvent.click(trigger)
  assert.equal(input.value.toUpperCase(), 'AB12')
  assert.equal(posts.length, 0)
})

test('join normalizes whitespace and lowercase, locks duplicates and keeps success outside closed panel', async () => {
  let resolveJoin
  const bodies = []
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).endsWith('/me')) return jsonResponse({ user: { id: 1, name: 'Học viên', role: 'STUDENT' } })
    if (options.method === 'POST') { bodies.push(JSON.parse(options.body)); return new Promise((resolve) => { resolveJoin = resolve }) }
    return jsonResponse({ courses: [learnerCourse()] })
  }
  renderDashboard()
  const trigger = await screen.findByRole('button', { name: 'Tham gia khóa học' })
  await userEvent.click(trigger)
  await userEvent.type(screen.getByLabelText('Mã tham gia'), ' abcd1234 ')
  const submit = screen.getByRole('button', { name: 'Tham gia', exact: true })
  await userEvent.dblClick(submit)
  assert.deepEqual(bodies, [{ joinCode: 'ABCD1234' }])
  resolveJoin(jsonResponse({ course: learnerCourse() }))
  await screen.findByText(/Đã tham gia/)
  assert.equal(trigger.getAttribute('aria-expanded'), 'false')
  assert.equal(screen.getAllByRole('link', { name: 'Khóa 1' }).length, 1)
  await userEvent.click(trigger)
  assert.equal(screen.getByLabelText('Mã tham gia').value, '')
})

test('failed normalized form validation never sends and server failure preserves the draft', async () => {
  let posts = 0
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).endsWith('/me')) return jsonResponse({ user: { id: 1, name: 'Học viên', role: 'STUDENT' } })
    if (options.method === 'POST') { posts += 1; return jsonResponse({ error: 'Mã không tồn tại' }, 404) }
    return jsonResponse({ courses: [] })
  }
  renderDashboard()
  await userEvent.click(await screen.findByRole('button', { name: 'Tham gia khóa học' }))
  const input = screen.getByLabelText('Mã tham gia')
  await userEvent.type(input, 'XXXXXXXX')
  await userEvent.click(screen.getByRole('button', { name: 'Tham gia', exact: true }))
  assert.equal(posts, 0)
  await userEvent.clear(input); await userEvent.type(input, 'ABCD1234')
  await userEvent.click(screen.getByRole('button', { name: 'Tham gia', exact: true }))
  await screen.findByText('Mã không tồn tại')
  assert.equal(input.value, 'ABCD1234')
  assert.equal(posts, 1)
})

test('latest continue-learning intent wins and selects first incomplete lesson', async () => {
  const details = {}
  globalThis.fetch = async (url) => {
    const path = new URL(String(url)).pathname
    if (path.endsWith('/me')) return jsonResponse({ user: { id: 1, name: 'Học viên', role: 'STUDENT' } })
    if (/courses\/[12]$/.test(path)) return new Promise((resolve) => { details[path.at(-1)] = resolve })
    return jsonResponse({ courses: [learnerCourse(1), learnerCourse(2)] })
  }
  renderDashboard()
  const buttons = await screen.findAllByRole('button', { name: 'Tiếp tục học', exact: true })
  await userEvent.click(buttons[0]); await userEvent.click(buttons[1])
  details['2'](jsonResponse({ course: { lessons: [{ id: 20, isCompleted: true }, { id: 21, isCompleted: false }] } }))
  await waitFor(() => assert.match(screen.getByTestId('current-path').textContent, /courses\/2.*lessonId=21/))
  details['1'](jsonResponse({ course: { lessons: [{ id: 11, isCompleted: false }] } }))
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
  assert.match(screen.getByTestId('current-path').textContent, /courses\/2.*lessonId=21/)
})

test('initial course read superseded by a failed write can recover and ignores its late response', async () => {
  let resolveFirst
  let reads = 0
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).endsWith('/me')) return jsonResponse({ user: { id: 1, name: 'Học viên', role: 'STUDENT' } })
    if (options.method === 'POST') return jsonResponse({ error: 'Không tham gia được' }, 503)
    reads += 1
    if (reads === 1) return new Promise((resolve) => { resolveFirst = resolve })
    return jsonResponse({ courses: [learnerCourse(2)] })
  }
  renderDashboard()
  await userEvent.click(await screen.findByRole('button', { name: 'Tham gia khóa học' }))
  await userEvent.type(screen.getByLabelText('Mã tham gia'), 'ABCD1234')
  await userEvent.click(screen.getByRole('button', { name: 'Tham gia', exact: true }))
  await screen.findByText('Không tham gia được')
  await screen.findByRole('link', { name: 'Khóa 2' })
  resolveFirst(jsonResponse({ courses: [learnerCourse(1)] }))
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
  assert.equal(screen.queryByRole('link', { name: 'Khóa 1' }), null)
})

test('admin initial error has no confirmed zero total and exposes read retry', async () => {
  globalThis.fetch = async () => jsonResponse({ error: 'Mất kết nối dữ liệu' }, 503)
  render(h(AdminPage))
  await screen.findByText('Mất kết nối dữ liệu')
  assert.equal(screen.queryByText('0 tài khoản'), null)
  assert.ok(screen.getByRole('button', { name: 'Thử lại' }))
})

test('admin toggle preserves unsaved profile and locks the whole row during write', async () => {
  dialogTestSupport()
  let resolveWrite
  const requests = []
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === 'PATCH') { requests.push(JSON.parse(options.body)); return new Promise((resolve) => { resolveWrite = resolve }) }
    return jsonResponse({ users: [adminRecord()], total: 1, totalPages: 1 })
  }
  render(h(AdminPage))
  await screen.findByText('learner1@example.test')
  const name = screen.getByLabelText('Họ tên')
  await userEvent.clear(name); await userEvent.type(name, 'Bản chỉnh chưa lưu')
  await userEvent.click(screen.getByRole('button', { name: 'Khóa tài khoản' }))
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Khóa tài khoản' }))
  assert.equal(name.disabled, true)
  assert.equal(screen.getByRole('button', { name: 'Lưu thay đổi' }).disabled, true)
  assert.deepEqual(requests, [{ isActive: false }])
  resolveWrite(jsonResponse({ user: { ...adminRecord(), isActive: false } }))
  await screen.findByText('Đã khóa tài khoản và thu hồi các phiên đăng nhập.')
  assert.equal(name.value, 'Bản chỉnh chưa lưu')
})

test('admin role conflict preserves draft and cancel never patches', async () => {
  dialogTestSupport()
  let writes = 0
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === 'PATCH') { writes += 1; return jsonResponse({ error: 'Còn tham gia khóa học' }, 409) }
    return jsonResponse({ users: [adminRecord()], total: 1, totalPages: 1 })
  }
  render(h(AdminPage))
  await screen.findByText('learner1@example.test')
  await userEvent.selectOptions(screen.getByLabelText('Vai trò'), 'INSTRUCTOR')
  await userEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await userEvent.click(screen.getByRole('button', { name: 'Hủy' }))
  assert.equal(writes, 0)
  await userEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Đổi vai trò' }))
  await screen.findByText(/Còn tham gia khóa học/)
  assert.equal(screen.getByLabelText('Vai trò').value, 'INSTRUCTOR')
  assert.ok(screen.getByText(/khóa học đã tham gia/))
})

test('actual route guards deny admin course UI and students admin UI', async () => {
  localStorage.setItem('luminaToken', 'test-session')
  window.history.replaceState({}, '', '/courses/1')
  globalThis.fetch = async () => jsonResponse({ user: { id: 1, name: 'Quản trị', role: 'ADMIN' } })
  const view = render(h(App))
  await screen.findByRole('heading', { name: 'Không có quyền truy cập' })
  assert.equal(screen.getByRole('link', { name: 'Về trang phù hợp' }).getAttribute('href'), '/admin')
  view.unmount()
  window.history.replaceState({}, '', '/admin')
  globalThis.fetch = async () => jsonResponse({ user: { id: 2, name: 'Học viên', role: 'STUDENT' } })
  render(h(App))
  await screen.findByRole('heading', { name: 'Không có quyền truy cập' })
  assert.equal(screen.getByRole('link', { name: 'Về trang phù hợp' }).getAttribute('href'), '/dashboard')
  window.history.replaceState({}, '', '/')
})

test('instructor search and sort preserve owned course actions and clipboard denial exposes real code', async () => {
  const courses = [
    { ...learnerCourse(1), title: 'Zeta', joinCode: 'ABCDEF12', updatedAt: '2026-10-01' },
    { ...learnerCourse(2), title: 'Alpha', joinCode: '1234ABCD', updatedAt: '2026-09-01' },
  ]
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
  globalThis.fetch = async (url) => jsonResponse(String(url).endsWith('/me') ? { user: { id: 4, role: 'INSTRUCTOR', name: 'Giảng viên' } } : { courses })
  renderDashboard()
  await screen.findByRole('link', { name: 'Zeta' })
  await userEvent.selectOptions(screen.getByLabelText('Sắp xếp'), 'name')
  assert.equal(document.querySelector('.course-card h3').textContent, 'Alpha')
  await userEvent.type(screen.getByRole('searchbox'), 'zEtA')
  assert.equal(screen.queryByRole('link', { name: 'Alpha' }), null)
  await userEvent.click(screen.getByRole('button', { name: 'Sao chép mã tham gia' }))
  await screen.findByText('Không thể sao chép tự động. Mã tham gia: ABCDEF12')
  assert.equal(screen.queryByText(/Đã sao chép/), null)
  assert.equal(screen.getByRole('link', { name: 'Quản lý khóa học' }).getAttribute('href'), '/courses/1?section=overview')
})

test('create validates normalized title and description boundaries without native raw length clipping', async () => {
  const writes = []
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).endsWith('/me')) return jsonResponse({ user: { id: 4, role: 'INSTRUCTOR', name: 'Giảng viên' } })
    if (options.method === 'POST') { writes.push(JSON.parse(options.body)); return jsonResponse({ error: 'Chưa thể tạo khóa' }, 503) }
    return jsonResponse({ courses: [] })
  }
  renderDashboard()
  const trigger = await screen.findByRole('button', { name: 'Tạo khóa học' })
  await userEvent.click(trigger)
  const panel = screen.getByRole('region', { name: 'Tạo khóa học' })
  const title = screen.getByLabelText('Tên khóa học')
  const description = screen.getByLabelText('Mô tả')
  const send = within(panel).getByRole('button', { name: 'Tạo khóa học' })
  for (const value of [' ab ', 'x'.repeat(121)]) {
    fireEvent.change(title, { target: { value } }); await userEvent.click(send)
    assert.equal(writes.length, 0)
    assert.ok(screen.getByText('Tên khóa học cần từ 3 đến 120 ký tự.'))
  }
  fireEvent.change(title, { target: { value: ' abc ' } })
  fireEvent.change(description, { target: { value: 'x'.repeat(4001) } })
  await userEvent.click(send)
  assert.equal(writes.length, 0)
  fireEvent.change(description, { target: { value: ' ' + 'x'.repeat(4000) + ' ' } })
  await userEvent.click(send)
  await screen.findByText('Chưa thể tạo khóa')
  assert.deepEqual(writes[0], { title: 'abc', description: 'x'.repeat(4000) })
  fireEvent.change(title, { target: { value: ' ' + 'x'.repeat(120) + ' ' } })
  await userEvent.click(send)
  await waitFor(() => assert.equal(writes.length, 2))
  assert.equal(writes[1].title.length, 120)
  assert.equal(title.value.length, 122)
})

test('closed pending disclosure keeps focus outside and failure offers reopening with draft', async () => {
  let resolveWrite
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).endsWith('/me')) return jsonResponse({ user: { id: 1, role: 'STUDENT', name: 'Học viên' } })
    if (options.method === 'POST') return new Promise((resolve) => { resolveWrite = resolve })
    return jsonResponse({ courses: [learnerCourse()] })
  }
  renderDashboard()
  const trigger = await screen.findByRole('button', { name: 'Tham gia khóa học' })
  await userEvent.click(trigger)
  await userEvent.type(screen.getByLabelText('Mã tham gia'), 'abcdef12')
  await userEvent.click(screen.getByRole('button', { name: 'Tham gia', exact: true }))
  await userEvent.click(screen.getByRole('button', { name: 'Thu gọn biểu mẫu' }))
  const search = screen.getByRole('searchbox')
  search.focus()
  await act(async () => resolveWrite(jsonResponse({ error: 'Mạng gián đoạn' }, 503)))
  await screen.findByText('Mạng gián đoạn')
  assert.equal(document.activeElement, search)
  await userEvent.click(screen.getByRole('button', { name: 'Mở lại biểu mẫu' }))
  assert.equal(screen.getByLabelText('Mã tham gia').value, 'abcdef12')
  assert.equal(document.activeElement, screen.getByLabelText('Mã tham gia'))
})

test('continue error retries same course and all-complete detail falls back to lessons', async () => {
  let detailReads = 0
  globalThis.fetch = async (url) => {
    const path = String(url)
    if (path.endsWith('/me')) return jsonResponse({ user: { id: 1, role: 'STUDENT', name: 'Học viên' } })
    if (path.endsWith('/courses/1')) {
      detailReads += 1
      return detailReads === 1 ? jsonResponse({ error: 'Không đọc được khóa' }, 403) : jsonResponse({ course: { lessons: [{ id: 4, isCompleted: true }] } })
    }
    return jsonResponse({ courses: [learnerCourse()] })
  }
  renderDashboard()
  await userEvent.click(await screen.findByRole('button', { name: 'Tiếp tục học' }))
  await screen.findByText('Không đọc được khóa')
  assert.equal(screen.getByTestId('current-path').textContent, '/dashboard')
  await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  await waitFor(() => assert.equal(screen.getByTestId('current-path').textContent, '/courses/1?section=lessons'))
  assert.equal(detailReads, 2)
})

test('unmounted dashboard ignores late detail and pending same-course activation is serialized', async () => {
  let resolveDetail
  let reads = 0
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/me')) return jsonResponse({ user: { id: 1, role: 'STUDENT', name: 'Học viên' } })
    if (String(url).endsWith('/courses/1')) { reads += 1; return new Promise((resolve) => { resolveDetail = resolve }) }
    return jsonResponse({ courses: [learnerCourse()] })
  }
  const view = renderDashboard()
  const button = await screen.findByRole('button', { name: 'Tiếp tục học' })
  await userEvent.dblClick(button)
  assert.equal(reads, 1)
  assert.equal(button.disabled, true)
  view.unmount()
  await act(async () => resolveDetail(jsonResponse({ course: { lessons: [{ id: 8, isCompleted: false }] } })))
  assert.equal(document.querySelector('[data-testid="current-path"]'), null)
})

test('admin successful write plus refresh error retains confirmed record and retry never repeats PATCH', async () => {
  let reads = 0, writes = 0
  let saved = adminRecord()
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === 'PATCH') { writes += 1; saved = { ...saved, ...JSON.parse(options.body) }; return jsonResponse({ user: { id: saved.id, name: saved.name, role: saved.role, email: saved.email, isActive: saved.isActive } }) }
    reads += 1
    return reads === 2 ? jsonResponse({ error: 'Refresh unavailable' }, 503) : jsonResponse({ users: [saved], total: 1, totalPages: 1 })
  }
  render(h(AdminPage))
  await screen.findByText('learner1@example.test')
  fireEvent.change(screen.getByLabelText('Họ tên'), { target: { value: '  Tên mới  ' } })
  await userEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await screen.findByText(/Refresh unavailable/)
  assert.ok(screen.getByText('Đã cập nhật tài khoản learner1@example.test.'))
  assert.equal(screen.getByLabelText('Họ tên').value, 'Tên mới')
  assert.ok(screen.getByText(/Tham gia/))
  assert.ok(screen.getByText(/khóa học đã tham gia/))
  await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  await waitFor(() => assert.equal(reads, 3))
  assert.equal(writes, 1)
  assert.ok(screen.getByText('Đã cập nhật tài khoản learner1@example.test.'))
})

test('admin rename on last page clamps and fetches authoritative remaining page', async () => {
  let renamed = false
  const paths = []
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === 'PATCH') { renamed = true; return jsonResponse({ user: { ...adminRecord(2), name: 'Tên ngoài query' } }) }
    const query = new URL(String(url)).searchParams
    paths.push(query.get('q') + ':' + query.get('page'))
    const secondPage = query.get('page') === '2'
    return jsonResponse({ users: renamed && secondPage ? [] : [adminRecord(secondPage ? 2 : 1)], total: renamed ? 25 : 26, totalPages: renamed ? 1 : 2 })
  }
  render(h(AdminPage))
  await screen.findByText('learner1@example.test')
  await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
  await screen.findByText('learner2@example.test')
  fireEvent.change(screen.getByLabelText('Họ tên'), { target: { value: 'Tên ngoài query' } })
  await userEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await screen.findByText('learner1@example.test')
  assert.ok(screen.getByText('25 tài khoản'))
  assert.deepEqual(paths.slice(-2), [':2', ':1'])
  assert.equal(screen.queryByText('Chưa có tài khoản'), null)
})

test('admin delayed write reconciles current normalized query and preserves another dirty row', async () => {
  let resolveWrite
  const queries = []
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === 'PATCH') return new Promise((resolve) => { resolveWrite = resolve })
    const query = new URL(String(url)).searchParams.get('q'); queries.push(query)
    return jsonResponse({ users: query ? [adminRecord(2)] : [adminRecord(), adminRecord(2)], total: query ? 1 : 2, totalPages: 1 })
  }
  render(h(AdminPage))
  await screen.findByText('learner1@example.test')
  const names = screen.getAllByLabelText('Họ tên')
  fireEvent.change(names[1], { target: { value: 'Draft thứ hai' } })
  fireEvent.change(names[0], { target: { value: 'Đổi tên thứ nhất' } })
  await userEvent.click(screen.getAllByRole('button', { name: 'Lưu thay đổi' })[0])
  const query = 'x'.repeat(120)
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: ' ' + query + ' ignored ' } })
  await waitFor(() => assert.equal(queries.at(-1), query))
  await act(async () => resolveWrite(jsonResponse({ user: { ...adminRecord(), name: 'Đổi tên thứ nhất' } })))
  await waitFor(() => assert.equal(queries.filter((item) => item === query).length, 2))
  assert.equal(screen.getByLabelText('Họ tên').value, 'Draft thứ hai')
  assert.equal(screen.queryByText('learner1@example.test'), null)
})

test('admin stale pre-write GET cannot undo confirmed active state; name invalid disables save', async () => {
  dialogTestSupport()
  let resolveOld, reads = 0, active = true
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === 'PATCH') { active = false; return jsonResponse({ user: { ...adminRecord(), isActive: false } }) }
    reads += 1
    if (reads === 2) return new Promise((resolve) => { resolveOld = resolve })
    return jsonResponse({ users: [{ ...adminRecord(), isActive: active }], total: 1, totalPages: 1 })
  }
  render(h(AdminPage))
  await screen.findByText('learner1@example.test')
  fireEvent.change(screen.getByLabelText('Họ tên'), { target: { value: ' a ' } })
  assert.equal(screen.getByRole('button', { name: 'Lưu thay đổi' }).disabled, true)
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'learner' } })
  await waitFor(() => assert.ok(resolveOld))
  await userEvent.click(screen.getByRole('button', { name: 'Khóa tài khoản' }))
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Khóa tài khoản' }))
  await screen.findByText('Đã khóa')
  await act(async () => resolveOld(jsonResponse({ users: [adminRecord()], total: 1, totalPages: 1 })))
  assert.ok(screen.getByText('Đã khóa'))
  assert.equal(screen.getByLabelText('Họ tên').value, ' a ')
})

test('route marker is removed when leaving dashboard for account or course and admin has no self breadcrumb', async () => {
  localStorage.setItem('luminaToken', 'test-session')
  globalThis.fetch = async () => jsonResponse({ user: { id: 1, role: 'ADMIN', name: 'Admin', email: 'admin@example.test' } })
  render(h(MemoryRouter, { initialEntries: ['/admin'] }, h(SessionProvider, null, h(AppLayout, null,
    h(Link, { to: '/account' }, 'Go account'), h(Link, { to: '/courses/1' }, 'Go course')))))
  await screen.findByText('Quản trị viên')
  assert.ok(document.querySelector('.role-dashboard-shell'))
  assert.equal(screen.queryByRole('navigation', { name: 'Đường dẫn' }), null)
  await userEvent.click(screen.getByRole('link', { name: 'Go account' }))
  assert.equal(document.querySelector('.role-dashboard-shell'), null)
  await userEvent.click(screen.getByRole('link', { name: 'Go course' }))
  assert.equal(document.querySelector('.role-dashboard-shell'), null)
  assert.ok(screen.getByRole('navigation', { name: 'Đường dẫn' }))
})

test('successful join before first list snapshot never presents partial totals and ignores older GET', async () => {
  const reads = []
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).endsWith('/me')) return jsonResponse({ user: { id: 1, role: 'STUDENT', name: 'Học viên' } })
    if (options.method === 'POST') return jsonResponse({ course: learnerCourse(2) })
    return new Promise((resolve) => reads.push(resolve))
  }
  renderDashboard()
  await waitFor(() => assert.equal(reads.length, 1))
  await userEvent.click(screen.getByRole('button', { name: 'Tham gia khóa học' }))
  fireEvent.change(screen.getByLabelText('Mã tham gia'), { target: { value: 'ABCD1234' } })
  await userEvent.click(screen.getByRole('button', { name: 'Tham gia', exact: true }))
  await screen.findByText(/Đã tham gia “Khóa 2”/)
  assert.equal(screen.queryByRole('region', { name: 'Tổng quan khóa học' }), null)
  assert.equal(screen.queryByRole('link', { name: 'Khóa 2' }), null)
  assert.equal(reads.length, 2)
  await act(async () => reads[1](jsonResponse({ courses: [learnerCourse(1), learnerCourse(2)] })))
  await screen.findByRole('link', { name: 'Khóa 2' })
  await act(async () => reads[0](jsonResponse({ courses: [learnerCourse(1)] })))
  assert.equal(screen.getAllByRole('link', { name: 'Khóa 2' }).length, 1)
  assert.ok(screen.getByRole('region', { name: 'Tổng quan khóa học' }))
})

test('successful pending submit returns lost panel focus but never steals explicitly moved focus', async () => {
  let resolveWrite
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).endsWith('/me')) return jsonResponse({ user: { id: 1, role: 'STUDENT', name: 'Học viên' } })
    if (options.method === 'POST') return new Promise((resolve) => { resolveWrite = resolve })
    return jsonResponse({ courses: [learnerCourse()] })
  }
  renderDashboard()
  const trigger = await screen.findByRole('button', { name: 'Tham gia khóa học' })
  for (const moveOutside of [false, true]) {
    await userEvent.click(trigger)
    fireEvent.change(screen.getByLabelText('Mã tham gia'), { target: { value: 'ABCD1234' } })
    await userEvent.click(screen.getByRole('button', { name: 'Tham gia', exact: true }))
    if (moveOutside) screen.getByRole('searchbox').focus()
    else document.activeElement.blur() // Native browser blurs disabled submit to body.
    await act(async () => resolveWrite(jsonResponse({ course: learnerCourse() })))
    await waitFor(() => assert.equal(trigger.getAttribute('aria-expanded'), 'false'))
    assert.equal(document.activeElement, moveOutside ? screen.getByRole('searchbox') : trigger)
  }
})

test('two independent admin writes cannot be undone by an intermediate refresh', async () => {
  dialogTestSupport()
  const patches = [], intermediate = []
  let records = [adminRecord(1), adminRecord(2)]
  let readCount = 0
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === 'PATCH') return new Promise((resolve) => patches.push({ resolve, id: Number(String(url).split('/').at(-1)) }))
    readCount += 1
    if (readCount === 2) return new Promise((resolve) => intermediate.push(resolve))
    return jsonResponse({ users: records, total: 2, totalPages: 1 })
  }
  render(h(AdminPage))
  await screen.findByText('learner1@example.test')
  for (const id of [1, 2]) {
    const row = screen.getByText('learner' + id + '@example.test').closest('article')
    assert.equal(within(row).getByRole('button', { name: 'Khóa tài khoản' }).disabled, false)
    await userEvent.click(within(row).getByRole('button', { name: 'Khóa tài khoản' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Khóa tài khoản' }))
  }
  assert.equal(patches.length, 2)
  records = [{ ...records[0], isActive: false }, records[1]]
  await act(async () => patches[0].resolve(jsonResponse({ user: records[0] })))
  await waitFor(() => assert.equal(intermediate.length, 1))
  const old = [...records]
  records = [records[0], { ...records[1], isActive: false }]
  await act(async () => patches[1].resolve(jsonResponse({ user: records[1] })))
  await waitFor(() => assert.equal(screen.getAllByText('Đã khóa').length, 2))
  await act(async () => intermediate[0](jsonResponse({ users: old, total: 2, totalPages: 1 })))
  assert.equal(screen.getAllByText('Đã khóa').length, 2)
})
