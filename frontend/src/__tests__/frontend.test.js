import { afterEach, test, vi } from 'vitest'
import assert from 'node:assert/strict'
import React from 'react'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
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

const nativeFetch = globalThis.fetch
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); globalThis.fetch = nativeFetch; vi.useRealTimers() })
const h = React.createElement
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

function CurrentPath() { return h('span', { 'data-testid': 'current-path' }, useLocation().pathname) }

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
