import { test, assert, act, fireEvent, screen, validateEntry, validateReset, apiRequest, resolvePostLoginDestination, entryRender, entryFill, resetFill, entrySubmit, jsonResponse, studyDeferred } from './fixtures.js'

test('API requests use same-origin paths for the Vite Docker proxy by default', async () => {
  let requested
  globalThis.fetch = async (url) => { requested = String(url); return jsonResponse({ status: 'ok' }) }
  const result = await apiRequest('/api/health')
  assert.equal(requested, '/api/health')
  assert.equal(result.status, 'ok')
})

test('entry validators match normalized production boundaries without trimming passwords', () => {
  assert.deepEqual(validateEntry('register', { name: '  AB  ', email: '  USER@example.test ', password: '      ' }), {})
  assert.ok(validateEntry('register', { name: 'x'.repeat(81), email: 'bad', password: '12345' }).name)
  assert.equal(validateEntry('login', { email: 'x'.repeat(260) + '@example.test', password: 'x'.repeat(72) }).email, undefined)
  assert.ok(validateEntry('login', { email: 'valid@example.test', password: 'x'.repeat(73) }).password)
  assert.ok(validateReset('12345', '12345').password)
  assert.ok(validateReset(' rawpw ', 'rawpw').confirmation)
})

test('entry safe destination rejects router-equivalent auth/reset trailing slashes and hostile destinations', () => {
  for (const path of ['/auth/', '/AUTH/', '/reset-password/', '//evil.test', '/\\evil.test']) assert.equal(resolvePostLoginDestination(path, 'STUDENT'), '/dashboard')
  assert.equal(resolvePostLoginDestination('/courses/3?section=lessons&lessonId=2#read', 'STUDENT'), '/courses/3?section=lessons&lessonId=2#read')
  assert.equal(resolvePostLoginDestination('/ADMIN/', 'STUDENT'), '/dashboard')
  assert.equal(resolvePostLoginDestination('/account/', 'ADMIN'), '/account/')
})

test('entry validation associates errors, focuses first invalid field and sends nothing', async () => {
  let requests = 0; globalThis.fetch = async () => { requests++; return jsonResponse({}) }
  entryRender(); entrySubmit()
  assert.equal(requests, 0)
  const email = document.querySelector('#email')
  assert.equal(email.getAttribute('aria-invalid'), 'true')
  assert.ok(document.getElementById(email.getAttribute('aria-describedby')))
  assert.equal(document.activeElement, email)
})

test('entry modes preserve nonsecret drafts and return state, clear secrets and follow back forward', async () => {
  entryRender('/auth', { from: '/courses/3?section=lessons' }); entryFill()
  fireEvent.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }))
  fireEvent.click(screen.getByRole('button', { name: 'Đăng ký ngay' }))
  assert.equal(document.querySelector('#email').value, 'fixture@example.test')
  assert.equal(document.querySelector('#password').value, '')
  assert.equal(document.querySelector('#password').type, 'password')
  assert.equal(screen.queryByRole('button', { name: 'Quản trị viên' }), null)
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
  fireEvent.click(screen.getByRole('button', { name: 'Quên mật khẩu?' }))
  assert.ok(screen.getByRole('heading', { name: 'Quên mật khẩu' }))
  fireEvent.click(screen.getByRole('button', { name: 'Test back' }))
  await screen.findByRole('heading', { name: 'Đăng nhập' })
  fireEvent.click(screen.getByRole('button', { name: 'Test forward' }))
  await screen.findByRole('heading', { name: 'Quên mật khẩu' })
})

test('entry immediate gate blocks duplicate writes and delayed departure cannot install credentials', async () => {
  const deferred = studyDeferred(); let writes = 0
  globalThis.fetch = async () => { writes++; return deferred.promise }
  entryRender(); entryFill(); entrySubmit(); entrySubmit()
  assert.equal(writes, 1)
  assert.equal(screen.getByRole('button', { name: 'Quên mật khẩu?' }).disabled, true)
  assert.equal(document.querySelector('#email').disabled, true)
  fireEvent.click(screen.getByRole('button', { name: 'Test depart' }))
  await act(async () => deferred.resolve(jsonResponse({ token: 'obsolete-fixture' })))
  assert.equal(localStorage.getItem('luminaToken'), null)
  assert.ok(screen.getByText('/elsewhere'))
})

for (const kind of ['login', 'register']) test(`entry ${kind} confirmed before failed verification retries GET only and keeps intended destination`, async () => {
  let posts = 0, reads = 0
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === 'POST') { posts++; return jsonResponse({ token: 'verified-entry-fixture' }) }
    if (String(url).endsWith('/me')) { reads++; return reads === 1 ? jsonResponse({ error: 'Verification unavailable' }, 503) : jsonResponse({ user: { id: 9, role: 'STUDENT' } }) }
    throw new Error('Unexpected fixture request')
  }
  entryRender('/auth', { from: '/courses/3?section=lessons&lessonId=2' })
  if (kind === 'register') { fireEvent.click(screen.getByRole('button', { name: 'Đăng ký ngay' })); fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: '  Fixture Learner  ' } }) }
  entryFill(); entrySubmit()
  await screen.findByText('Chưa thể xác minh phiên đăng nhập')
  assert.ok(screen.getByText(kind === 'register' ? 'Tài khoản đã được tạo.' : 'Thông tin đăng nhập đã được chấp nhận.'))
  assert.equal(document.querySelector('#password'), null)
  fireEvent.click(screen.getByRole('button', { name: 'Thử xác minh lại' }))
  await screen.findByText('/courses/3?section=lessons&lessonId=2')
  assert.equal(posts, 1); assert.equal(reads, 2)
})

test('entry stale success and wrong credentials cannot replace a newer verified session', async () => {
  const old = studyDeferred()
  globalThis.fetch = async (url, options = {}) => options.method === 'POST' ? old.promise : jsonResponse({ user: { id: 12, role: 'ADMIN' } })
  entryRender(); entryFill(); entrySubmit()
  fireEvent.click(screen.getByRole('button', { name: 'Test replace session' }))
  await screen.findByText('/admin')
  await act(async () => old.resolve(jsonResponse({ token: 'obsolete-entry-fixture' })))
  assert.equal(localStorage.getItem('luminaToken'), 'replacement-fixture')
  assert.ok(screen.getByText('/admin'))
})

test('entry registration preserves normalized payload, role and raw password;409 retains useful draft', async () => {
  let payload
  globalThis.fetch = async (_url, options) => { payload = JSON.parse(options.body); return jsonResponse({ error: 'Email đã được sử dụng' }, 409) }
  entryRender(); fireEvent.click(screen.getByRole('button', { name: 'Đăng ký ngay' }))
  fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: '  Fixture Instructor  ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Giảng viên' })); entryFill(' USER@example.test ', '      '); entrySubmit()
  await screen.findByText(/Email đã được sử dụng/)
  assert.deepEqual(payload, { name: 'Fixture Instructor', email: 'user@example.test', password: '      ', role: 'INSTRUCTOR' })
  assert.equal(document.querySelector('#name').value, '  Fixture Instructor  ')
})

for (const [status, text] of [[200, 'Nếu email tồn tại'], [400, 'Email bị từ chối'], [429, 'thử lại sau'], [503, 'Dịch vụ email chưa sẵn sàng'], [500, 'Máy chủ bận']]) test(`entry forgot ${status} has honest operation-specific recovery without replay`, async () => {
  let count = 0
  globalThis.fetch = async () => { count++; return jsonResponse(status === 200 ? { message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.' } : { error: status === 400 ? 'Email bị từ chối' : 'Máy chủ bận' }, status) }
  entryRender('/auth?mode=forgot'); entryFill(); entrySubmit()
  await screen.findByText(new RegExp(text)); assert.equal(count, 1)
  assert.equal(document.querySelector('#password'), null)
  assert.equal(document.body.textContent.includes('15 phút'), false)
})

test('entry login503 is not an SMTP message and uncertainty never replays registration', async () => {
  let count = 0; globalThis.fetch = async () => { count++; return jsonResponse({ error: 'Đăng nhập tạm ngừng' }, 503) }
  entryRender(); entryFill(); entrySubmit(); await screen.findByText('Đăng nhập tạm ngừng')
  assert.equal(document.body.textContent.includes('SMTP'), false)
  fireEvent.click(screen.getByRole('button', { name: 'Đăng ký ngay' })); fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Fixture Name' } }); entryFill()
  globalThis.fetch = async () => { count++; throw new TypeError('fixture network failure') }; entrySubmit()
  await screen.findByText(/có thể đã được tạo/); assert.equal(count, 2)
})

test('entry reset missing link disables fields and offers new recovery', () => {
  entryRender('/reset-password')
  assert.equal(screen.getByLabelText('Mật khẩu mới').disabled, true)
  assert.ok(screen.getByRole('link', { name: 'Yêu cầu liên kết mới' }))
})

for (const [message, invalid] of [['Liên kết không hợp lệ hoặc mật khẩu phải từ 6 đến 72 ký tự', false], ['Lỗi validation khác', false], ['Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn', true]]) test(`entry reset400 classification: ${invalid ? 'explicit link' : 'recoverable validation'} ${message}`, async () => {
  globalThis.fetch = async () => jsonResponse({ error: message }, 400)
  entryRender('/reset-password?token=' + 'a'.repeat(64)); resetFill(); entrySubmit()
  await screen.findByText(message)
  assert.equal(screen.getByLabelText('Mật khẩu mới').disabled, invalid)
  assert.equal(Boolean(screen.queryByRole('button', { name: 'Cập nhật mật khẩu' })), !invalid)
})

test('entry reset validates exact confirmation and preserves significant password spaces', async () => {
  let payload, count = 0
  globalThis.fetch = async (_url, options) => { count++; payload = JSON.parse(options.body); return jsonResponse({ message: 'Đã đặt lại mật khẩu.' }) }
  entryRender('/reset-password?token=' + 'a'.repeat(64)); resetFill(' rawpw ', 'rawpw'); entrySubmit()
  assert.equal(count, 0); assert.equal(document.activeElement.id, 'confirm-password')
  resetFill(); entrySubmit(); entrySubmit(); await screen.findByText('Đã đặt lại mật khẩu.')
  assert.equal(count, 1); assert.equal(payload.password, ' rawpw ')
  assert.equal(screen.getByLabelText('Mật khẩu mới').value, '')
  fireEvent.click(screen.getByRole('button', { name: 'Test replace link' }))
  assert.equal(screen.queryByText('Đã đặt lại mật khẩu.'), null)
  assert.equal(screen.getByLabelText('Mật khẩu mới').disabled, false)
})

test('entry reset old response is suppressed after link replacement and logout clears secret drafts', async () => {
  localStorage.setItem('luminaToken', 'reset-session-fixture')
  const old = studyDeferred(); globalThis.fetch = async (_url, options = {}) => options.method === 'POST' ? old.promise : jsonResponse({ user: { id: 99, role: 'STUDENT' } })
  entryRender('/reset-password?token=' + 'a'.repeat(64)); await act(async () => {}); resetFill(); entrySubmit()
  assert.equal(screen.getByRole('button', { name: 'Hiện mật khẩu' }).disabled, true)
  fireEvent.click(screen.getByRole('button', { name: 'Test replace link' })); resetFill('newdraft', 'newdraft')
  await act(async () => old.resolve(jsonResponse({ message: 'Obsolete completion' })))
  assert.equal(screen.queryByText('Obsolete completion'), null)
  assert.equal(screen.getByLabelText('Mật khẩu mới').value, 'newdraft')
  fireEvent.click(screen.getByRole('button', { name: 'Test logout' }))
  assert.equal(screen.getByLabelText('Mật khẩu mới').value, '')
})

test('entry reset network uncertainty retains necessary draft with manual recovery only', async () => {
  let count = 0; globalThis.fetch = async () => { count++; throw new TypeError('fixture network failure') }
  entryRender('/reset-password?token=' + 'a'.repeat(64)); resetFill(); entrySubmit()
  await screen.findByText(/Chưa xác định kết quả đặt lại/)
  assert.equal(screen.getByLabelText('Mật khẩu mới').value, ' rawpw ')
  assert.ok(screen.getByRole('link', { name: 'Yêu cầu liên kết mới' }))
  assert.equal(count, 1)
})

test('entry forgot pending history change suppresses stale outcome and retains email', async () => {
  const delayed = studyDeferred(); globalThis.fetch = async () => delayed.promise
  entryRender(); fireEvent.click(screen.getByRole('button', { name: 'Quên mật khẩu?' })); entryFill(); entrySubmit()
  fireEvent.click(screen.getByRole('button', { name: 'Test back' }))
  await screen.findByRole('heading', { name: 'Đăng nhập' })
  await act(async () => delayed.resolve(jsonResponse({ message: 'Ignored generic reply' })))
  assert.equal(screen.queryByText('Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.'), null)
  assert.equal(document.querySelector('#email').value, 'fixture@example.test')
  assert.equal(document.querySelector('#password').value, '')
})

test('entry logout during verification prevents late cached identity and routing', async () => {
  const verify = studyDeferred()
  globalThis.fetch = async (_url, options = {}) => options.method === 'POST' ? jsonResponse({ token: 'pending-verification-fixture' }) : verify.promise
  entryRender(); entryFill(); entrySubmit()
  await screen.findByRole('heading', { name: 'Xác minh phiên đăng nhập' })
  fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }))
  await screen.findByRole('heading', { name: 'Đăng nhập' })
  await act(async () => verify.resolve(jsonResponse({ user: { id: 41, role: 'ADMIN' } })))
  assert.equal(localStorage.getItem('luminaUser'), null)
  assert.equal(localStorage.getItem('luminaToken'), null)
  assert.equal(document.querySelector('#password').value, '')
})

test('entry confirmed reset explicit sign-in clears an existing session for reauthentication', async () => {
  localStorage.setItem('luminaToken', 'old-reset-session-fixture')
  globalThis.fetch = async (_url, options = {}) => options.method === 'POST' ? jsonResponse({ message: 'Reset confirmed fixture' }) : jsonResponse({ user: { id: 72, role: 'STUDENT' } })
  entryRender('/reset-password?token=' + 'a'.repeat(64)); await act(async () => {}); resetFill(); entrySubmit()
  await screen.findByText('Reset confirmed fixture')
  fireEvent.click(screen.getByRole('link', { name: 'Quay lại đăng nhập' }))
  await screen.findByRole('heading', { name: 'Đăng nhập' })
  assert.equal(localStorage.getItem('luminaToken'), null)
  assert.ok(screen.getByText(/Mật khẩu đã được thay đổi/))
})

test('entry wrong credential401 leaves replacement session intact and mode switching retains return state', async () => {
  const old = studyDeferred(); let posts = 0
  globalThis.fetch = async (_url, options = {}) => options.method === 'POST' ? (posts++, old.promise) : jsonResponse({ user: { id: 12, role: 'ADMIN' } })
  entryRender(); entryFill(); entrySubmit()
  fireEvent.click(screen.getByRole('button', { name: 'Test replace session' }))
  await screen.findByText('/admin')
  await act(async () => old.resolve(jsonResponse({ error: 'Wrong fixture credentials', code: 'INVALID_CREDENTIALS' }, 401)))
  assert.equal(localStorage.getItem('luminaToken'), 'replacement-fixture'); assert.equal(posts, 1)
})

test('entry confirmed registration remains visible when immediate verification expires the session', async () => {
  let posts = 0
  globalThis.fetch = async (_url, options = {}) => options.method === 'POST' ? (posts++, jsonResponse({ token: 'expired-entry-fixture' })) : jsonResponse({ error: 'Phiên không còn hiệu lực', code: 'SESSION_INVALID' }, 401)
  entryRender(); fireEvent.click(screen.getByRole('button', { name: 'Đăng ký ngay' })); fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Fixture Created' } }); entryFill(); entrySubmit()
  await screen.findByText('Tài khoản đã được tạo.')
  await screen.findByText(/Phiên xác minh đã hết hiệu lực/)
  assert.equal(document.querySelector('#password'), null)
  assert.equal(screen.getByRole('button', { name: 'Thử xác minh lại' }).disabled, true)
  fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }))
  await screen.findByRole('heading', { name: 'Đăng nhập' })
  assert.equal(posts, 1)
})
