import { test, assert, act, fireEvent, render, screen, waitFor, userEvent, SessionProvider, MemoryRouter, AppLayout, AccountPage, apiRequest, fetchDocument, App, h, studyJson, studyDeferred, accountUser, AccountSessionControls, renderAccountFixture, renderRealAccount, openAccountPasswords, fillAccountPasswords } from './fixtures.js'

test('account route has no redundant overview breadcrumb and only marks account active', async () => {
  localStorage.setItem('luminaToken', 'test-session')
  globalThis.fetch = async () => new Response(JSON.stringify({ user: { id: 10, name: 'Học viên', email: 'student@example.test', role: 'STUDENT' } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  render(h(MemoryRouter, { initialEntries: ['/account'] }, h(SessionProvider, null, h(AppLayout, null, h(AccountPage)))))

  await screen.findByRole('heading', { name: 'Hồ sơ cá nhân' })
  assert.equal(screen.queryByRole('navigation', { name: 'Đường dẫn' }), null)
  assert.equal(screen.getByRole('link', { name: 'Tài khoản' }).getAttribute('aria-current'), 'page')
  assert.equal(screen.getByRole('link', { name: 'Tổng quan' }).getAttribute('aria-current'), null)
})

for (const channel of ['api', 'document']) for (const replacement of ['same', 'new']) test('account session ignores stale401 ' + channel + ' after ' + replacement + ' credentials', async () => {
  localStorage.setItem('luminaToken', 'fixture-same')
  let identity = accountUser(10)
  const old = studyDeferred()
  globalThis.fetch = async (url) => String(url).endsWith('/api/auth/me') ? studyJson({ user: identity }) : old.promise
  render(h(SessionProvider, null, h(AccountSessionControls)))
  await screen.findByText('Người dùng 10')
  const request = (channel === 'api' ? apiRequest('/api/courses/lessons/77/summary') : fetchDocument(77)).catch((error) => error)
  identity = accountUser(20)
  await userEvent.click(screen.getByRole('button', { name: replacement === 'same' ? 'Install same' : 'Install new' }))
  await screen.findByText('Người dùng 20')
  old.resolve(studyJson({ code: 'SESSION_INVALID', error: 'expired fixture session' }, 401))
  await request
  assert.equal(screen.getByTestId('session-status').textContent, 'authenticated')
  assert.equal(screen.getByTestId('session-name').textContent, 'Người dùng 20')
  assert.equal(localStorage.getItem('luminaToken'), replacement === 'same' ? 'fixture-same' : 'fixture-new')
})

test('account session clears prior identity while replacement credentials are verified', async () => {
  localStorage.setItem('luminaToken', 'fixture-same')
  const next = studyDeferred()
  let reads = 0
  globalThis.fetch = async () => ++reads === 1 ? studyJson({ user: accountUser(10) }) : next.promise
  render(h(SessionProvider, null, h(AccountSessionControls)))
  await screen.findByText('Người dùng 10')
  await userEvent.click(screen.getByRole('button', { name: 'Install same' }))
  assert.equal(screen.getByTestId('session-status').textContent, 'loading')
  assert.equal(screen.getByTestId('session-name').textContent, 'no-user')
  next.resolve(studyJson({ user: accountUser(20) }))
  await screen.findByText('Người dùng 20')
})

for (const channel of ['api', 'document']) test('account session current401 still expires ' + channel, async () => {
  localStorage.setItem('luminaToken', 'fixture-same')
  globalThis.fetch = async (url) => String(url).endsWith('/api/auth/me') ? studyJson({ user: accountUser() }) : studyJson({ code: 'SESSION_INVALID', error: 'expired fixture session' }, 401)
  render(h(SessionProvider, null, h(AccountSessionControls)))
  await screen.findByText('Người dùng 10')
  await act(async () => { await (channel === 'api' ? apiRequest('/api/courses/lessons/77/summary') : fetchDocument(77)).catch(() => {}) })
  assert.equal(screen.getByTestId('session-status').textContent, 'anonymous')
  assert.equal(localStorage.getItem('luminaToken'), null)
})

for (const [role, label] of [['ADMIN','Quản trị viên'],['INSTRUCTOR','Giảng viên'],['STUDENT','Học viên']]) test('account profile prioritizes read-only identity for ' + role, async () => {
  renderAccountFixture(role)
  await screen.findByLabelText('Họ và tên')
  assert.ok(screen.getByRole('heading', { name: 'Thông tin tài khoản' }))
  assert.ok(screen.getByText('user10@example.test'))
  assert.ok(screen.getAllByText(label).length >= 1)
  assert.equal(screen.queryByLabelText('Email'), null)
  assert.equal(screen.queryByLabelText('Mật khẩu hiện tại'), null)
  assert.equal(screen.getByRole('button', { name: 'Mở biểu mẫu đổi mật khẩu' }).getAttribute('aria-expanded'), 'false')
  assert.equal(screen.queryByRole('button', { name: /Google/ }), null)
  assert.equal(document.querySelector('script[src*="accounts.google.com"]'), null)
})

test('account profile validates trimmed2–80 and serializes same-tick saves', async () => {
  const write = studyDeferred()
  const bodies = []
  renderAccountFixture('STUDENT', (url, options) => {
    if (options.method === 'PATCH') { bodies.push(JSON.parse(options.body)); return write.promise }
  })
  const input = await screen.findByLabelText('Họ và tên'), form = input.closest('form')
  for (const value of [' ', ' a ', 'x'.repeat(81)]) {
    fireEvent.change(input, { target: { value } }); fireEvent.submit(form)
    assert.equal(bodies.length, 0)
    assert.equal(input.getAttribute('aria-invalid'), 'true')
  }
  fireEvent.change(input, { target: { value: '  ab  ' } })
  act(() => { fireEvent.submit(form); fireEvent.submit(form) })
  assert.deepEqual(bodies, [{ name: 'ab' }])
  assert.equal(input.readOnly, false)
  write.resolve(studyJson({ user: accountUser(10, 'STUDENT', 'ab') }))
  await screen.findByText(/Đã lưu tên: ab/)
})

for (const next of ['Tên mới hơn', 'Tên đã gửi']) test('account profile preserves edited draft after old normalized response: ' + next, async () => {
  const write = studyDeferred()
  renderAccountFixture('STUDENT', (url, options) => options.method === 'PATCH' ? write.promise : undefined)
  const input = await screen.findByLabelText('Họ và tên')
  fireEvent.change(input, { target: { value: 'Tên đã gửi' } })
  await userEvent.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }))
  fireEvent.change(input, { target: { value: 'tạm thời' } })
  fireEvent.change(input, { target: { value: next } })
  write.resolve(studyJson({ user: accountUser(10, 'STUDENT', 'Tên chuẩn hóa') }))
  await screen.findByText(/Đã lưu tên: Tên chuẩn hóa/)
  await waitFor(() => assert.equal(screen.getByRole('button', { name: 'Lưu hồ sơ' }).disabled, false))
  assert.equal(input.value, next)
})

test('account recovery retains saved outcome and newer draft through real guard503 then GET-only retry', async () => {
  const write = studyDeferred(), verify = studyDeferred()
  let reads = 0, writes = 0
  renderRealAccount((url, options) => {
    if (options.method === 'PATCH') { writes += 1; return write.promise }
    return ++reads === 1 ? studyJson({ user: accountUser() }) : reads === 2 ? verify.promise : studyJson({ user: accountUser(10, 'STUDENT', 'Tên đã lưu') })
  })
  const input = await screen.findByLabelText('Họ và tên')
  fireEvent.change(input, { target: { value: 'Tên đã gửi' } })
  await userEvent.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }))
  fireEvent.change(input, { target: { value: 'Bản nháp mới hơn' } })
  write.resolve(studyJson({ user: accountUser(10, 'STUDENT', 'Tên đã lưu') }))
  await screen.findByText(/Đã lưu tên: Tên đã lưu/)
  assert.equal(screen.getByLabelText('Họ và tên'), input)
  assert.equal(input.readOnly, true)
  verify.resolve(studyJson({ error: 'fixture verification offline' }, 503))
  await screen.findByText('Chưa thể xác minh tài khoản')
  assert.equal(input.value, 'Bản nháp mới hơn')
  assert.equal(screen.getByRole('button', { name: 'Lưu hồ sơ' }).disabled, true)
  assert.equal(screen.queryByLabelText('Mật khẩu hiện tại'), null)
  await userEvent.click(screen.getByRole('button', { name: 'Thử lại xác minh' }))
  await screen.findByRole('group', { name: 'Tên đã lưu, Học viên' })
  assert.equal(input.value, 'Bản nháp mới hơn')
  assert.equal(input.readOnly, false)
  assert.equal(writes, 1); assert.equal(reads, 3)
})

test('account recovery uncertain write keeps draft and checks identity without PATCH replay', async () => {
  let writes = 0, reads = 0
  renderAccountFixture('STUDENT', (url, options) => {
    if (options.method === 'PATCH') { writes += 1; throw new TypeError('fixture network') }
    reads += 1
  })
  const input = await screen.findByLabelText('Họ và tên')
  fireEvent.change(input, { target: { value: 'Giữ bản nháp' } })
  await userEvent.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }))
  await screen.findByText(/Chưa xác định kết quả lưu/)
  assert.equal(input.value, 'Giữ bản nháp')
  assert.equal(input.getAttribute('aria-invalid'), 'false')
  await userEvent.click(screen.getByRole('button', { name: 'Kiểm tra hồ sơ' }))
  await screen.findByText('Thông tin tài khoản đã được xác minh.')
  assert.equal(writes, 1); assert.equal(reads, 2)
})

test('account recovery current verification401 follows normal expiry and never retains account', async () => {
  let reads = 0
  renderRealAccount((url, options) => options.method === 'PATCH' ? studyJson({ user: accountUser() }) : ++reads === 1 ? studyJson({ user: accountUser() }) : studyJson({ code: 'SESSION_INVALID', error: 'fixture revoked' }, 401))
  const input = await screen.findByLabelText('Họ và tên')
  fireEvent.change(input, { target: { value: 'Tên mới' } })
  await userEvent.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }))
  await waitFor(() => assert.equal(window.location.pathname, '/auth'))
  assert.equal(screen.queryByLabelText('Họ và tên'), null)
  assert.equal(localStorage.getItem('luminaToken'), null)
})

test('account recovery startup failure and other protected routes keep full-page guard', async () => {
  const view = renderRealAccount(() => studyJson({ error: 'fixture startup offline' }, 503))
  await screen.findByText('Không thể xác minh tài khoản')
  assert.equal(screen.queryByLabelText('Họ và tên'), null)
  view.unmount()
  localStorage.setItem('luminaToken', 'fixture-same')
  window.history.replaceState(null, '', '/dashboard')
  globalThis.fetch = async () => studyJson({ error: 'fixture dashboard offline' }, 503)
  render(h(App))
  await screen.findByText('Không thể xác minh tài khoản')
  assert.equal(screen.queryByLabelText('Họ và tên'), null)
})

test('account recovery late PATCH after logout cannot write identity cache or navigate', async () => {
  const write = studyDeferred()
  renderRealAccount((url, options) => options.method === 'PATCH' ? write.promise : studyJson({ user: accountUser() }))
  const input = await screen.findByLabelText('Họ và tên')
  fireEvent.change(input, { target: { value: 'Tên cũ đến trễ' } })
  await userEvent.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }))
  await userEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }))
  await waitFor(() => assert.equal(window.location.pathname, '/auth'))
  write.resolve(studyJson({ user: accountUser(10, 'STUDENT', 'Tên cũ đến trễ') }))
  await act(async () => { await new Promise((done) => setTimeout(done, 0)) })
  assert.equal(localStorage.getItem('luminaUser'), null)
  assert.equal(sessionStorage.getItem('luminaUser'), null)
  assert.equal(window.location.pathname, '/auth')
})

test('account password disclosure focuses clears and preserves profile draft', async () => {
  renderAccountFixture()
  const name = await screen.findByLabelText('Họ và tên')
  fireEvent.change(name, { target: { value: 'Nháp hồ sơ' } })
  const current = await openAccountPasswords()
  assert.equal(document.activeElement, current)
  assert.equal(current.autocomplete, 'current-password')
  assert.equal(screen.getByLabelText('Mật khẩu mới').autocomplete, 'new-password')
  assert.equal(screen.getByLabelText('Xác nhận mật khẩu mới').autocomplete, 'new-password')
  fillAccountPasswords()
  const close = screen.getByRole('button', { name: 'Đóng biểu mẫu đổi mật khẩu' })
  close.focus()
  await userEvent.keyboard('{Enter}')
  const trigger = screen.getByRole('button', { name: 'Mở biểu mẫu đổi mật khẩu' })
  assert.equal(document.activeElement, trigger)
  assert.equal(screen.queryByLabelText('Mật khẩu hiện tại'), null)
  await userEvent.keyboard('{Enter}')
  assert.equal(screen.getByLabelText('Mật khẩu hiện tại').value, '')
  assert.equal(screen.getByLabelText('Mật khẩu mới').value, '')
  assert.equal(name.value, 'Nháp hồ sơ')
})

test('account password validates exact boundaries equality and confirmation without sending', async () => {
  let writes = 0
  renderAccountFixture('STUDENT', (url, options) => { if (options.method === 'POST') { writes += 1; return studyJson({ error: 'fixture invalid' }, 400) } })
  await openAccountPasswords()
  for (const [current, next, confirmation, field] of [
    ['', 'new-fixture', 'new-fixture', 'Mật khẩu hiện tại'],
    ['12345', 'new-fixture', 'new-fixture', 'Mật khẩu hiện tại'],
    ['x'.repeat(73), 'new-fixture', 'new-fixture', 'Mật khẩu hiện tại'],
    ['old-fixture', '12345', '12345', 'Mật khẩu mới'],
    ['old-fixture', 'x'.repeat(73), 'x'.repeat(73), 'Mật khẩu mới'],
    ['old-fixture', 'old-fixture', 'old-fixture', 'Mật khẩu mới'],
    ['old-fixture', 'new-fixture', 'different', 'Xác nhận mật khẩu mới'],
  ]) {
    fireEvent.submit(fillAccountPasswords(current, next, confirmation))
    assert.equal(writes, 0)
    assert.equal(screen.getByLabelText(field).getAttribute('aria-invalid'), 'true')
    assert.equal(document.activeElement, screen.getByLabelText(field))
    assert.ok(document.getElementById(screen.getByLabelText(field).getAttribute('aria-describedby').split(' ').at(-1)))
  }
})

test('account password sends untrimmed6 and72 boundaries and prevents duplicate competing actions', async () => {
  const write = studyDeferred(), bodies = []
  renderAccountFixture('STUDENT', (url, options) => { if (options.method === 'POST') { bodies.push(JSON.parse(options.body)); return write.promise } })
  await openAccountPasswords()
  const current = ' 1234 ', next = ' ' + 'x'.repeat(70) + ' '
  const form = fillAccountPasswords(current, next)
  act(() => { fireEvent.submit(form); fireEvent.submit(form) })
  assert.deepEqual(bodies, [{ currentPassword: current, newPassword: next }])
  assert.equal(screen.getByLabelText('Mật khẩu hiện tại').disabled, true)
  assert.equal(screen.getByRole('button', { name: 'Đóng biểu mẫu đổi mật khẩu' }).disabled, true)
  assert.equal(screen.getByRole('button', { name: 'Lưu hồ sơ' }).disabled, true)
  assert.equal(screen.getByLabelText('Họ và tên').readOnly, true)
  write.resolve(studyJson({ error: 'fixture current wrong', code: 'CURRENT_PASSWORD_INVALID' }, 400))
  await screen.findByText('fixture current wrong')
  assert.equal(screen.getByLabelText('Mật khẩu hiện tại').getAttribute('aria-invalid'), 'true')
  assert.equal(screen.getByLabelText('Mật khẩu hiện tại').value, current)
  assert.equal(screen.getByLabelText('Mật khẩu mới').value, next)
})

test('account password profile pending prevents a competing password write', async () => {
  const write = studyDeferred()
  let passwordWrites = 0
  renderAccountFixture('STUDENT', (url, options) => {
    if (options.method === 'PATCH') return write.promise
    if (options.method === 'POST') { passwordWrites += 1; return studyJson({ message: 'fixture changed' }) }
  })
  await openAccountPasswords()
  const form = fillAccountPasswords()
  await userEvent.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }))
  fireEvent.submit(form)
  assert.equal(passwordWrites, 0)
  write.resolve(studyJson({ user: accountUser() }))
  await screen.findByText(/Đã lưu tên:/)
  await waitFor(() => assert.equal(Boolean(screen.queryByLabelText('Mật khẩu hiện tại')), false))
})

for (const failure of ['network', 'server', 'malformed']) test('account password uncertain ' + failure + ' never replays or claims unchanged', async () => {
  let writes = 0, reads = 0
  renderAccountFixture('STUDENT', (url, options) => {
    if (options.method === 'POST') {
      writes += 1
      if (failure === 'network') throw new TypeError('fixture network')
      return failure === 'server' ? studyJson({ error: 'fixture server' }, 503) : studyJson({})
    }
    reads += 1
  })
  await openAccountPasswords()
  fireEvent.submit(fillAccountPasswords())
  await screen.findByText(/Chưa xác định kết quả đổi mật khẩu/)
  assert.equal(screen.getByLabelText('Mật khẩu hiện tại').getAttribute('aria-invalid'), 'false')
  assert.equal(screen.getByLabelText('Mật khẩu mới').value, 'new-fixture')
  assert.equal(screen.getByTestId('session-status').textContent, 'authenticated')
  await userEvent.click(screen.getByRole('button', { name: 'Kiểm tra phiên' }))
  await screen.findByText('Thông tin tài khoản đã được xác minh.')
  assert.equal(screen.queryByLabelText('Mật khẩu hiện tại'), null)
  assert.equal(writes, 1); assert.equal(reads, 2)
})

test('account password confirmed success signs out and explains reauthentication through real App', async () => {
  renderRealAccount((url, options) => options.method === 'POST' ? studyJson({ message: 'fixture changed' }) : studyJson({ user: accountUser() }))
  await openAccountPasswords()
  fireEvent.submit(fillAccountPasswords())
  await waitFor(() => assert.equal(window.location.pathname, '/auth'))
  await screen.findByText('Mật khẩu đã được thay đổi. Hãy đăng nhập bằng mật khẩu mới.')
  assert.equal(screen.queryByLabelText('Mật khẩu hiện tại'), null)
  assert.equal(localStorage.getItem('luminaToken'), null)
  assert.equal(localStorage.getItem('luminaUser'), null)
})

for (const sameIdentity of [true, false]) test('account password stale success cannot sign out replacement credentials sameIdentity=' + sameIdentity, async () => {
  const write = studyDeferred()
  let reads = 0
  renderAccountFixture('STUDENT', (url, options) => options.method === 'POST' ? write.promise : studyJson({ user: ++reads === 1 || sameIdentity ? accountUser() : accountUser(20) }))
  await openAccountPasswords()
  fireEvent.submit(fillAccountPasswords())
  await userEvent.click(screen.getByRole('button', { name: 'Install same' }))
  const name = await screen.findByLabelText('Họ và tên')
  assert.equal(name.value, sameIdentity ? 'Người dùng 10' : 'Người dùng 20')
  assert.equal(screen.queryByLabelText('Mật khẩu hiện tại'), null)
  fireEvent.change(name, { target: { value: 'Bản nháp mới' } })
  write.resolve(studyJson({ message: 'fixture old changed' }))
  await act(async () => { await new Promise((done) => setTimeout(done, 0)) })
  assert.equal(screen.getByTestId('session-status').textContent, 'authenticated')
  assert.equal(name.value, 'Bản nháp mới')
  assert.equal(localStorage.getItem('luminaToken'), 'fixture-same')
})

test('account password values remain form-local and disappear on navigation', async () => {
  renderRealAccount((url) => String(url).endsWith('/api/courses') ? studyJson({ courses: [] }) : studyJson({ user: accountUser() }))
  await openAccountPasswords()
  fillAccountPasswords()
  const serialized = JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage),window.location.href])
  assert.equal(serialized.includes('old-fixture'), false)
  assert.equal(serialized.includes('new-fixture'), false)
  await userEvent.click(screen.getByRole('link', { name: 'Tổng quan' }))
  await waitFor(() => assert.equal(window.location.pathname, '/dashboard'))
  assert.equal(screen.queryByLabelText('Mật khẩu hiện tại'), null)
})

test('account keyboard validates and opens password form without submitting profile and handles long identity', async () => {
  const user = { ...accountUser(), name: 'Tên hiển thị '.repeat(6), email: 'long'.repeat(55) + '@example.test' }
  let writes = 0
  renderAccountFixture('STUDENT', (url, options) => {
    if (options.method) writes += 1
    return studyJson({ user })
  })
  const input = await screen.findByLabelText('Họ và tên')
  assert.ok(screen.getByText(user.email))
  input.focus()
  await userEvent.clear(input)
  await userEvent.type(input, 'a')
  await userEvent.tab()
  assert.equal(document.activeElement, screen.getByRole('button', { name: 'Lưu hồ sơ' }))
  await userEvent.keyboard('{Enter}')
  assert.equal(document.activeElement, input)
  assert.equal(writes, 0)
  await userEvent.tab()
  await userEvent.tab()
  assert.equal(document.activeElement, screen.getByRole('button', { name: 'Mở biểu mẫu đổi mật khẩu' }))
  await userEvent.keyboard('{Enter}')
  assert.equal(document.activeElement, screen.getByLabelText('Mật khẩu hiện tại'))
  await userEvent.tab()
  assert.equal(document.activeElement, screen.getByLabelText('Mật khẩu mới'))
  await userEvent.tab()
  assert.equal(document.activeElement, screen.getByLabelText('Xác nhận mật khẩu mới'))
  assert.equal(writes, 0)
})

test('account profile accepts exact80 name and associates production400 without claiming a save', async () => {
  let body
  renderAccountFixture('STUDENT', (url, options) => {
    if (options.method === 'PATCH') { body = JSON.parse(options.body); return studyJson({ error: 'fixture name rejected' }, 400) }
  })
  const input = await screen.findByLabelText('Họ và tên')
  const name = 'x'.repeat(80)
  fireEvent.change(input, { target: { value: '  ' + name + '  ' } })
  await userEvent.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }))
  await screen.findByText('fixture name rejected')
  assert.deepEqual(body, { name })
  assert.equal(input.value, '  ' + name + '  ')
  assert.equal(input.getAttribute('aria-invalid'), 'true')
  assert.equal(screen.queryByText(/Đã lưu tên:/), null)
})

test('account session late identity success after logout cannot restore user or cache', async () => {
  localStorage.setItem('luminaToken', 'fixture-same')
  const read = studyDeferred()
  globalThis.fetch = async () => read.promise
  render(h(SessionProvider, null, h(AccountSessionControls)))
  await userEvent.click(screen.getByRole('button', { name: 'Fixture logout' }))
  read.resolve(studyJson({ user: accountUser() }))
  await act(async () => { await new Promise((done) => setTimeout(done, 0)) })
  assert.equal(screen.getByTestId('session-status').textContent, 'anonymous')
  assert.equal(screen.getByTestId('session-name').textContent, 'no-user')
  assert.equal(localStorage.getItem('luminaUser'), null)
})

for (const sameIdentity of [true, false]) test('account profile stale PATCH preserves replacement draft sameIdentity=' + sameIdentity, async () => {
  const write = studyDeferred()
  let reads = 0
  renderAccountFixture('STUDENT', (url, options) => options.method === 'PATCH' ? write.promise : studyJson({ user: ++reads === 1 || sameIdentity ? accountUser() : accountUser(20) }))
  let input = await screen.findByLabelText('Họ và tên')
  fireEvent.change(input, { target: { value: 'Nháp cũ' } })
  await userEvent.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }))
  await userEvent.click(screen.getByRole('button', { name: 'Install same' }))
  input = await screen.findByLabelText('Họ và tên')
  fireEvent.change(input, { target: { value: 'Nháp mới' } })
  write.resolve(studyJson({ user: accountUser(10, 'STUDENT', 'Kết quả cũ') }))
  await act(async () => { await new Promise((done) => setTimeout(done, 0)) })
  assert.equal(input.value, 'Nháp mới')
  assert.equal(reads, 2)
  assert.equal(screen.queryByText(/Đã lưu tên:/), null)
  assert.equal(JSON.parse(localStorage.getItem('luminaUser')).name, sameIdentity ? 'Người dùng 10' : 'Người dùng 20')
})

test('account password expired session during uncertain recovery clears secrets and shows expiry notice', async () => {
  let reads = 0, writes = 0
  renderRealAccount((url, options) => {
    if (options.method === 'POST') { writes += 1; throw new TypeError('fixture connection lost') }
    return ++reads === 1 ? studyJson({ user: accountUser() }) : studyJson({ error: 'fixture expired', code: 'SESSION_INVALID' }, 401)
  })
  await openAccountPasswords()
  fireEvent.submit(fillAccountPasswords())
  await screen.findByText(/Chưa xác định kết quả đổi mật khẩu/)
  await userEvent.click(screen.getByRole('button', { name: 'Kiểm tra phiên' }))
  await screen.findByText('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  assert.equal(writes, 1)
  assert.equal(screen.queryByLabelText('Mật khẩu hiện tại'), null)
  assert.equal(screen.queryByText('Mật khẩu đã được thay đổi. Hãy đăng nhập bằng mật khẩu mới.'), null)
})

test('account password late success after leaving account cannot sign out dashboard', async () => {
  const write = studyDeferred()
  renderRealAccount((url, options) => options.method === 'POST' ? write.promise : url.endsWith('/api/courses') ? studyJson({ courses: [] }) : studyJson({ user: accountUser() }))
  await openAccountPasswords()
  fireEvent.submit(fillAccountPasswords())
  await userEvent.click(screen.getByRole('link', { name: 'Tổng quan' }))
  await waitFor(() => assert.equal(window.location.pathname, '/dashboard'))
  write.resolve(studyJson({ message: 'fixture old changed' }))
  await act(async () => { await new Promise((done) => setTimeout(done, 0)) })
  assert.equal(window.location.pathname, '/dashboard')
  assert.equal(localStorage.getItem('luminaToken'), 'fixture-same')
})

test('account ADMIN retains own-account access and is forbidden from course content', async () => {
  renderRealAccount(() => studyJson({ user: accountUser(10, 'ADMIN') }))
  await screen.findByLabelText('Họ và tên')
  assert.ok(screen.getByRole('link', { name: 'Quản trị' }))
  act(() => { window.history.pushState(null, '', '/courses/1'); window.dispatchEvent(new PopStateEvent('popstate')) })
  await screen.findByRole('heading', { name: 'Không có quyền truy cập' })
  assert.equal(screen.queryByLabelText('Họ và tên'), null)
})

test('account profile draft and password disclosure end on account route roundtrip', async () => {
  renderRealAccount((url) => url.endsWith('/api/courses') ? studyJson({ courses: [] }) : studyJson({ user: accountUser() }))
  const input = await screen.findByLabelText('Họ và tên')
  fireEvent.change(input, { target: { value: 'Nháp chỉ trên trang này' } })
  await openAccountPasswords()
  fillAccountPasswords()
  await userEvent.click(screen.getByRole('link', { name: 'Tổng quan' }))
  await waitFor(() => assert.equal(window.location.pathname, '/dashboard'))
  await userEvent.click(screen.getByRole('link', { name: 'Tài khoản' }))
  assert.equal((await screen.findByLabelText('Họ và tên')).value, 'Người dùng 10')
  assert.equal(screen.getByRole('button', { name: 'Mở biểu mẫu đổi mật khẩu' }).getAttribute('aria-expanded'), 'false')
  assert.equal(screen.queryByLabelText('Mật khẩu hiện tại'), null)
})

test('account password production validation error stays separate from current-password field', async () => {
  renderAccountFixture('STUDENT', (url, options) => options.method === 'POST' ? studyJson({ error: 'fixture operation rejected' }, 400) : undefined)
  await openAccountPasswords()
  fireEvent.submit(fillAccountPasswords())
  await screen.findByText('fixture operation rejected')
  assert.equal(screen.getByLabelText('Mật khẩu hiện tại').getAttribute('aria-invalid'), 'false')
  assert.equal(screen.getByLabelText('Mật khẩu mới').getAttribute('aria-invalid'), 'false')
  assert.equal(screen.getByLabelText('Mật khẩu hiện tại').value, 'old-fixture')
})
