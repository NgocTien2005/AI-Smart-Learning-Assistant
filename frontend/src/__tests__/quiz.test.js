import { test, vi, assert, act, fireEvent, render, screen, waitFor, within, userEvent, SessionProvider, MemoryRouter, Route, Routes, CourseWorkspacePage, PracticeQuizPanel, h, jsonResponse, dialogTestSupport, CurrentPath, workspaceFetch, quizDraft, quizHistory, quizResult, quizApi, tickQuizSave, showQuiz, QuizBrowserHistory, studyDeferred } from './fixtures.js'

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
  await user.click(screen.getByRole('button', { name: 'Tạo bài ôn mới' }))
  await user.click(await screen.findByRole('button', { name: 'Tạo bài ôn nhanh' }))
  await user.click(await screen.findByRole('radio', { name: /Vòng lặp/ }))
  await user.click(screen.getByRole('button', { name: 'Đóng bài ôn tập' }))
  await waitFor(() => assert.ok(calls.some(([url, method]) => url.endsWith('/a1/draft') && method === 'PUT')))
  assert.equal(screen.queryByText('Bản nháp chưa lưu'), null)
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
  await user.click(screen.getByRole('button', { name: 'Tạo bài ôn mới' }))
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

test('quiz workspace history precedes detail, filters keep selection and creation starts collapsed', async () => {
  const historyRead = studyDeferred()
  const calls = quizApi(undefined, ({ path, method }) => path.endsWith('/quizzes') && method === 'GET' ? historyRead.promise : undefined)
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Ôn tập' }, onClose: vi.fn() }))
  const history = await screen.findByRole('region', { name: 'Lịch sử ôn tập' })
  assert.equal(screen.queryByRole('button', { name: 'Tạo bài ôn nhanh' }), null)
  assert.ok(screen.getByRole('button', { name: 'Tạo bài ôn mới', expanded: false }))
  assert.equal(calls.length, 1)
  // The history region mounts before its asynchronous GET has rendered rows.
  assert.ok(within(history).getByText('Đang tải lịch sử…'))
  assert.equal(within(history).queryByText('0/1 điểm'), null)
  await act(async () => historyRead.resolve(jsonResponse({ attempts: [quizHistory(2, { submittedAt: '2026-02-01', score: 0 }), quizHistory(1)] })))
  assert.ok(await within(history).findByText('0/1 điểm'))
  await showQuiz()
  await userEvent.selectOptions(screen.getByLabelText('Trạng thái bài ôn'), 'submitted')
  assert.ok(screen.getByText(/Bài đang xem nằm ngoài bộ lọc/))
  assert.ok(screen.getByRole('radio', { name: 'Lựa chọn A' }))
  assert.equal(screen.queryByRole('button', { name: 'Tiếp tục bài ôn #1' }), null)
})

test('quiz workspace history retry distinguishes error from confirmed empty and never writes', async () => {
  let reads = 0
  const calls = quizApi([], ({ path }) => path.endsWith('/quizzes') && ++reads === 1 ? jsonResponse({ error: 'Mất kết nối lịch sử' }, 503) : undefined)
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Lịch sử' }, onClose: vi.fn() }))
  await screen.findByText('Không tải được lịch sử ôn tập')
  assert.equal(screen.queryByText('Chưa có bài ôn tập'), null)
  await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  await screen.findByText('Chưa có bài ôn tập')
  assert.ok(calls.every((call) => call.method === 'GET'))
})

test('quiz workspace opening failure retains current answers and retry only reads the failed target', async () => {
  let failures = 0
  const calls = quizApi(undefined, ({ path, method }) => path.endsWith('/2') && method === 'GET' && failures++ === 0 ? jsonResponse({ error: 'Không mở được bài 2' }, 503) : undefined)
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Mở bài' }, onClose: vi.fn() }))
  await showQuiz()
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn A' }))
  await userEvent.click(screen.getByRole('button', { name: 'Tiếp tục bài ôn #2' }))
  await screen.findByText('Không mở được bài ôn #2')
  assert.equal(screen.getByRole('radio', { name: 'Lựa chọn A' }).checked, true)
  const writes = calls.filter((call) => call.method !== 'GET').length
  await userEvent.click(screen.getByRole('button', { name: 'Thử mở lại bài #2' }))
  await screen.findByText(/Câu hỏi 2/)
  assert.equal(calls.filter((call) => call.method !== 'GET').length, writes)
})

test('quiz workspace same attempt is a no-op and cannot replace an unsaved answer', async () => {
  const calls = quizApi()
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Giữ bài' }, onClose: vi.fn() }))
  await showQuiz()
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn B' }))
  await userEvent.click(screen.getByRole('button', { name: 'Tiếp tục bài ôn #1' }))
  assert.equal(screen.getByRole('radio', { name: 'Lựa chọn B' }).checked, true)
  assert.equal(calls.filter((call) => call.path.endsWith('/1')).length, 1)
})

test('quiz workspace drains an older write before confirming a return to the saved answer', async () => {
  const pending = []
  const calls = quizApi(undefined, ({ path }) => {
    if (path.endsWith('/1')) return jsonResponse(quizDraft(1, { answers: [0] }))
    if (path.endsWith('/draft')) return new Promise((resolve) => pending.push(resolve))
  })
  const close = vi.fn()
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Queue' }, onClose: close }))
  await showQuiz()
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn B' }))
  await tickQuizSave()
  assert.equal(pending.length, 1)
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn A' }))
  await userEvent.click(screen.getByRole('button', { name: 'Đóng bài ôn tập' }))
  assert.equal(close.mock.calls.length, 0)
  await act(async () => pending[0](jsonResponse({ version: 1, answers: [1] })))
  await waitFor(() => assert.equal(pending.length, 2))
  assert.deepEqual(calls.filter((c) => c.method === 'PUT').map((c) => c.body), [{ answers: [1], version: 0 }, { answers: [0], version: 1 }])
  assert.equal(close.mock.calls.length, 0)
  await act(async () => pending[1](jsonResponse({ version: 2, answers: [0] })))
  await waitFor(() => assert.equal(close.mock.calls.length, 1))
})

test('quiz workspace failure retains edits without an automatic retry loop', async () => {
  let writes = 0
  quizApi(undefined, ({ path }) => path.endsWith('/draft') && ++writes === 1 ? jsonResponse({ error: 'Offline draft' }, 503) : undefined)
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Retry' }, onClose: vi.fn() }))
  await showQuiz()
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn A' }))
  await tickQuizSave()
  await screen.findByText(/Lưu thất bại/)
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn B' }))
  await tickQuizSave()
  assert.equal(writes, 1)
  await userEvent.click(screen.getByRole('button', { name: 'Thử lưu lại' }))
  await screen.findByText(/Đã lưu trên máy chủ/)
  assert.equal(writes, 2)
  assert.equal(screen.getByRole('radio', { name: 'Lựa chọn B' }).checked, true)
  assert.equal(screen.getByRole('button', { name: /Nộp bài \(1\/1\)/ }).disabled, false)
})

test('quiz workspace conflict blocks autosave after edits and recovery read failure is visible', async () => {
  let reads = 0, writes = 0
  const calls = quizApi(undefined, ({ path }) => {
    if (path.endsWith('/1')) {
      reads++
      if (reads === 2) return jsonResponse({ error: 'Recovery unavailable' }, 503)
      return jsonResponse(quizDraft(1, { version: reads > 1 ? 4 : 0 }))
    }
    if (path.endsWith('/draft') && ++writes === 1) return jsonResponse({ error: 'Changed elsewhere', code: 'ATTEMPT_VERSION_CONFLICT' }, 409)
  })
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Conflict' }, onClose: vi.fn() }))
  await showQuiz()
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn A' }))
  await tickQuizSave()
  await screen.findByText(/Xung đột phiên bản/)
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn B' }))
  await tickQuizSave()
  assert.equal(writes, 1)
  await userEvent.click(screen.getByRole('button', { name: 'Lưu câu trả lời hiện tại' }))
  await screen.findByText(/Recovery unavailable/)
  assert.equal(screen.getByRole('radio', { name: 'Lựa chọn B' }).checked, true)
  await userEvent.click(screen.getByRole('button', { name: 'Lưu câu trả lời hiện tại' }))
  await screen.findByText(/Đã lưu trên máy chủ/)
  assert.deepEqual(calls.filter((c) => c.method === 'PUT').at(-1).body, { answers: [1], version: 4 })
})

test('quiz workspace loading saved state requires discard confirmation and can show other-tab results', async () => {
  dialogTestSupport()
  let reads = 0, writes = 0
  quizApi(undefined, ({ path }) => {
    if (path.endsWith('/1')) return jsonResponse(++reads === 1 ? quizDraft(1) : quizResult(1))
    if (path.endsWith('/draft')) { writes++; return jsonResponse({ error: 'Already submitted', code: 'ATTEMPT_SUBMITTED' }, 409) }
  })
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Other tab' }, onClose: vi.fn() }))
  await showQuiz()
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn A' }))
  await tickQuizSave()
  await userEvent.click(screen.getByRole('button', { name: 'Lưu câu trả lời hiện tại' }))
  await screen.findByText(/đã được nộp trong một thẻ khác/)
  await userEvent.click(screen.getByRole('button', { name: 'Tải bản đã lưu' }))
  await userEvent.click(screen.getByRole('button', { name: 'Hủy' }))
  assert.equal(screen.getByRole('radio', { name: 'Lựa chọn A' }).checked, true)
  await userEvent.click(screen.getByRole('button', { name: 'Tải bản đã lưu' }))
  await userEvent.click(screen.getByRole('button', { name: 'Tải bản đã lưu và bỏ thay đổi' }))
  await screen.findByRole('heading', { name: 'Kết quả: 0/1' })
  assert.equal(writes, 1)
})

test('quiz workspace newest open intent wins while history remains usable', async () => {
  let first
  quizApi(undefined, ({ path }) => path.endsWith('/1') ? new Promise((resolve) => { first = resolve }) : undefined)
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Open races' }, onClose: vi.fn() }))
  await userEvent.click(await screen.findByRole('button', { name: 'Tiếp tục bài ôn #1' }))
  await waitFor(() => assert.ok(first))
  await userEvent.click(screen.getByRole('button', { name: 'Tiếp tục bài ôn #2' }))
  await screen.findByText(/Câu hỏi 2/)
  await act(async () => first(jsonResponse(quizDraft(1))))
  assert.equal(screen.queryByText(/Câu hỏi 1/), null)
  assert.equal(screen.getByRole('button', { name: 'Tiếp tục bài ôn #2' }).getAttribute('aria-current'), 'true')
})

test('quiz workspace stale history cannot undo a newly created attempt and actual count is honest', async () => {
  let stale, reads = 0
  quizApi([], ({ path, method }) => {
    if (path.endsWith('/quizzes') && method === 'GET' && ++reads === 1) return new Promise((resolve) => { stale = resolve })
    if (path.endsWith('/quizzes') && method === 'GET') return jsonResponse({ attempts: [quizHistory(3)] })
  })
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Create race' }, onClose: vi.fn() }))
  await userEvent.click(screen.getByRole('button', { name: 'Tạo bài ôn mới' }))
  await userEvent.click(screen.getByRole('button', { name: 'Tạo bài ôn nhanh' }))
  await screen.findByText(/Chỉ tạo được 1 câu phù hợp/)
  await screen.findByRole('button', { name: 'Tiếp tục bài ôn #3' })
  await act(async () => stale(jsonResponse({ attempts: [] })))
  assert.ok(screen.getByRole('button', { name: 'Tiếp tục bài ôn #3' }))
  assert.equal(screen.queryByText('Chưa có bài ôn tập'), null)
  assert.equal(screen.queryByRole('button', { name: 'Tạo bài ôn nhanh' }), null)
})

test('quiz workspace creation disclosure retains count and focuses without writing on collapse', async () => {
  const calls = quizApi([])
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Disclosure' }, onClose: vi.fn() }))
  await screen.findByText('Chưa có bài ôn tập')
  const trigger = screen.getByRole('button', { name: 'Tạo bài ôn mới' })
  await userEvent.click(trigger)
  const select = screen.getByLabelText('Số câu hỏi')
  assert.equal(document.activeElement, select)
  await userEvent.selectOptions(select, '7')
  await userEvent.keyboard('{Escape}')
  assert.equal(document.activeElement, trigger)
  assert.equal(calls.filter((c) => c.method !== 'GET').length, 0)
  await userEvent.click(trigger)
  assert.equal(screen.getByLabelText('Số câu hỏi').value, '7')
})

test('quiz workspace create error keeps count and current detail and locks duplicate POST', async () => {
  let finish, posts = 0
  quizApi(undefined, ({ path, method }) => {
    if (path.endsWith('/quizzes') && method === 'POST') { posts++; return new Promise((resolve) => { finish = resolve }) }
  })
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Create pending' }, onClose: vi.fn() }))
  await showQuiz()
  await userEvent.click(screen.getByRole('button', { name: 'Tạo bài ôn mới' }))
  await userEvent.selectOptions(screen.getByLabelText('Số câu hỏi'), '8')
  const form = screen.getByRole('button', { name: 'Tạo bài ôn nhanh' }).closest('form')
  fireEvent.submit(form); fireEvent.submit(form)
  await waitFor(() => assert.equal(posts, 1))
  assert.equal(screen.getByLabelText('Số câu hỏi').disabled, true)
  await act(async () => finish(jsonResponse({ error: 'Nguồn chưa có câu định nghĩa phù hợp' }, 422)))
  await screen.findByText(/Nguồn chưa có câu định nghĩa phù hợp/)
  assert.equal(screen.getByLabelText('Số câu hỏi').value, '8')
  assert.ok(screen.getByText(/Câu hỏi 1/))
})

test('quiz workspace submit drains latest draft once, preserves failure and displays confirmed zero result', async () => {
  let save, submissions = 0
  const calls = quizApi(undefined, ({ path }) => {
    if (path.endsWith('/draft')) return new Promise((resolve) => { save = resolve })
    if (path.endsWith('/submit') && ++submissions === 1) return jsonResponse({ error: 'Nộp thất bại' }, 503)
  })
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Submit' }, onClose: vi.fn() }))
  await showQuiz()
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn B' }))
  const form = screen.getByRole('button', { name: /Nộp bài \(1\/1\)/ }).closest('form')
  fireEvent.submit(form); fireEvent.submit(form)
  await waitFor(() => assert.ok(save))
  assert.equal(submissions, 0)
  assert.equal(screen.getByRole('radio', { name: 'Lựa chọn B' }).disabled, true)
  await act(async () => save(jsonResponse({ version: 1, answers: [1] })))
  await screen.findByText(/Nộp thất bại/)
  assert.equal(submissions, 1)
  assert.equal(screen.getByRole('radio', { name: 'Lựa chọn B' }).checked, true)
  await userEvent.click(screen.getByRole('button', { name: /Nộp bài \(1\/1\)/ }))
  await screen.findByRole('heading', { name: 'Kết quả: 0/1' })
  assert.deepEqual(calls.filter((c) => c.path.endsWith('/submit')).at(-1).body, { answers: [1], version: 1 })
  assert.equal(screen.queryByRole('radio'), null)
})

test('quiz workspace lesson replacement ignores old save response and no-match is distinct', async () => {
  let finish
  quizApi([quizHistory(1)], ({ path }) => path.endsWith('/draft') ? new Promise((resolve) => { finish = resolve }) : undefined)
  const view = render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Cũ' }, onClose: vi.fn() }))
  await showQuiz()
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn A' }))
  await tickQuizSave()
  view.rerender(h(PracticeQuizPanel, { lesson: { id: 10, title: 'Mới' }, onClose: vi.fn() }))
  await screen.findByRole('button', { name: 'Tiếp tục bài ôn #1' })
  await act(async () => finish(jsonResponse({ version: 1, answers: [0] })))
  assert.equal(screen.queryByRole('radio'), null)
  await userEvent.selectOptions(screen.getByLabelText('Trạng thái bài ôn'), 'submitted')
  assert.ok(screen.getByText('Không có bài ôn phù hợp'))
  assert.equal(screen.queryByText('Chưa có bài ôn tập'), null)
})

test('quiz workspace legacy result and long source are readable without inventing answers or requested count', async () => {
  const source = 'Nguồn'.repeat(2500)
  quizApi([quizHistory(1, { submittedAt: '2026-02-01', score: 0 })], ({ path }) => path.endsWith('/1') ? jsonResponse(quizResult(1, { legacyAnswersUnavailable: true, questions: [{ ...quizResult(1).questions[0], selectedIndex: null, isCorrect: null, sourcePassage: source }] })) : undefined)
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Legacy' }, onClose: vi.fn() }))
  await userEvent.click(await screen.findByRole('button', { name: 'Xem kết quả bài ôn #1' }))
  await screen.findByRole('heading', { name: 'Kết quả: 0/1' })
  assert.ok(screen.getAllByText(/Đáp án đã chọn không được lưu ở phiên bản trước/).length)
  assert.ok(screen.getByText(/Kết quả cũ/))
  assert.ok(screen.getByText((_, el) => el.tagName === 'BLOCKQUOTE' && el.textContent.includes(source)))
  assert.equal(screen.queryByText(/Chỉ tạo được/), null)
  await userEvent.click(screen.getByRole('button', { name: 'Quay lại lịch sử' }))
  assert.equal(screen.queryByRole('heading', { name: 'Kết quả: 0/1' }), null)
})

test('quiz workspace newer answers stay editable during autosave and queued versions finish without stuck pending', async () => {
  const pending = []
  const calls = quizApi(undefined, ({ path }) => path.endsWith('/draft') ? new Promise((resolve) => pending.push(resolve)) : undefined)
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Serialized' }, onClose: vi.fn() }))
  await showQuiz()
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn A' }))
  await tickQuizSave()
  assert.equal(pending.length, 1)
  assert.equal(screen.getByRole('radio', { name: 'Lựa chọn B' }).disabled, false)
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn B' }))
  await tickQuizSave()
  assert.equal(pending.length, 1)
  await act(async () => pending[0](jsonResponse({ version: 1, answers: [0] })))
  await waitFor(() => assert.equal(pending.length, 2))
  assert.equal(screen.getByRole('radio', { name: 'Lựa chọn B' }).checked, true)
  await act(async () => pending[1](jsonResponse({ version: 2, answers: [1] })))
  await screen.findByText(/Đã lưu trên máy chủ/)
  assert.deepEqual(calls.filter((call) => call.method === 'PUT').map((call) => call.body.version), [0, 1])
  assert.equal(screen.getByRole('button', { name: 'Nộp bài (1/1)' }).disabled, false)
})

test('quiz workspace creation flush failure offers native stay or explicit discard without premature POST', async () => {
  dialogTestSupport()
  const calls = quizApi(undefined, ({ path }) => path.endsWith('/draft') ? jsonResponse({ error: 'Lưu nháp lỗi' }, 503) : undefined)
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Discard' }, onClose: vi.fn() }))
  await showQuiz()
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn B' }))
  await userEvent.click(screen.getByRole('button', { name: 'Tạo bài ôn mới' }))
  await userEvent.click(screen.getByRole('button', { name: 'Tạo bài ôn nhanh' }))
  const dialog = await screen.findByRole('dialog')
  assert.equal(calls.filter((call) => call.method === 'POST').length, 0)
  fireEvent.keyDown(dialog, { key: 'Escape' })
  await waitFor(() => assert.equal(screen.queryByRole('dialog'), null))
  assert.equal(screen.getByRole('radio', { name: 'Lựa chọn B' }).checked, true)
  await userEvent.click(screen.getByRole('button', { name: 'Tạo bài ôn nhanh' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Tạo bài mới và bỏ thay đổi' }))
  await screen.findByRole('heading', { name: 'Bài đang làm #3' })
  assert.equal(calls.filter((call) => call.method === 'POST').length, 1)
  assert.equal(calls.filter((call) => call.method === 'PUT').length, 1)
})

test('quiz workspace native radio keyboard retains full long prompt and options without exposing answer key', async () => {
  const prompt = 'Nội dung '.repeat(600), option = 'Lựa chọn dài '.repeat(500)
  quizApi(undefined, ({ path }) => path.endsWith('/1') ? jsonResponse(quizDraft(1, { questions: [{ id: 'long', prompt, options: [option, 'Chọn bằng bàn phím'] }] })) : undefined)
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Long' }, onClose: vi.fn() }))
  await userEvent.click(await screen.findByRole('button', { name: 'Tiếp tục bài ôn #1' }))
  const radios = await screen.findAllByRole('radio')
  // jsdom lacks CSS.escape required by user-event's Arrow-key radio simulation.
  // Exercise native Space selection here; full radio arrows remain a browser check.
  await userEvent.tab()
  assert.equal(document.activeElement, radios[0])
  await userEvent.keyboard(' ')
  assert.equal(radios[0].checked, true)
  assert.ok(screen.getByRole('group').textContent.includes(prompt))
  assert.ok(radios[0].closest('label').textContent.includes(option))
  assert.equal(screen.queryByText(/Đáp án đúng/), null)
})

test('quiz workspace URL back-forward remount resumes server confirmed answers from history', async () => {
  let saved = [null], version = 0, writes = 0
  workspaceFetch('STUDENT', (url, options) => {
    if (url.endsWith('/quizzes')) return jsonResponse({ attempts: [quizHistory(1)] })
    if (url.endsWith('/1/draft')) { const data = JSON.parse(options.body); saved = data.answers; version++; writes++; return jsonResponse({ version, answers: saved }) }
    if (url.endsWith('/quiz-attempts/1')) return jsonResponse(quizDraft(1, { version, answers: saved }))
  })
  render(h(SessionProvider, null, h(MemoryRouter, { initialEntries: ['/courses/4?section=lessons&lessonId=1&panel=quiz'] },
    h(CurrentPath), h(QuizBrowserHistory), h(Routes, null, h(Route, { path: '/courses/:courseId', element: h(CourseWorkspacePage) })))))
  await showQuiz()
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn A' }))
  await userEvent.click(screen.getByRole('button', { name: 'Đóng bài ôn tập' }))
  await waitFor(() => assert.equal(screen.getByTestId('current-path').textContent, '/courses/4?section=lessons&lessonId=1'))
  assert.equal(writes, 1)
  await userEvent.click(screen.getByRole('button', { name: 'Lùi quiz' }))
  await showQuiz()
  assert.equal(screen.getByRole('radio', { name: 'Lựa chọn A' }).checked, true)
  assert.equal(screen.getByTestId('current-path').textContent, '/courses/4?section=lessons&lessonId=1&panel=quiz')
  await userEvent.click(screen.getByRole('button', { name: 'Tiến quiz' }))
  await waitFor(() => assert.equal(screen.queryByRole('radio'), null))
  assert.equal(writes, 1)
})

test('quiz workspace lost write acknowledgement cannot falsely confirm a return to the old baseline', async () => {
  let reads = 0, writes = 0
  quizApi(undefined, ({ path }) => {
    if (path.endsWith('/1')) return jsonResponse(quizDraft(1, { answers: [++reads === 1 ? 0 : 1], version: reads === 1 ? 0 : 1 }))
    if (path.endsWith('/draft')) {
      writes++
      if (writes === 1) return Promise.reject(new TypeError('Connection lost after server write'))
      if (writes === 2) return jsonResponse({ error: 'Server already advanced', code: 'ATTEMPT_VERSION_CONFLICT' }, 409)
      return jsonResponse({ version: 2, answers: [0] })
    }
  })
  render(h(PracticeQuizPanel, { lesson: { id: 9, title: 'Uncertain write' }, onClose: vi.fn() }))
  await showQuiz()
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn B' }))
  await tickQuizSave()
  await screen.findByText(/Lưu thất bại/)
  await userEvent.click(screen.getByRole('radio', { name: 'Lựa chọn A' }))
  await userEvent.click(screen.getByRole('button', { name: 'Thử lưu lại' }))
  await screen.findByText(/Xung đột phiên bản/)
  assert.equal(writes, 2)
  assert.equal(screen.queryByText(/Đã lưu trên máy chủ/), null)
  await userEvent.click(screen.getByRole('button', { name: 'Lưu câu trả lời hiện tại' }))
  await screen.findByText(/Đã lưu trên máy chủ/)
  assert.equal(writes, 3)
  assert.equal(screen.getByRole('radio', { name: 'Lựa chọn A' }).checked, true)
})
