import { test, vi, assert, act, fireEvent, render, screen, waitFor, within, userEvent, SessionProvider, MemoryRouter, Route, Routes, CourseWorkspacePage, AssignmentsPanel, assignmentId, filterAssignments, orderAssignments, studentAssignmentState, assignmentFixture, submissionFixture, AssignmentHarness, assignmentChoice, AssignmentHistory, h, jsonResponse, dialogTestSupport, workspaceCourse } from './fixtures.js'

test('assignment workspace prioritizes work, searches body and retains selected detail outside filters', async () => {
  render(h(AssignmentHarness, { assignments: [assignmentFixture(1, { title: 'Quá hạn', dueAt: '2020-01-01' }), assignmentFixture(2, { title: 'Cần làm', description: 'Tìm từ khóa DATABASE' }), assignmentFixture(3, { title: 'Đã chấm', submissions: [submissionFixture(3, { grade: 0 })] })] }))
  const list = screen.getByRole('region', { name: 'Danh sách bài tập' })
  assert.equal(within(list).getAllByRole('button', { name: /Mở bài tập/ })[0].textContent.includes('Cần làm'), true)
  assert.ok(screen.getByRole('heading', { name: 'Cần làm' }))
  fireEvent.change(screen.getByLabelText('Tìm bài tập'), { target: { value: 'database' } })
  assert.equal(within(list).getAllByRole('button', { name: /Mở bài tập/ }).length, 1)
  fireEvent.change(screen.getByLabelText('Tìm bài tập'), { target: { value: 'không khớp' } })
  assert.ok(screen.getByText('Không có bài tập phù hợp'))
  assert.ok(screen.getByRole('heading', { name: 'Cần làm' }))
  assert.ok(screen.getByText(/Bài đang xem nằm ngoài bộ lọc/))
  fireEvent.click(screen.getByRole('button', { name: 'Bỏ tìm kiếm và bộ lọc' }))
  assert.equal(within(list).getAllByRole('button', { name: /Mở bài tập/ }).length, 3)
})

test('assignment workspace retains student draft through selection, collapse, failure and refresh', async () => {
  const assignments = [assignmentFixture(1), assignmentFixture(2)]
  let writes = 0
  globalThis.fetch = async (_url, options = {}) => options.method === 'PUT' ? (writes++, jsonResponse({ error: 'Không lưu được' }, 503)) : jsonResponse({ course: { assignments } })
  render(h(AssignmentHarness, { assignments }))
  assert.equal(screen.queryByLabelText('Bài làm'), null)
  fireEvent.click(screen.getByRole('button', { name: 'Viết bài làm' }))
  fireEvent.change(screen.getByLabelText('Bài làm'), { target: { value: 'Draft của bài một' } })
  fireEvent.click(assignmentChoice('Bài 2'))
  fireEvent.click(assignmentChoice('Bài 1'))
  assert.equal(screen.getByLabelText('Bài làm').value, 'Draft của bài một')
  fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }))
  await screen.findByText(/Không lưu được/)
  fireEvent.click(screen.getByRole('button', { name: 'Tải lại bài tập' }))
  await screen.findByText('Đã tải lại bài tập.')
  assert.equal(screen.getByLabelText('Bài làm').value, 'Draft của bài một')
  assert.equal(writes, 1)
})

test('assignment workspace preserves independent grading responses and the other selected draft', async () => {
  const requests = new Map()
  globalThis.fetch = (url, options) => new Promise((resolve) => requests.set(String(url), { resolve, body: JSON.parse(options.body) }))
  render(h(AssignmentHarness, { isInstructor: true, assignments: [assignmentFixture(1, { submissions: [submissionFixture(1)] }), assignmentFixture(2, { submissions: [submissionFixture(2)] })] }))
  fireEvent.change(screen.getByLabelText('Điểm'), { target: { value: '0' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu chấm bài' }))
  fireEvent.click(assignmentChoice('Bài 2'))
  fireEvent.change(screen.getByLabelText('Điểm'), { target: { value: '2' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu chấm bài' }))
  assert.equal(requests.size, 2)
  const entries = [...requests.values()]
  assert.equal(entries[0].body.grade, 0)
  await act(async () => entries[1].resolve(jsonResponse({ submission: { ...submissionFixture(2), grade: 2, student: undefined } })))
  await act(async () => entries[0].resolve(jsonResponse({ submission: { ...submissionFixture(1), grade: 0, student: undefined } })))
  assert.ok(screen.getByRole('heading', { name: 'Bài 2' }))
  assert.equal(screen.getByLabelText('Điểm').value, '2')
  fireEvent.click(assignmentChoice('Bài 1'))
  assert.equal(screen.getByLabelText('Điểm').value, '0')
  assert.ok(screen.getByRole('heading', { name: 'Người học 1' }))
})

test('assignment workspace blank grade is explicit null and fractional grades are rejected', async () => {
  const writes = []
  globalThis.fetch = async (_url, options) => { const body = JSON.parse(options.body); writes.push(body); return jsonResponse({ submission: { ...submissionFixture(1), ...body } }) }
  render(h(AssignmentHarness, { isInstructor: true, assignments: [assignmentFixture(1, { submissions: [submissionFixture(1)] })] }))
  fireEvent.change(screen.getByLabelText('Nhận xét'), { target: { value: 'Chỉ nhận xét' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu chấm bài' }))
  await screen.findByText(/Đã lưu nhận xét cho/)
  assert.equal(writes[0].grade, null)
  fireEvent.change(screen.getByLabelText('Điểm'), { target: { value: '1.5' } })
  fireEvent.submit(screen.getByLabelText('Điểm').closest('form'))
  assert.ok(screen.getByText(/Điểm phải là số nguyên/))
  assert.equal(writes.length, 1)
})

test('assignment workspace discards stale refresh after a confirmed grade write', async () => {
  const assignments = [assignmentFixture(1, { submissions: [submissionFixture(1)] })]
  let resolveRead
  globalThis.fetch = (_url, options = {}) => options.method === 'PATCH' ? Promise.resolve(jsonResponse({ submission: { ...submissionFixture(1), grade: 0 } })) : new Promise((resolve) => { resolveRead = resolve })
  render(h(AssignmentHarness, { isInstructor: true, assignments }))
  fireEvent.click(screen.getByRole('button', { name: 'Tải lại bài tập' }))
  fireEvent.change(screen.getByLabelText('Điểm'), { target: { value: '0' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu chấm bài' }))
  await screen.findByText(/Đã lưu điểm và nhận xét cho/)
  await act(async () => resolveRead(jsonResponse({ course: { assignments } })))
  assert.equal(screen.getByLabelText('Điểm').value, '0')
})

test('assignment workspace forms collapse with focus, preserve error draft and prevent duplicate creation', async () => {
  let resolveWrite; let calls = 0
  globalThis.fetch = () => { calls++; return new Promise((resolve) => { resolveWrite = resolve }) }
  const user = userEvent.setup()
  render(h(AssignmentHarness, { isInstructor: true, assignments: [assignmentFixture(1)] }))
  const trigger = screen.getByRole('button', { name: 'Giao bài tập mới' })
  assert.equal(screen.queryByLabelText('Tiêu đề'), null)
  await user.click(trigger)
  assert.equal(document.activeElement, screen.getByLabelText('Tiêu đề'))
  fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Bài mới' } })
  fireEvent.change(screen.getByLabelText('Yêu cầu'), { target: { value: 'Yêu cầu mới' } })
  await user.keyboard('{Escape}')
  assert.equal(document.activeElement, trigger)
  await user.click(trigger)
  assert.equal(screen.getByLabelText('Tiêu đề').value, 'Bài mới')
  const form = screen.getByLabelText('Tiêu đề').closest('form')
  fireEvent.submit(form); fireEvent.submit(form)
  assert.equal(calls, 1)
  assert.equal(screen.getByLabelText('Tiêu đề').disabled, true)
  await act(async () => resolveWrite(jsonResponse({ error: 'Tạo thất bại' }, 503)))
  assert.equal(screen.getByLabelText('Tiêu đề').value, 'Bài mới')
  assert.ok(screen.getByText(/Tạo thất bại/))
})

test('assignment workspace delete dialog cancel restores focus and sends no write', async () => {
  dialogTestSupport()
  let calls = 0; globalThis.fetch = async () => { calls++; return jsonResponse({}) }
  const user = userEvent.setup()
  render(h(AssignmentHarness, { isInstructor: true, assignments: [assignmentFixture(1)] }))
  const trigger = screen.getByRole('button', { name: 'Xóa bài tập' })
  await user.click(trigger)
  const dialog = screen.getByRole('dialog')
  fireEvent.keyDown(dialog, { key: 'Escape' })
  await waitFor(() => assert.equal(screen.queryByRole('dialog'), null))
  assert.equal(document.activeElement, trigger)
  assert.equal(calls, 0)
})

test('assignment workspace explicit invalid selection never silently opens another assignment', () => {
  render(h(AssignmentsPanel, { course: { id: 4, assignments: [assignmentFixture(1)] }, isInstructor: false, selectedAssignmentId: 'bad' }))
  assert.ok(screen.getByText('Không tìm thấy bài tập đã chọn'))
  assert.equal(screen.queryByRole('heading', { name: 'Bài 1' }), null)
})

test('assignment workspace status and stable ordering distinguish grade zero, feedback only and missing data', () => {
  const now = new Date('2026-06-01').getTime()
  const items = [assignmentFixture(1, { dueAt: '2020-01-01' }), assignmentFixture(2, { dueAt: null }), assignmentFixture(3, { dueAt: '2099-01-01' }), assignmentFixture(4, { submissions: [submissionFixture(4, { feedback: 'Nhận xét' })] }), assignmentFixture(5, { submissions: [submissionFixture(5, { grade: 0 })] })]
  assert.deepEqual(orderAssignments(items, false, now).map((item) => item.id), [3, 2, 4, 5, 1])
  assert.equal(studentAssignmentState(items[4], now), 'graded')
  assert.equal(studentAssignmentState({ ...items[4], submissions: undefined }, now), 'unknown')
  assert.deepEqual(filterAssignments(items, { query: '', filter: 'submitted', isInstructor: false, now }).map((item) => item.id), [4, 5])
  assert.deepEqual(orderAssignments(items, true, now).map((item) => item.id)[0], 4)
  assert.equal(assignmentId('1e2'), null); assert.equal(assignmentId('0'), null); assert.equal(assignmentId('NaN'), null); assert.equal(assignmentId('4'), 4)
})

test('assignment workspace student duplicate submit sends trimmed content and resets only confirmed target', async () => {
  let resolveWrite; const writes = []
  globalThis.fetch = (_url, options) => { writes.push(JSON.parse(options.body)); return new Promise((resolve) => { resolveWrite = resolve }) }
  render(h(AssignmentHarness, { assignments: [assignmentFixture(1), assignmentFixture(2)] }))
  fireEvent.click(screen.getByRole('button', { name: 'Viết bài làm' }))
  const field = screen.getByLabelText('Bài làm')
  fireEvent.change(field, { target: { value: '  Bài làm A  ' } })
  fireEvent.submit(field.closest('form')); fireEvent.submit(field.closest('form'))
  assert.equal(writes.length, 1); assert.equal(writes[0].content, 'Bài làm A')
  fireEvent.click(assignmentChoice('Bài 2'))
  fireEvent.click(screen.getByRole('button', { name: 'Viết bài làm' }))
  fireEvent.change(screen.getByLabelText('Bài làm'), { target: { value: 'Draft B' } })
  await act(async () => resolveWrite(jsonResponse({ submission: { ...submissionFixture(1), content: 'Bài làm A' } })))
  assert.equal(screen.getByLabelText('Bài làm').value, 'Draft B')
  fireEvent.click(assignmentChoice('Bài 1'))
  assert.ok(screen.getByText('Bài làm A'))
  assert.equal(screen.queryByLabelText('Bài làm cập nhật'), null)
})

test('assignment workspace instructor retains submission drafts when filter hides selection and guards foreign ids', () => {
  const assignment = assignmentFixture(1, { submissions: [submissionFixture(1), submissionFixture(2, { grade: 0 })] })
  const view = render(h(AssignmentsPanel, { course: { id: 4, assignments: [assignment] }, isInstructor: true }))
  fireEvent.change(screen.getByLabelText('Nhận xét'), { target: { value: 'Draft của một' } })
  fireEvent.click(screen.getByRole('button', { name: 'Xem bài nộp của Người học 2' }))
  assert.equal(screen.getByLabelText('Điểm').value, '0')
  fireEvent.click(screen.getByRole('button', { name: 'Xem bài nộp của Người học 1' }))
  fireEvent.change(screen.getByLabelText('Trạng thái bài tập'), { target: { value: 'graded' } })
  assert.equal(screen.getByLabelText('Nhận xét').value, 'Draft của một')
  assert.ok(screen.getByText(/Bài nộp đang xem nằm ngoài bộ lọc/))
  view.rerender(h(AssignmentsPanel, { course: { id: 4, assignments: [assignment] }, isInstructor: true, selectedAssignmentId: '1', selectedSubmissionId: '999' }))
  assert.ok(screen.getByText('Không tìm thấy bài nộp đã chọn'))
  assert.equal(screen.queryByLabelText('Điểm'), null)
})

test('assignment workspace refresh error keeps draft and overlapping refresh only accepts newest data', async () => {
  const assignments = [assignmentFixture(1)]
  const reads = []
  globalThis.fetch = () => new Promise((resolve) => reads.push(resolve))
  render(h(AssignmentHarness, { assignments }))
  fireEvent.click(screen.getByRole('button', { name: 'Viết bài làm' }))
  fireEvent.change(screen.getByLabelText('Bài làm'), { target: { value: 'Không được mất' } })
  fireEvent.click(screen.getByRole('button', { name: 'Tải lại bài tập' }))
  await act(async () => reads[0](jsonResponse({ error: 'Không kết nối' }, 503)))
  assert.ok(screen.getByText('Không tải lại được bài tập'))
  assert.equal(screen.getByLabelText('Bài làm').value, 'Không được mất')
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  fireEvent.click(screen.getByRole('button', { name: 'Đang tải lại…' }))
  await act(async () => reads[2](jsonResponse({ course: { assignments: [assignmentFixture(1, { title: 'Dữ liệu mới nhất' })] } })))
  await act(async () => reads[1](jsonResponse({ course: { assignments: [assignmentFixture(1, { title: 'Dữ liệu cũ' })] } })))
  assert.ok(screen.getByRole('heading', { name: 'Dữ liệu mới nhất' }))
  assert.equal(screen.getByLabelText('Bài làm').value, 'Không được mất')
})

test('assignment workspace edit merges scalar response without losing submissions or student identity', async () => {
  let payload
  globalThis.fetch = async (_url, options) => { payload = JSON.parse(options.body); return jsonResponse({ assignment: { id: 1, ...payload } }) }
  render(h(AssignmentHarness, { isInstructor: true, assignments: [assignmentFixture(1, { submissions: [submissionFixture(1)] })] }))
  fireEvent.click(screen.getByRole('button', { name: 'Sửa bài tập' }))
  fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: '  Bài cập nhật  ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu bài tập' }))
  await screen.findByRole('heading', { name: 'Bài cập nhật' })
  assert.equal(payload.title, 'Bài cập nhật')
  assert.ok(screen.getByRole('heading', { name: 'Người học 1' }))
  assert.ok(screen.getByText('Nội dung đã nộp 1'))
})

test('assignment workspace course replacement ignores late write and its notices', async () => {
  let resolveWrite; let changes = 0
  globalThis.fetch = () => new Promise((resolve) => { resolveWrite = resolve })
  const view = render(h(AssignmentsPanel, { course: { id: 4, assignments: [assignmentFixture(1, { submissions: [submissionFixture(1)] })] }, isInstructor: true, onAssignmentsChange: () => { changes++ } }))
  fireEvent.click(screen.getByRole('button', { name: 'Lưu chấm bài' }))
  view.rerender(h(AssignmentsPanel, { course: { id: 5, assignments: [assignmentFixture(2)] }, isInstructor: false }))
  await act(async () => resolveWrite(jsonResponse({ submission: { ...submissionFixture(1), grade: 0 } })))
  assert.equal(changes, 0)
  assert.ok(screen.getByRole('heading', { name: 'Bài 2' }))
  assert.equal(screen.queryByText(/Đã lưu nhận xét cho/), null)
})

test('assignment workspace deadline props and focus retain submitted feedback and grade zero', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-06-01T10:00:00.000Z'))
  const item = assignmentFixture(1, { dueAt: '2026-06-01T10:01:00.000Z' })
  const view = render(h(AssignmentsPanel, { course: { id: 4, assignments: [item] }, isInstructor: false }))
  fireEvent.click(screen.getByRole('button', { name: 'Viết bài làm' }))
  fireEvent.change(screen.getByLabelText('Bài làm'), { target: { value: 'Draft trước hạn' } })
  vi.setSystemTime(new Date('2026-06-01T10:02:00.000Z'))
  act(() => window.dispatchEvent(new Event('focus')))
  assert.equal(screen.queryByLabelText('Bài làm'), null)
  view.rerender(h(AssignmentsPanel, { course: { id: 4, assignments: [{ ...item, dueAt: null }] }, isInstructor: false }))
  assert.equal(screen.getByLabelText('Bài làm').value, 'Draft trước hạn')
  view.rerender(h(AssignmentsPanel, { course: { id: 4, assignments: [{ ...item, submissions: [submissionFixture(1, { grade: 0, feedback: 'Nhận xét sau hạn' })] }] }, isInstructor: false }))
  assert.ok(screen.getByText('0/10')); assert.ok(screen.getByText('Nhận xét sau hạn'))
  assert.equal(screen.queryByLabelText('Bài làm cập nhật'), null)
})

test('assignment workspace course URL deep link and back-forward preserve exact assignment selection', async () => {
  localStorage.setItem('luminaToken', 'component-test-session')
  globalThis.fetch = async (url) => String(url).endsWith('/me') ? jsonResponse({ user: { id: 7, name: 'Học viên thử', role: 'STUDENT' } }) : jsonResponse({ course: { ...workspaceCourse(), assignments: [assignmentFixture(1), assignmentFixture(2)] } })
  render(h(MemoryRouter, { initialEntries: ['/courses/4?section=assignments&assignmentId=2&keep=value'] }, h(SessionProvider, null, h(Routes, null, h(Route, { path: '/courses/:courseId', element: h(CourseWorkspacePage) })), h(AssignmentHistory))))
  await screen.findByRole('heading', { name: 'Bài 2' })
  fireEvent.click(assignmentChoice('Bài 1'))
  await screen.findByRole('heading', { name: 'Bài 1' })
  assert.ok(screen.getByLabelText('Địa chỉ kiểm tra').textContent.includes('assignmentId=1&keep=value'))
  fireEvent.click(screen.getByRole('button', { name: 'Quay lại kiểm tra' }))
  await screen.findByRole('heading', { name: 'Bài 2' })
  fireEvent.click(screen.getByRole('button', { name: 'Tiến tới kiểm tra' }))
  await screen.findByRole('heading', { name: 'Bài 1' })
})

test('assignment workspace long content is fully readable without claiming layout evidence', () => {
  const description = 'D'.repeat(20000); const content = 'C'.repeat(20000); const feedback = 'F'.repeat(5000)
  render(h(AssignmentsPanel, { course: { id: 4, assignments: [assignmentFixture(1, { title: 'T'.repeat(160), description, submissions: [submissionFixture(1, { content, feedback })] })] }, isInstructor: false }))
  assert.equal(screen.getByRole('region', { name: 'Yêu cầu đầy đủ' }).textContent, description)
  assert.equal(screen.getByRole('region', { name: 'Bài đã nộp' }).textContent, content)
  assert.ok(screen.getByText(feedback))
})

test('assignment workspace creation validates before requests and confirmed success collapses with focus', async () => {
  const writes = []
  globalThis.fetch = async (_url, options) => { const body = JSON.parse(options.body); writes.push(body); return jsonResponse({ assignment: assignmentFixture(8, { ...body, submissions: [] }) }, 201) }
  const user = userEvent.setup()
  render(h(AssignmentHarness, { isInstructor: true, assignments: [assignmentFixture(1)] }))
  const trigger = screen.getByRole('button', { name: 'Giao bài tập mới' })
  await user.click(trigger)
  fireEvent.submit(screen.getByLabelText('Tiêu đề').closest('form'))
  assert.ok(screen.getByText('Tiêu đề phải từ 3 đến 160 ký tự.')); assert.equal(writes.length, 0)
  fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: '  Bài mới hợp lệ  ' } })
  fireEvent.change(screen.getByLabelText('Yêu cầu'), { target: { value: '  Yêu cầu đầy đủ  ' } })
  fireEvent.change(screen.getByLabelText('Điểm tối đa'), { target: { value: '1.5' } })
  fireEvent.submit(screen.getByLabelText('Tiêu đề').closest('form'))
  assert.ok(screen.getByText('Điểm tối đa phải là số nguyên từ 1 đến 1000.')); assert.equal(writes.length, 0)
  fireEvent.change(screen.getByLabelText('Điểm tối đa'), { target: { value: '10' } })
  await user.click(screen.getByRole('button', { name: 'Giao bài tập' }))
  await waitFor(() => assert.equal(screen.queryByLabelText('Tiêu đề'), null))
  assert.equal(document.activeElement, trigger)
  assert.equal(writes[0].title, 'Bài mới hợp lệ'); assert.equal(writes[0].description, 'Yêu cầu đầy đủ'); assert.equal(writes[0].dueAt, null)
  assert.ok(assignmentChoice('Bài mới hợp lệ'))
  await user.click(trigger)
  assert.equal(screen.getByLabelText('Tiêu đề').value, '')
})

test('assignment workspace refresh is blocked while saving and conflict keeps the correct submission context', async () => {
  let resolveWrite; const methods = []
  globalThis.fetch = (_url, options = {}) => { methods.push(options.method || 'GET'); return new Promise((resolve) => { resolveWrite = resolve }) }
  render(h(AssignmentHarness, { isInstructor: true, assignments: [assignmentFixture(1, { submissions: [submissionFixture(1)] }), assignmentFixture(2, { submissions: [submissionFixture(2)] })] }))
  fireEvent.change(screen.getByLabelText('Nhận xét'), { target: { value: 'Draft của A' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu chấm bài' }))
  const refresh = screen.getByRole('button', { name: 'Tải lại bài tập' })
  assert.equal(refresh.disabled, true); fireEvent.click(refresh)
  fireEvent.click(assignmentChoice('Bài 2'))
  fireEvent.change(screen.getByLabelText('Nhận xét'), { target: { value: 'Draft của B' } })
  await act(async () => resolveWrite(jsonResponse({ error: 'Bài nộp vừa thay đổi' }, 409)))
  assert.deepEqual(methods, ['PATCH'])
  assert.equal(screen.getByLabelText('Nhận xét').value, 'Draft của B')
  assert.ok(screen.getByText(/Người học 1 · Bài 1: Bài nộp vừa thay đổi/))
  fireEvent.click(assignmentChoice('Bài 1'))
  assert.equal(screen.getByLabelText('Nhận xét').value, 'Draft của A')
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
