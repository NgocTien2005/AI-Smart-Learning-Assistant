import { test, vi, assert, React, act, fireEvent, render, screen, waitFor, within, userEvent, SessionProvider, MemoryRouter, Route, Routes, Link, useParams, CourseWorkspacePage, useLocation, LessonSummaryPanel, h, jsonResponse, learnerCourse, renderDashboard, dialogTestSupport, workspaceLesson, workspaceCourse, workspaceFetch, renderWorkspace } from './fixtures.js'

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
  await user.click(screen.getByRole('button', { name: 'Lưu bài học' }))
  await screen.findByText('Đã thêm bài học.')
  assert.equal(lessonPosts.length, 1)
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

test('workspace filter keeps reader, stable global ordinal and selected semantics', async () => {
  workspaceFetch()
  renderWorkspace()
  await screen.findByRole('heading', { name: 'Bài 1' })
  const first = screen.getByRole('button', { name: /01 Bài 1/ })
  assert.equal(first.getAttribute('aria-current'), 'true')
  fireEvent.change(screen.getByLabelText('Tìm bài học'), { target: { value: 'BÀI 2' } })
  assert.ok(screen.getByRole('button', { name: /02 Bài 2/ }))
  assert.ok(screen.getByText(/Bài đang đọc nằm ngoài bộ lọc/))
  assert.ok(screen.getByRole('heading', { name: 'Bài 1' }))
  assert.equal(screen.getByTestId('current-path').textContent, '/courses/4?section=lessons&lessonId=1')
  await userEvent.click(screen.getByRole('button', { name: 'Bài tiếp →' }))
  await screen.findByRole('heading', { name: 'Bài 2' })
})

test('workspace distinguishes invalid lesson link, no selection and no matching lessons', async () => {
  workspaceFetch()
  const view = renderWorkspace('/courses/4?section=lessons&lessonId=999&panel=summary')
  await screen.findByText('Không tìm thấy bài học đã chọn')
  assert.equal(screen.queryByRole('heading', { name: 'Bài 1' }), null)
  view.unmount()
  renderWorkspace('/courses/4?section=lessons')
  await screen.findByText('Chọn một bài học')
  fireEvent.change(screen.getByLabelText('Tìm bài học'), { target: { value: 'không khớp' } })
  assert.ok(screen.getByText('Không có bài học phù hợp'))
})

test('lesson disclosure defaults closed and retains draft and File across collapse and section navigation', async () => {
  workspaceFetch('INSTRUCTOR')
  renderWorkspace()
  const trigger = await screen.findByRole('button', { name: 'Thêm bài học' })
  assert.equal(trigger.getAttribute('aria-expanded'), 'false')
  assert.equal(screen.getByLabelText('Tiêu đề').closest('section').hidden, true)
  await userEvent.click(trigger)
  const title = screen.getByLabelText('Tiêu đề')
  assert.equal(document.activeElement, title)
  await userEvent.type(title, 'Bài mới')
  const file = new File(['Nội dung thử'], 'noi-dung.txt', { type: 'text/plain' })
  await userEvent.upload(screen.getByLabelText('Tài liệu'), file)
  await userEvent.keyboard('{Escape}')
  assert.equal(document.activeElement, trigger)
  await userEvent.click(trigger)
  assert.equal(screen.getByLabelText('Tiêu đề').value, 'Bài mới')
  assert.ok(screen.getByText('noi-dung.txt'))
  await userEvent.click(screen.getByRole('link', { name: 'Tổng quan' }))
  await userEvent.click(screen.getByRole('link', { name: 'Bài học' }))
  await userEvent.click(screen.getByRole('button', { name: 'Thêm bài học' }))
  assert.ok(screen.getByText('noi-dung.txt'))
  assert.equal(screen.getByLabelText('Tiêu đề').value, 'Bài mới')
})

test('lesson create validates normalized bounds and retains multipart File after server failure', async () => {
  const writes = []
  workspaceFetch('INSTRUCTOR', (url, options) => {
    if (options.method === 'POST') { writes.push(options.body); return jsonResponse({ error: 'Upload chưa thành công' }, 503) }
  })
  renderWorkspace()
  await userEvent.click(await screen.findByRole('button', { name: 'Thêm bài học' }))
  const form = screen.getByRole('region', { name: 'Thêm bài học' })
  const send = within(form).getByRole('button', { name: 'Lưu bài học' })
  const title = screen.getByLabelText('Tiêu đề'), order = screen.getByLabelText('Thứ tự'), content = screen.getByLabelText('Nội dung')
  fireEvent.change(title, { target: { value: ' a ' } })
  await userEvent.click(send)
  assert.equal(writes.length, 0)
  fireEvent.change(title, { target: { value: ' ab ' } })
  for (const value of ['-1', '0.5', '10001']) {
    fireEvent.change(order, { target: { value } }); await userEvent.click(send); assert.equal(writes.length, 0)
  }
  fireEvent.change(order, { target: { value: '10000' } })
  fireEvent.change(content, { target: { value: 'x'.repeat(100001) } })
  await userEvent.click(send); assert.equal(writes.length, 0)
  fireEvent.change(content, { target: { value: ' ' + 'x'.repeat(100000) + ' ' } })
  const file = new File(['Văn bản'], 'draft.txt', { type: 'text/plain' })
  await userEvent.upload(screen.getByLabelText('Tài liệu'), file)
  await userEvent.click(send)
  await screen.findByText('Upload chưa thành công')
  assert.equal(writes[0].get('title'), 'ab')
  assert.equal(writes[0].get('content').length, 100000)
  assert.equal(writes[0].get('document').name, 'draft.txt')
  assert.ok(screen.getByText('draft.txt'))
  fireEvent.change(title, { target: { value: 'x'.repeat(161) } }); await userEvent.click(send)
  assert.equal(writes.length, 1)
})

test('lesson pending create serializes, closes safely and clears File only on confirmed success', async () => {
  let resolveWrite, writes = 0
  workspaceFetch('INSTRUCTOR', (url, options) => {
    if (options.method === 'POST') { writes += 1; return new Promise((resolve) => { resolveWrite = resolve }) }
  })
  renderWorkspace()
  const trigger = await screen.findByRole('button', { name: 'Thêm bài học' })
  await userEvent.click(trigger)
  fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Bài tạo mới' } })
  await userEvent.upload(screen.getByLabelText('Tài liệu'), new File(['source'], 'source.txt', { type: 'text/plain' }))
  await userEvent.dblClick(screen.getByRole('button', { name: 'Lưu bài học' }))
  assert.equal(writes, 1)
  assert.equal(screen.getByLabelText('Tiêu đề').disabled, true)
  assert.equal(screen.getByLabelText('Tài liệu').disabled, true)
  await userEvent.click(screen.getByRole('button', { name: 'Thu gọn biểu mẫu' }))
  const search = screen.getByLabelText('Tìm bài học'); search.focus()
  await act(async () => resolveWrite(jsonResponse({ lesson: workspaceLesson(4, { title: 'Bài tạo mới' }) }, 201)))
  await screen.findByText('Đã thêm bài học.')
  assert.equal(document.activeElement, search)
  assert.equal(trigger.getAttribute('aria-expanded'), 'false')
  assert.equal(screen.getAllByRole('button', { name: /Bài tạo mới/ }).length, 1)
  await userEvent.click(trigger)
  assert.equal(screen.getByLabelText('Tiêu đề').value, '')
  assert.equal(screen.queryByText('source.txt'), null)
})

test('workspace progress locks duplicates and late response updates only its original lesson', async () => {
  let resolveWrite, writes = 0
  workspaceFetch('STUDENT', (url, options) => {
    if (url.endsWith('/lessons/1/progress')) { writes += 1; assert.equal(options.method, 'PUT'); return new Promise((resolve) => { resolveWrite = resolve }) }
  })
  renderWorkspace()
  await userEvent.dblClick(await screen.findByRole('button', { name: 'Đánh dấu hoàn thành' }))
  assert.equal(writes, 1)
  await userEvent.click(screen.getByRole('button', { name: 'Bài tiếp →' }))
  await screen.findByRole('heading', { name: 'Bài 2' })
  await act(async () => resolveWrite(jsonResponse({ isCompleted: true, completedAt: '2026-10-31' })))
  assert.ok(screen.getByRole('heading', { name: 'Bài 2' }))
  assert.ok(within(screen.getByRole('button', { name: /01.*Bài 1/ })).getByText('Đã hoàn thành'))
})

test('workspace new controls preserve quiz leave failure stay and discard flow', async () => {
  dialogTestSupport()
  workspaceFetch('STUDENT', (url, options) => {
    if (url.endsWith('/quizzes') && !options.method) return jsonResponse({ attempts: [] })
    if (url.endsWith('/quizzes')) return jsonResponse({ attemptId: 'leave-test', version: 0, questions: [{ id: 'q1', prompt: 'Câu hỏi thử', options: ['Đáp án A', 'Đáp án B'] }] })
    if (url.endsWith('/leave-test/draft')) return jsonResponse({ error: 'Không lưu được draft' }, 503)
    if (url.endsWith('/leave-test')) return jsonResponse({ version: 0, submittedAt: null, answers: [null], questions: [{ id: 'q1', prompt: 'Câu hỏi thử', options: ['Đáp án A', 'Đáp án B'] }] })
  })
  renderWorkspace('/courses/4?section=lessons&lessonId=1&panel=quiz')
  await userEvent.click(await screen.findByRole('button', { name: 'Tạo bài ôn mới' }))
  await userEvent.click(document.querySelector('.practice-create button'))
  const choice = await screen.findByRole('radio', { name: 'Đáp án A' })
  await userEvent.click(choice)
  await userEvent.click(screen.getByRole('button', { name: 'Bài tiếp →' }))
  await screen.findByRole('dialog')
  assert.ok(screen.getByTestId('current-path').textContent.includes('lessonId=1'))
  await userEvent.click(screen.getByRole('button', { name: 'Hủy' }))
  assert.equal(choice.checked, true)
  await userEvent.click(screen.getByRole('button', { name: 'Bài tiếp →' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Rời trang và bỏ thay đổi' }))
  await screen.findByRole('heading', { name: 'Bài 2' })
  assert.equal(screen.getByTestId('current-path').textContent, '/courses/4?section=lessons&lessonId=2')
})

test('workspace scope marker applies only to lesson section body and instructor management uses existing section', async () => {
  workspaceFetch('INSTRUCTOR')
  renderWorkspace()
  await screen.findByRole('heading', { name: 'Bài 1' })
  assert.ok(document.querySelector('.course-workspace--lessons'))
  await userEvent.click(screen.getByRole('button', { name: 'Quản lý bài học' }))
  await screen.findByRole('heading', { name: 'Thông tin khóa học' })
  assert.equal(document.querySelector('.course-workspace--lessons'), null)
  assert.ok(document.querySelector('.course-workspace'))
})

test('workspace missing progress is labelled without confirmed zero or enabled mutation', async () => {
  const course = workspaceCourse(); delete course.lessons[0].isCompleted
  workspaceFetch('STUDENT', undefined, course)
  renderWorkspace()
  await screen.findByRole('heading', { name: 'Bài 1' })
  assert.ok(screen.getByText('Chưa có dữ liệu tiến độ'))
  assert.ok(screen.getByText('Tiến độ chưa có dữ liệu.'))
  assert.equal(screen.queryByRole('progressbar'), null)
  assert.equal(screen.getByRole('button', { name: 'Đánh dấu hoàn thành' }).disabled, true)
})

test('workspace preview ignores a previous lesson document arriving after current preview', async () => {
  let resolveOld
  const course = workspaceCourse()
  course.lessons[0].documentName = 'old.txt'; course.lessons[1].documentName = 'new.txt'
  workspaceFetch('STUDENT', (url) => {
    if (url.endsWith('/lessons/1/document')) return new Promise((resolve) => { resolveOld = resolve })
    if (url.endsWith('/lessons/2/document')) return new Response('Nội dung tài liệu mới', { status: 200, headers: { 'Content-Type': 'text/plain' } })
  }, course)
  renderWorkspace()
  await userEvent.click(await screen.findByRole('button', { name: 'Xem tài liệu' }))
  await waitFor(() => assert.ok(resolveOld))
  await userEvent.click(screen.getByRole('button', { name: 'Bài tiếp →' }))
  await userEvent.click(screen.getByRole('button', { name: 'Xem tài liệu' }))
  await screen.findByText('Nội dung tài liệu mới')
  await act(async () => resolveOld(new Response('Nội dung tài liệu cũ', { status: 200 })))
  assert.equal(screen.queryByText('Nội dung tài liệu cũ'), null)
})
