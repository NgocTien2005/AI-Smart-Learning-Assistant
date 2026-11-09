import { test, assert, render, screen, waitFor, within, userEvent, SessionProvider, MemoryRouter, Route, Routes, AppLayout, AuthPage, useLocation, resolvePostLoginDestination, App, h, jsonResponse, SessionStatus, CurrentPath } from './fixtures.js'

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

test('nested course routes keep useful breadcrumbs', async () => {
  localStorage.setItem('luminaToken', 'test-session')
  globalThis.fetch = async () => new Response(JSON.stringify({ user: { id: 10, name: 'Học viên', email: 'student@example.test', role: 'STUDENT' } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  render(h(MemoryRouter, { initialEntries: ['/courses/15?section=lessons'] }, h(SessionProvider, null, h(AppLayout, null, h(CurrentPath)))))

  await screen.findByRole('group', { name: 'Học viên, Học viên' })
  const breadcrumbs = screen.getByRole('navigation', { name: 'Đường dẫn' })
  assert.ok(within(breadcrumbs).getByRole('link', { name: 'Tổng quan' }))
  assert.ok(within(breadcrumbs).getByText('Khóa học'))
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
