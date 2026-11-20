import { test, vi, assert, act, fireEvent, render, screen, waitFor, within, userEvent, SessionProvider, MemoryRouter, Route, Routes, CourseWorkspacePage, LessonSummaryPanel, DocumentAssistantPanel, h, dialogTestSupport, CurrentPath, workspaceFetch, renderWorkspace, quizDraft, quizHistory, showQuiz, studyJson, studyMessage, studyDeferred, renderLookup, studySummary, StudyBrowserHistory } from './fixtures.js'

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

test('document lookup distinguishes loading, empty history and local provenance', async () => {
  const read = studyDeferred()
  globalThis.fetch = () => read.promise
  renderLookup()
  assert.ok(screen.getByText(/Đang tải lịch sử/))
  read.resolve(studyJson({ messages: [] }))
  await screen.findByText('Chưa có câu hỏi')
  assert.ok(screen.getByRole('region', { name: 'Lịch sử tra cứu' }))
  assert.ok(screen.getByText(/có thể dựa trên nội dung trước/))
  assert.ok(screen.getByLabelText('Câu hỏi về bài học'))
  assert.equal(screen.queryByText(/Trang \d/), null)
})

test('document lookup reload failure retains confirmed history and draft', async () => {
  let reads = 0
  globalThis.fetch = async () => ++reads === 1 ? studyJson({ messages: [studyMessage(1)] }) : studyJson({ error: 'history failed' }, 503)
  renderLookup()
  await screen.findByText('Nội dung tra cứu 1')
  await userEvent.type(screen.getByLabelText('Câu hỏi về bài học'), 'bản nháp tiếp theo')
  await userEvent.click(screen.getByRole('button', { name: 'Tải lại lịch sử' }))
  await screen.findByText('Không tải được lịch sử tra cứu')
  assert.ok(screen.getByText('Nội dung tra cứu 1'))
  assert.equal(screen.getByLabelText('Câu hỏi về bài học').value, 'bản nháp tiếp theo')
})

for (const order of ['history-first', 'send-first']) test('document lookup independent reload/send completion ' + order, async () => {
  const history = studyDeferred(), send = studyDeferred()
  let reads = 0
  globalThis.fetch = (url, options = {}) => options.method === 'POST' ? send.promise : ++reads === 1 ? Promise.resolve(studyJson({ messages: [studyMessage(1)] })) : history.promise
  renderLookup()
  await screen.findByText('Nội dung tra cứu 1')
  await userEvent.type(screen.getByLabelText('Câu hỏi về bài học'), 'Câu hỏi mới')
  await userEvent.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  await userEvent.click(screen.getByRole('button', { name: 'Tải lại lịch sử' }))
  if (order === 'history-first') {
    history.resolve(studyJson({ messages: [studyMessage(1)] }))
    await waitFor(() => assert.equal(screen.getByRole('button', { name: 'Tải lại lịch sử' }).disabled, false))
  }
  send.resolve(studyJson({ message: studyMessage(2, 'Câu hỏi mới', 'Trả lời đã xác nhận') }, 201))
  await screen.findByText('Trả lời đã xác nhận')
  if (order === 'send-first') history.resolve(studyJson({ messages: [studyMessage(1)] }))
  await waitFor(() => assert.equal(screen.getByRole('button', { name: 'Tải lại lịch sử' }).disabled, false))
  assert.equal(screen.getAllByText('Trả lời đã xác nhận').length, 1)
  assert.equal(screen.getByRole('button', { name: 'Gửi câu hỏi' }).disabled, true) // unchanged draft cleared
})

test('document lookup keeps latest50 and deduplicates history/send overlap', async () => {
  let reads = 0
  const messages = Array.from({ length: 50 }, (_, i) => studyMessage(i + 1))
  globalThis.fetch = async (url, options = {}) => options.method === 'POST'
    ? studyJson({ message: studyMessage(51, 'mới', 'Nội dung tra cứu 51') }, 201)
    : studyJson({ messages: ++reads === 1 ? messages : [...messages.slice(1), studyMessage(51, 'mới', 'Nội dung tra cứu 51')] })
  renderLookup()
  await screen.findByText('Nội dung tra cứu 50')
  await userEvent.type(screen.getByLabelText('Câu hỏi về bài học'), 'mới')
  await userEvent.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  await screen.findByText('Nội dung tra cứu 51')
  assert.equal(screen.queryByText('Nội dung tra cứu 1'), null)
  await userEvent.click(screen.getByRole('button', { name: 'Tải lại lịch sử' }))
  await waitFor(() => assert.equal(reads, 2))
  assert.equal(screen.getAllByText('Nội dung tra cứu 51').length, 1)
  assert.equal(within(screen.getByRole('region', { name: 'Lịch sử tra cứu' })).getAllByRole('article').length, 50)
})

test('document lookup preserves older reading and explicitly focuses latest reply', async () => {
  globalThis.fetch = async (url, options = {}) => options.method === 'POST' ? studyJson({ message: studyMessage(3) }, 201) : studyJson({ messages: [studyMessage(1), studyMessage(2)] })
  renderLookup()
  await screen.findByText('Nội dung tra cứu 2')
  const history = screen.getByRole('region', { name: 'Lịch sử tra cứu' })
  Object.defineProperties(history, { scrollHeight: { configurable: true, value: 1000 }, clientHeight: { configurable: true, value: 300 } })
  history.scrollTop = 100
  fireEvent.scroll(history)
  await userEvent.type(screen.getByLabelText('Câu hỏi về bài học'), 'thêm')
  await userEvent.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  await screen.findByText('Nội dung tra cứu 3')
  assert.equal(history.scrollTop, 100)
  assert.equal(history.hasAttribute('aria-live'), false)
  await userEvent.click(screen.getByRole('button', { name: /Đến câu trả lời mới nhất/ }))
  assert.equal(history.scrollTop, 1000)
  assert.ok(document.activeElement.textContent.includes('Nội dung tra cứu 3'))
  assert.equal(screen.queryByRole('button', { name: /Đến câu trả lời mới nhất/ }), null)
})

for (const nextDraft of ['Câu hỏi khác', 'Câu hỏi đã gửi']) test('lookup recovery preserves edited draft on older success: ' + nextDraft, async () => {
  const send = studyDeferred()
  globalThis.fetch = async (url, options = {}) => options.method === 'POST' ? send.promise : studyJson({ messages: [] })
  renderLookup()
  await screen.findByText('Chưa có câu hỏi')
  const input = screen.getByLabelText('Câu hỏi về bài học')
  fireEvent.change(input, { target: { value: 'Câu hỏi đã gửi' } })
  await userEvent.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  fireEvent.change(input, { target: { value: 'bản khác tạm' } })
  fireEvent.change(input, { target: { value: nextDraft } })
  send.resolve(studyJson({ message: studyMessage(1) }, 201))
  await screen.findByText('Nội dung tra cứu 1')
  assert.equal(input.value, nextDraft)
  assert.equal(screen.getByRole('button', { name: 'Gửi câu hỏi' }).disabled, false)
})

test('lookup recovery gates immediate duplicate submit and validates trimmed limits', async () => {
  let posts = 0
  const send = studyDeferred()
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === 'POST') { posts += 1; return send.promise }
    return studyJson({ messages: [] })
  }
  renderLookup()
  await screen.findByText('Chưa có câu hỏi')
  const input = screen.getByLabelText('Câu hỏi về bài học'), form = input.closest('form')
  for (const value of ['   ', ' a ', 'x'.repeat(1001)]) {
    fireEvent.change(input, { target: { value } })
    fireEvent.submit(form)
    assert.equal(posts, 0)
    assert.equal(input.getAttribute('aria-invalid'), 'true')
  }
  fireEvent.change(input, { target: { value: 'x'.repeat(1000) } })
  act(() => { fireEvent.submit(form); fireEvent.submit(form) })
  assert.equal(posts, 1)
  assert.equal(input.disabled, false)
  send.resolve(studyJson({ message: studyMessage(1) }, 201))
  await screen.findByText('Nội dung tra cứu 1')
  assert.equal(input.value, '')
})

test('lookup recovery keeps draft on uncertain failure and history retry never replays POST', async () => {
  let posts = 0, reads = 0
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === 'POST') { posts += 1; throw new TypeError('offline') }
    reads += 1
    return studyJson({ messages: [studyMessage(1)] })
  }
  renderLookup()
  await screen.findByText('Nội dung tra cứu 1')
  const input = screen.getByLabelText('Câu hỏi về bài học')
  await userEvent.type(input, 'câu hỏi cần giữ')
  await userEvent.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  await screen.findByText(/Câu hỏi có thể đã được lưu/)
  assert.equal(input.value, 'câu hỏi cần giữ')
  assert.ok(document.getElementById(input.getAttribute('aria-describedby').split(' ').at(-1)).textContent.includes('Câu hỏi có thể'))
  await userEvent.click(screen.getByRole('button', { name: 'Kiểm tra lịch sử trước khi gửi lại' }))
  await waitFor(() => assert.equal(reads, 2))
  assert.equal(posts, 1)
  assert.ok(screen.getByText('Nội dung tra cứu 1'))
  assert.equal(input.value, 'câu hỏi cần giữ')
})

test('lookup recovery distinguishes unavailable source and successful textual no-match', async () => {
  let posts = 0
  const noMatch = 'Không tìm thấy đoạn nội dung phù hợp trong tài liệu của bài học. Hãy hỏi bằng từ khóa cụ thể hơn.'
  globalThis.fetch = async (url, options = {}) => options.method !== 'POST' ? studyJson({ messages: [] }) : ++posts === 1
    ? studyJson({ error: 'no text' }, 422) : studyJson({ message: studyMessage(1, 'khái niệm', noMatch) }, 201)
  renderLookup()
  await screen.findByText('Chưa có câu hỏi')
  const input = screen.getByLabelText('Câu hỏi về bài học')
  await userEvent.type(input, 'khái niệm')
  await userEvent.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  await screen.findByText(/chưa có nguồn văn bản dùng được/)
  assert.equal(input.value, 'khái niệm')
  await userEvent.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  await screen.findByText(noMatch)
  assert.ok(screen.getByText('Đã thêm câu trả lời vào lịch sử.'))
})

for (const change of ['lesson', 'revision']) test('lookup recovery ignores old read/send/error across ' + change, async () => {
  const oldRead = studyDeferred(), oldSend = studyDeferred()
  let reads = 0
  globalThis.fetch = async (url, options = {}) => options.method === 'POST' ? oldSend.promise : ++reads === 1 ? studyJson({ messages: [studyMessage(1)] }) : reads === 2 ? oldRead.promise : studyJson({ messages: [] })
  const view = renderLookup({ id: 41, title: 'Nguồn cũ', sourceRevision: 1 })
  await screen.findByText('Nội dung tra cứu 1')
  fireEvent.change(screen.getByLabelText('Câu hỏi về bài học'), { target: { value: 'đang gửi' } })
  await userEvent.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  await userEvent.click(screen.getByRole('button', { name: 'Tải lại lịch sử' }))
  view.rerender(h(DocumentAssistantPanel, { lesson: { id: change === 'lesson' ? 42 : 41, title: 'Nguồn mới', sourceRevision: 2 }, onClose: vi.fn() }))
  assert.equal(screen.queryByText('Nội dung tra cứu 1'), null)
  await screen.findByText('Chưa có câu hỏi')
  fireEvent.change(screen.getByLabelText('Câu hỏi về bài học'), { target: { value: 'bản nháp mới' } })
  oldSend.resolve(studyJson({ error: 'lỗi nguồn cũ' }, 503))
  oldRead.resolve(studyJson({ messages: [studyMessage(3, 'cũ', 'trả lời cũ')] }))
  await act(async () => { await new Promise((done) => setTimeout(done, 0)) })
  assert.equal(screen.queryByText(/lỗi nguồn cũ|trả lời cũ/), null)
  assert.equal(screen.getByLabelText('Câu hỏi về bài học').value, 'bản nháp mới')
})

test('lookup recovery close invalidates pending send and reopening resets in-memory draft', async () => {
  const send = studyDeferred()
  globalThis.fetch = async (url, options = {}) => options.method === 'POST' ? send.promise : studyJson({ messages: [] })
  const close = vi.fn(), view = renderLookup(undefined, close)
  await screen.findByText('Chưa có câu hỏi')
  fireEvent.change(screen.getByLabelText('Câu hỏi về bài học'), { target: { value: 'bản nháp' } })
  await userEvent.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  await userEvent.click(screen.getByRole('button', { name: 'Đóng trợ lý tài liệu' }))
  assert.equal(close.mock.calls.length, 1)
  send.resolve(studyJson({ message: studyMessage(9) }, 201))
  await act(async () => { await new Promise((done) => setTimeout(done, 0)) })
  assert.equal(screen.queryByText('Nội dung tra cứu 9'), null)
  view.unmount()
  renderLookup()
  await screen.findByText('Chưa có câu hỏi')
  assert.equal(screen.getByLabelText('Câu hỏi về bài học').value, '')
})

test('extractive summary hides completed old content immediately on source revision change', async () => {
  const next = studyDeferred()
  let reads = 0
  globalThis.fetch = async () => ++reads === 1 ? studyJson(studySummary()) : next.promise
  const view = render(h(LessonSummaryPanel, { lesson: { id: 41, title: 'Bài nguồn', sourceRevision: 1 }, onClose: vi.fn() }))
  await screen.findByText('Các câu được chọn trực tiếp từ nguồn bài học.')
  view.rerender(h(LessonSummaryPanel, { lesson: { id: 41, title: 'Bài nguồn mới', sourceRevision: 2 }, onClose: vi.fn() }))
  assert.equal(screen.queryByText('Các câu được chọn trực tiếp từ nguồn bài học.'), null)
  assert.ok(screen.getByText(/Đang tạo tóm tắt/))
  next.resolve(studyJson(studySummary({ sourceRevision: 2, points: [{ text: 'Điểm tóm tắt mới', page: null }] })))
  await screen.findByText('Điểm tóm tắt mới')
})

test('extractive summary withholds mismatched revision and gates retry pending', async () => {
  const retry = studyDeferred()
  let reads = 0
  globalThis.fetch = async () => ++reads === 1 ? studyJson(studySummary({ sourceRevision: 2 })) : retry.promise
  render(h(LessonSummaryPanel, { lesson: { id: 41, title: 'Bài nguồn', sourceRevision: 1 }, onClose: vi.fn() }))
  await screen.findByText('Nguồn bài học đã thay đổi')
  assert.equal(screen.queryByText('Các câu được chọn trực tiếp từ nguồn bài học.'), null)
  const button = screen.getByRole('button', { name: 'Thử lại' })
  act(() => { button.click(); button.click() })
  await waitFor(() => assert.equal(reads, 2))
  assert.equal(screen.getByRole('button', { name: 'Thử lại' }).disabled, true)
  retry.resolve(studyJson(studySummary()))
  await screen.findByText('Các câu được chọn trực tiếp từ nguồn bài học.')
})

test('extractive summary successful empty keeps supplied source and truncation metadata', async () => {
  globalThis.fetch = async () => studyJson(studySummary({ points: [], sourceType: 'DOCUMENT', truncated: true }))
  render(h(LessonSummaryPanel, { lesson: { id: 41, title: 'Nguồn ngắn', sourceRevision: 1 }, onClose: vi.fn() }))
  await screen.findByText('Chưa có điểm tóm tắt phù hợp')
  assert.ok(screen.getByText(/văn bản trích từ tài liệu/))
  assert.ok(screen.getByText(/Nguồn đã được giới hạn/))
  assert.equal(screen.queryByText('Chưa có nguồn văn bản để tóm tắt'), null)
  assert.equal(screen.queryByText(/Trang \d/), null)
})

test('extractive summary unavailable is generic and recovers through retry', async () => {
  let reads = 0
  globalThis.fetch = async () => ++reads === 1 ? studyJson({ error: 'Chưa có nội dung văn bản', code: 'SOURCE_UNAVAILABLE', extractionStatus: 'NOT_PROCESSED' }, 422) : studyJson(studySummary())
  render(h(LessonSummaryPanel, { lesson: { id: 41, title: 'Bài nguồn', sourceRevision: 1 }, onClose: vi.fn() }))
  await screen.findByText('Chưa có nguồn văn bản để tóm tắt')
  assert.ok(screen.getByText(/chưa có văn bản dùng được/))
  assert.equal(screen.queryByText(/NOT_PROCESSED/), null)
  await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  await screen.findByText('Các câu được chọn trực tiếp từ nguồn bài học.')
})

test('extractive summary displays only supplied pages and no fabricated unknown-source label', async () => {
  globalThis.fetch = async () => studyJson(studySummary({ sourceType: undefined, points: [{ text: 'Điểm có trang', page: 3 }, { text: 'Điểm không trang', page: null }] }))
  render(h(LessonSummaryPanel, { lesson: { id: 41, title: 'Bài nguồn' }, onClose: vi.fn() }))
  await screen.findByText('Điểm có trang')
  assert.ok(screen.getByText('Trang 3'))
  assert.equal(screen.getAllByText(/Trang \d/).length, 1)
  assert.equal(screen.queryByText(/nội dung giảng viên nhập/), null)
  assert.equal(screen.queryByRole('link', { name: /Trang/ }), null)
})

test('extractive summary close invalidates an unfinished read', async () => {
  const read = studyDeferred(), close = vi.fn()
  globalThis.fetch = () => read.promise
  render(h(LessonSummaryPanel, { lesson: { id: 41, title: 'Bài nguồn' }, onClose: close }))
  await userEvent.click(screen.getByRole('button', { name: 'Đóng tóm tắt' }))
  read.resolve(studyJson(studySummary()))
  await act(async () => { await new Promise((done) => setTimeout(done, 0)) })
  assert.equal(close.mock.calls.length, 1)
  assert.equal(screen.queryByText('Các câu được chọn trực tiếp từ nguồn bài học.'), null)
})

for (const role of ['STUDENT', 'INSTRUCTOR']) test('study workspace panel URL and draft lifecycle for ' + role, async () => {
  workspaceFetch(role, (url) => {
    if (url.endsWith('/chat')) return studyJson({ messages: [studyMessage(1)] })
    if (url.endsWith('/summary')) return studyJson(studySummary())
  })
  const start = '/courses/4?section=lessons&lessonId=1&panel=assistant&keep=existing'
  render(h(SessionProvider, null, h(MemoryRouter, { initialEntries: [start] }, h(CurrentPath), h(StudyBrowserHistory), h(Routes, null, h(Route, { path: '/courses/:courseId', element: h(CourseWorkspacePage) })))))
  await screen.findByText('Nội dung tra cứu 1')
  fireEvent.change(screen.getByLabelText('Câu hỏi về bài học'), { target: { value: 'draft local' } })
  await userEvent.click(screen.getByRole('button', { name: 'Tóm tắt bài học', exact: true }))
  await screen.findByText('Các câu được chọn trực tiếp từ nguồn bài học.')
  assert.ok(screen.getByTestId('current-path').textContent.includes('panel=summary'))
  assert.ok(screen.getByTestId('current-path').textContent.includes('keep=existing'))
  await userEvent.click(screen.getByRole('button', { name: 'Back study' }))
  await screen.findByText('Nội dung tra cứu 1')
  assert.equal(screen.getByLabelText('Câu hỏi về bài học').value, '')
  assert.equal(screen.getByTestId('current-path').textContent, start)
  await userEvent.click(screen.getByRole('button', { name: 'Forward study' }))
  await screen.findByText('Các câu được chọn trực tiếp từ nguồn bài học.')
  await userEvent.click(screen.getByRole('button', { name: 'Đóng tóm tắt' }))
  assert.equal(screen.queryByText('Các câu được chọn trực tiếp từ nguồn bài học.'), null)
  assert.ok(!screen.getByTestId('current-path').textContent.includes('panel='))
  assert.ok(screen.getByTestId('current-path').textContent.includes('lessonId=1'))
})

test('study workspace opening lookup or summary preserves quiz stay/discard guard', async () => {
  dialogTestSupport()
  let chatReads = 0
  workspaceFetch('STUDENT', (url) => {
    if (url.endsWith('/quizzes')) return studyJson({ attempts: [quizHistory(1)] })
    if (url.endsWith('/1/draft')) return studyJson({ error: 'Không lưu được draft' }, 503)
    if (url.endsWith('/quiz-attempts/1')) return studyJson(quizDraft(1))
    if (url.endsWith('/chat')) { chatReads += 1; return studyJson({ messages: [] }) }
    if (url.endsWith('/summary')) return studyJson(studySummary())
  })
  renderWorkspace('/courses/4?section=lessons&lessonId=1&panel=quiz')
  await showQuiz()
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn A' }))
  await userEvent.click(screen.getByRole('button', { name: 'Tra cứu nội dung' }))
  await screen.findByRole('dialog')
  assert.equal(chatReads, 0)
  assert.ok(screen.getByTestId('current-path').textContent.includes('panel=quiz'))
  await userEvent.click(screen.getByRole('button', { name: 'Hủy' }))
  assert.equal(screen.getByRole('radio', { name: 'Lựa chọn A' }).checked, true)
  await userEvent.click(screen.getByRole('button', { name: 'Tóm tắt bài học', exact: true }))
  await userEvent.click(await screen.findByRole('button', { name: 'Rời trang và bỏ thay đổi' }))
  await screen.findByText('Các câu được chọn trực tiếp từ nguồn bài học.')
  assert.ok(screen.getByTestId('current-path').textContent.includes('panel=summary'))
})

test('study workspace composer supports keyboard and retains long response text', async () => {
  const longAnswer = 'Đoạn nguồn dài '.repeat(300) + 'x'.repeat(500)
  globalThis.fetch = async (url, options = {}) => options.method === 'POST' ? studyJson({ message: studyMessage(1, 'abc', longAnswer) }, 201) : studyJson({ messages: [] })
  const close = vi.fn()
  renderLookup(undefined, close)
  await screen.findByText('Chưa có câu hỏi')
  const input = screen.getByLabelText('Câu hỏi về bài học')
  input.focus()
  await userEvent.keyboard('abc')
  await userEvent.tab()
  assert.equal(document.activeElement, screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  await userEvent.keyboard('{Enter}')
  await screen.findByText(longAnswer)
  assert.equal(input.value, '')
  screen.getByRole('region', { name: 'Lịch sử tra cứu' }).focus()
  assert.equal(document.activeElement.getAttribute('tabindex'), '0')
  screen.getByRole('button', { name: 'Đóng trợ lý tài liệu' }).focus()
  await userEvent.keyboard('{Enter}')
  assert.equal(close.mock.calls.length, 1)
})

test('document lookup initial read error allows a draft and near-bottom follow without false new indicator', async () => {
  let reads = 0
  globalThis.fetch = async (url, options = {}) => options.method === 'POST' ? studyJson({ message: studyMessage(3) }, 201) : ++reads === 1 ? studyJson({ error: 'history offline' }, 503) : studyJson({ messages: [studyMessage(1), studyMessage(2)] })
  renderLookup()
  await screen.findByText('Không tải được lịch sử tra cứu')
  const input = screen.getByLabelText('Câu hỏi về bài học')
  fireEvent.change(input, { target: { value: 'giữ câu hỏi' } })
  await userEvent.click(screen.getByRole('button', { name: 'Tải lại lịch sử' }))
  await screen.findByText('Nội dung tra cứu 2')
  assert.equal(input.value, 'giữ câu hỏi')
  const history = screen.getByRole('region', { name: 'Lịch sử tra cứu' })
  Object.defineProperties(history, { scrollHeight: { configurable: true, value: 1000 }, clientHeight: { configurable: true, value: 300 } })
  history.scrollTop = 645 //55px from bottom: follow, including after reload
  fireEvent.scroll(history)
  await userEvent.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  assert.equal(document.activeElement, input)
  await screen.findByText('Nội dung tra cứu 3')
  assert.equal(history.scrollTop, 1000)
  assert.equal(screen.queryByRole('button', { name: /Đến câu trả lời mới nhất/ }), null)
})

test('extractive summary retains long sentence text and supports keyboard close', async () => {
  const text = 'Câu nguồn trích xuất dài '.repeat(300) + 'z'.repeat(500)
  globalThis.fetch = async () => studyJson(studySummary({ points: [{ text, page: null }] }))
  const close = vi.fn()
  render(h(LessonSummaryPanel, { lesson: { id: 41, title: 'Tiêu đề dài '.repeat(30), sourceRevision: 1 }, onClose: close }))
  await screen.findByText(text)
  assert.equal(screen.getByRole('listitem').textContent, text)
  screen.getByRole('button', { name: 'Đóng tóm tắt' }).focus()
  await userEvent.keyboard('{Enter}')
  assert.equal(close.mock.calls.length, 1)
})

test('document lookup reading anchor ignores layout movement when reload status disappears', async () => {
  const reload = studyDeferred()
  let reads = 0
  globalThis.fetch = async () => ++reads === 1 ? studyJson({ messages: [studyMessage(1), studyMessage(2)] }) : reload.promise
  renderLookup()
  await screen.findByText('Nội dung tra cứu 2')
  const region = screen.getByRole('region', { name: 'Lịch sử tra cứu' })
  Object.defineProperties(region, { scrollHeight: { configurable: true, value: 1000 }, clientHeight: { configurable: true, value: 300 } })
  const regionTop = () => screen.queryByText(/Đang tải lại lịch sử/) ? 200 : 100
  region.getBoundingClientRect = () => ({ top: regionTop(), bottom: regionTop() + 300 })
  region.querySelector('article').getBoundingClientRect = () => ({ top: regionTop() + 20, bottom: regionTop() + 100 })
  region.scrollTop = 100
  fireEvent.scroll(region)
  await userEvent.click(screen.getByRole('button', { name: 'Tải lại lịch sử' }))
  await screen.findByText(/Đang tải lại lịch sử/)
  reload.resolve(studyJson({ messages: [studyMessage(1), studyMessage(2)] }))
  await waitFor(() => assert.equal(screen.getByRole('button', { name: 'Tải lại lịch sử' }).disabled, false))
  assert.equal(region.scrollTop, 100)
  assert.equal(screen.queryByRole('button', { name: /Đến câu trả lời mới nhất/ }), null)
})
