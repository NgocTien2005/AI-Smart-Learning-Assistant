import { test, vi, assert, act, fireEvent, render, screen, waitFor, within, userEvent, SessionProvider, MemoryRouter, Route, Routes, Link, AppLayout, DashboardPage, fixtureRequestUrl, h, jsonResponse, learnerCourse, renderDashboard } from './fixtures.js'

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
    const path = fixtureRequestUrl(url).pathname
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
