import { test, assert, act, fireEvent, render, screen, waitFor, within, userEvent, App, fixtureRequestUrl, h, jsonResponse, renderAdminFixture, selectAdmin, adminRecord, dialogTestSupport, studyDeferred, accountUser, adminList } from './fixtures.js'

test('admin ignores an obsolete search response after a faster newer result', async () => {
  let resolveOld
  globalThis.fetch = async (url) => {
    const query = fixtureRequestUrl(url).searchParams.get('q')
    if (query === 'old') return new Promise((resolve) => { resolveOld = resolve })
    const user = { id: query ? 2 : 1, name: query === 'new' ? 'New Learner' : 'Initial Learner', email: query === 'new' ? 'new@example.test' : 'initial@example.test', role: 'STUDENT', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', _count: { enrollments: 1, submissions: 0 } }
    return new Response(JSON.stringify({ users: [user], total: 1, totalPages: 1 }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  const user = userEvent.setup()
  renderAdminFixture()
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

test('admin initial error has no confirmed zero total and exposes read retry', async () => {
  globalThis.fetch = async () => jsonResponse({ error: 'Mất kết nối dữ liệu' }, 503)
  renderAdminFixture()
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
  renderAdminFixture()
  await screen.findByText('learner1@example.test')
  await selectAdmin(1)
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
  renderAdminFixture()
  await screen.findByText('learner1@example.test')
  await selectAdmin(1)
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

test('admin successful write plus refresh error retains confirmed record and retry never repeats PATCH', async () => {
  let reads = 0, writes = 0
  let saved = adminRecord()
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === 'PATCH') { writes += 1; saved = { ...saved, ...JSON.parse(options.body) }; return jsonResponse({ user: { id: saved.id, name: saved.name, role: saved.role, email: saved.email, isActive: saved.isActive } }) }
    reads += 1
    return reads === 2 ? jsonResponse({ error: 'Refresh unavailable' }, 503) : jsonResponse({ users: [saved], total: 1, totalPages: 1 })
  }
  renderAdminFixture()
  await screen.findByText('learner1@example.test')
  await selectAdmin(1)
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
    const query = fixtureRequestUrl(url).searchParams
    paths.push(query.get('q') + ':' + query.get('page'))
    const secondPage = query.get('page') === '2'
    return jsonResponse({ users: renamed && secondPage ? [] : [adminRecord(secondPage ? 2 : 1)], total: renamed ? 25 : 26, totalPages: renamed ? 1 : 2 })
  }
  renderAdminFixture()
  await screen.findByText('learner1@example.test')
  await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
  await screen.findByText('learner2@example.test')
  await selectAdmin(2)
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
    const query = fixtureRequestUrl(url).searchParams.get('q'); queries.push(query)
    return jsonResponse({ users: query ? [adminRecord(2)] : [adminRecord(), adminRecord(2)], total: query ? 1 : 2, totalPages: 1 })
  }
  renderAdminFixture()
  await screen.findByText('learner1@example.test')
  await selectAdmin(2)
  fireEvent.change(screen.getByLabelText('Họ tên'), { target: { value: 'Draft thứ hai' } })
  await selectAdmin(1)
  fireEvent.change(screen.getByLabelText('Họ tên'), { target: { value: 'Đổi tên thứ nhất' } })
  await userEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  const query = 'x'.repeat(120)
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: ' ' + query + ' ignored ' } })
  await waitFor(() => assert.equal(queries.at(-1), query))
  await act(async () => resolveWrite(jsonResponse({ user: { ...adminRecord(), name: 'Đổi tên thứ nhất' } })))
  await waitFor(() => assert.equal(queries.filter((item) => item === query).length, 2))
  await selectAdmin(2)
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
  renderAdminFixture()
  await screen.findByText('learner1@example.test')
  await selectAdmin(1)
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
  renderAdminFixture()
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

test('admin workspace initially prioritizes list with no automatic editor or unsupported filters', async () => {
  globalThis.fetch = async () => jsonResponse(adminList([adminRecord(1),adminRecord(2)]))
  renderAdminFixture()
  await screen.findByText('learner1@example.test')
  assert.equal(Boolean(screen.queryByLabelText('Họ tên')), false)
  assert.equal(Boolean(screen.queryByRole('combobox')), false)
  assert.equal(screen.getByRole('button', { name: 'Chỉnh sửa learner1@example.test' }).getAttribute('aria-expanded'), 'false')
  await selectAdmin(1)
  assert.equal(screen.getAllByLabelText('Họ tên').length, 1)
  assert.equal(document.activeElement, screen.getByRole('heading', { name: 'Chỉnh sửa tài khoản' }))
  assert.ok(screen.getByText('Tài khoản: learner1@example.test'))
})

test('admin workspace close switch and reopen preserve each local draft and restore trigger focus', async () => {
  globalThis.fetch = async () => jsonResponse(adminList([adminRecord(1),adminRecord(2)]))
  renderAdminFixture()
  fireEvent.change(await selectAdmin(1), { target: { value: 'Nháp một' } })
  await selectAdmin(2)
  fireEvent.change(screen.getByLabelText('Họ tên'), { target: { value: 'Nháp hai' } })
  await userEvent.click(screen.getByRole('button', { name: 'Đóng chỉnh sửa' }))
  assert.equal(document.activeElement, screen.getByRole('button', { name: 'Chỉnh sửa learner2@example.test' }))
  assert.equal(Boolean(screen.queryByLabelText('Họ tên')), false)
  assert.equal((await selectAdmin(1)).value, 'Nháp một')
  assert.equal((await selectAdmin(2)).value, 'Nháp hai')
})

test('admin workspace filtered-out selection closes without auto selecting and retains dirty draft', async () => {
  globalThis.fetch = async url => jsonResponse(adminList(fixtureRequestUrl(url).searchParams.get('q') ? [adminRecord(2)] : [adminRecord(1),adminRecord(2)]))
  renderAdminFixture()
  fireEvent.change(await selectAdmin(1), { target: { value: 'Nháp ngoài kết quả' } })
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'two' } })
  await waitFor(() => assert.equal(Boolean(screen.queryByText('learner1@example.test')), false))
  assert.equal(Boolean(screen.queryByLabelText('Họ tên')), false)
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })
  assert.equal((await selectAdmin(1)).value, 'Nháp ngoài kết quả')
})

test('admin workspace loading empty no-match and read failure have distinct totals and retry', async () => {
  const read = studyDeferred()
  let reads = 0
  globalThis.fetch = async url => ++reads === 1 ? read.promise : fixtureRequestUrl(url).searchParams.get('q') ? jsonResponse(adminList([])) : jsonResponse({ error: 'fixture list offline' },503)
  renderAdminFixture()
  await screen.findByText('Đang tải tài khoản…')
  assert.equal(Boolean(screen.queryByText('0 tài khoản')), false)
  read.resolve(jsonResponse(adminList([])))
  await screen.findByText('Chưa có tài khoản')
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'missing' } })
  await screen.findByText('Không tìm thấy tài khoản')
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })
  await screen.findByText(/fixture list offline/)
  await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  await waitFor(() => assert.equal(reads, 4))
})

test('admin workspace delayed A outcome never selects A clears B draft or replaces B outcome', async () => {
  const first = studyDeferred()
  globalThis.fetch = async (url,options={}) => options.method === 'PATCH' ? String(url).endsWith('/1') ? first.promise : jsonResponse({ user: {...adminRecord(2),...JSON.parse(options.body)} }) : jsonResponse(adminList([adminRecord(1),adminRecord(2)]))
  renderAdminFixture()
  fireEvent.change(await selectAdmin(1), { target: { value: 'Tên một' } })
  await userEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  fireEvent.change(await selectAdmin(2), { target: { value: 'Tên hai' } })
  await userEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await screen.findByText('Đã cập nhật tài khoản learner2@example.test.')
  fireEvent.change(screen.getByLabelText('Họ tên'), { target: { value: 'Nháp mới của hai' } })
  first.resolve(jsonResponse({ user: {...adminRecord(1),name:'Tên một'} }))
  await screen.findByText('Đã cập nhật tài khoản learner1@example.test.')
  await waitFor(() => assert.equal(screen.getByLabelText('Họ tên').disabled, false))
  assert.equal(screen.getByLabelText('Họ tên').value,'Nháp mới của hai')
  assert.ok(screen.getByText('Đã cập nhật tài khoản learner2@example.test.'))
  assert.equal(screen.getByRole('button',{name:'Chỉnh sửa learner2@example.test'}).getAttribute('aria-expanded'),'true')
})

test('admin workspace same-tick submits and competing status action produce one mutation', async () => {
  const write = studyDeferred(), bodies=[]
  globalThis.fetch = async (url,options={}) => {if(options.method==='PATCH'){bodies.push(JSON.parse(options.body));return write.promise}return jsonResponse(adminList())}
  renderAdminFixture()
  const input=await selectAdmin(1)
  fireEvent.change(input,{target:{value:'  ab  '}})
  act(()=>{fireEvent.submit(input.closest('form'));fireEvent.submit(input.closest('form'))})
  assert.deepEqual(bodies,[{name:'ab',role:'STUDENT'}])
  assert.equal(input.disabled,true)
  assert.equal(screen.getByRole('button',{name:'Khóa tài khoản'}).disabled,true)
  write.resolve(jsonResponse({user:{...adminRecord(),name:'ab'}}))
  await screen.findByText('Đã cập nhật tài khoản learner1@example.test.')
})

test('admin workspace exact80 name valid while invalid names and roles never write', async () => {
  const bodies=[]
  globalThis.fetch=async(url,options={})=>{if(options.method==='PATCH'){bodies.push(JSON.parse(options.body));return jsonResponse({user:{...adminRecord(),...JSON.parse(options.body)}})}return jsonResponse(adminList())}
  renderAdminFixture()
  const input=await selectAdmin(1)
  for(const value of [' a ','x'.repeat(81)]){
    fireEvent.change(input,{target:{value}})
    fireEvent.submit(input.closest('form'))
    assert.equal(bodies.length,0)
    assert.equal(input.getAttribute('aria-invalid'),'true')
  }
  fireEvent.change(input,{target:{value:' '+'x'.repeat(80)+' '}})
  fireEvent.submit(input.closest('form'))
  await screen.findByText('Đã cập nhật tài khoản learner1@example.test.')
  assert.equal(bodies[0].name.length,80)
  assert.equal(Boolean(screen.queryByRole('option',{name:'Quản trị viên'})),false)
})

for(const failure of ['network','server','malformed']) test('admin workspace uncertain '+failure+' retains draft and never replays mutation',async()=>{
  let writes=0
  globalThis.fetch=async(url,options={})=>{
    if(options.method==='PATCH'){writes++;if(failure==='network')throw new TypeError('fixture offline');return failure==='server'?jsonResponse({error:'fixture server'},503):jsonResponse({})}
    return jsonResponse(adminList())
  }
  renderAdminFixture()
  fireEvent.change(await selectAdmin(1),{target:{value:'Giữ bản nháp'}})
  await userEvent.click(screen.getByRole('button',{name:'Lưu thay đổi'}))
  await screen.findByText(/Chưa xác định kết quả cập nhật/)
  assert.equal(screen.getByLabelText('Họ tên').value,'Giữ bản nháp')
  assert.equal(screen.getByLabelText('Họ tên').getAttribute('aria-invalid'),'false')
  assert.equal(writes,1)
  assert.equal(Boolean(screen.queryByText('Đã cập nhật tài khoản learner1@example.test.')),false)
})

test('admin workspace production name400 is described field error and404 is operation error',async()=>{
  let writes=0
  globalThis.fetch=async(url,options={})=>options.method==='PATCH'?++writes===1?jsonResponse({error:'Họ tên phải từ 2 đến 80 ký tự'},400):jsonResponse({error:'fixture target missing'},404):jsonResponse(adminList())
  renderAdminFixture()
  fireEvent.change(await selectAdmin(1),{target:{value:'Tên gửi'}})
  await userEvent.click(screen.getByRole('button',{name:'Lưu thay đổi'}))
  await screen.findByText('Họ tên phải từ 2 đến 80 ký tự')
  assert.equal(screen.getByLabelText('Họ tên').getAttribute('aria-invalid'),'true')
  fireEvent.change(screen.getByLabelText('Họ tên'),{target:{value:'Tên gửi lại'}})
  await userEvent.click(screen.getByRole('button',{name:'Lưu thay đổi'}))
  await screen.findByText('fixture target missing')
  assert.equal(screen.getByLabelText('Họ tên').getAttribute('aria-invalid'),'false')
})

test('admin workspace current403 blocks actions without clearing credentials and verifies identity explicitly',async()=>{
  let denied=false,writes=0,reads=0
  globalThis.fetch=async(url,options={})=>{
    if(options.method==='PATCH'){writes++;denied=true;return jsonResponse({error:'fixture admin denied'},403)}
    reads++;return jsonResponse(adminList())
  }
  renderAdminFixture()
  fireEvent.change(await selectAdmin(1),{target:{value:'Tên mới'}})
  await userEvent.click(screen.getByRole('button',{name:'Lưu thay đổi'}))
  await screen.findByText('Không còn quyền quản trị')
  assert.equal(localStorage.getItem('luminaToken'),'fixture-same')
  assert.equal(screen.getByRole('button',{name:'Khóa tài khoản'}).disabled,true)
  assert.equal(writes,1)
  assert.equal(denied,true)
  await userEvent.click(screen.getByRole('button',{name:'Xác minh tài khoản'}))
  await waitFor(()=>assert.equal(reads,2))
  await waitFor(()=>assert.equal(screen.getByRole('button',{name:'Khóa tài khoản'}).disabled,false))
  assert.equal(writes,1)
})

for(const sameIdentity of [true,false]) for(const late of ['success','error']) test('admin workspace late '+late+' after replacement sameIdentity='+sameIdentity,async()=>{
  const write=studyDeferred()
  let identity={id:90,role:'ADMIN',name:'ADMIN cũ',email:'admin90@example.test'}
  globalThis.fetch=async(url,options={})=>options.method==='PATCH'?write.promise:jsonResponse(adminList())
  renderAdminFixture(()=>identity,true)
  fireEvent.change(await selectAdmin(1),{target:{value:'Nháp cũ'}})
  await userEvent.click(screen.getByRole('button',{name:'Lưu thay đổi'}))
  identity={...identity,id:sameIdentity?90:91,name:'ADMIN mới'}
  await userEvent.click(screen.getByRole('button',{name:'Install same'}))
  await screen.findByText('ADMIN mới')
  await waitFor(()=>assert.equal(Boolean(screen.queryByLabelText('Họ tên')),false))
  const name=await selectAdmin(1)
  assert.equal(name.value,'Học viên 1')
  fireEvent.change(name,{target:{value:'Nháp phiên mới'}})
  write.resolve(late==='success'?jsonResponse({user:{...adminRecord(),name:'Kết quả cũ'}}):jsonResponse({error:'fixture stale denial'},403))
  await act(async()=>{await new Promise(done=>setTimeout(done,0))})
  assert.equal(name.value,'Nháp phiên mới')
  assert.equal(Boolean(screen.queryByText('Không còn quyền quản trị')),false)
  assert.equal(Boolean(screen.queryByText('Đã cập nhật tài khoản learner1@example.test.')),false)
  assert.equal(screen.getByTestId('session-status').textContent,'authenticated')
})

test('admin workspace keyboard selection close and native confirmation cancel preserve focus without write',async()=>{
  dialogTestSupport()
  let writes=0
  globalThis.fetch=async(url,options={})=>{if(options.method==='PATCH')writes++;return jsonResponse(adminList())}
  renderAdminFixture()
  const trigger=await screen.findByRole('button',{name:'Chỉnh sửa learner1@example.test'})
  trigger.focus();await userEvent.keyboard('{Enter}')
  assert.equal(document.activeElement,screen.getByRole('heading',{name:'Chỉnh sửa tài khoản'}))
  screen.getByRole('button',{name:'Đóng chỉnh sửa'}).focus()
  await userEvent.keyboard('{Enter}')
  assert.equal(document.activeElement,trigger)
  const lock=screen.getByRole('button',{name:'Khóa tài khoản'})
  lock.focus();await userEvent.keyboard('{Enter}')
  const dialog=screen.getByRole('dialog')
  assert.equal(document.activeElement,within(dialog).getByRole('button',{name:'Hủy'}))
  fireEvent.keyDown(dialog,{key:'Escape'})
  await waitFor(()=>assert.equal(Boolean(screen.queryByRole('dialog')),false))
  assert.equal(document.activeElement,lock)
  assert.equal(writes,0)
})

test('admin workspace missing counts stay unavailable while zero and long text remain readable',async()=>{
  const user={...adminRecord(),name:'Tên dài '.repeat(10),email:'x'.repeat(220)+'@example.test',_count:{submissions:0}}
  globalThis.fetch=async()=>jsonResponse(adminList([user]))
  renderAdminFixture()
  await userEvent.click(await screen.findByRole('button',{name:'Chỉnh sửa '+user.email}))
  assert.ok(screen.getByText(user.name.trim()))
  const stats=document.querySelector('.admin-user-stats')
  assert.ok(stats.textContent.includes('—'))
  assert.ok(stats.textContent.includes('0'))
  assert.equal(screen.getAllByLabelText('Họ tên').length,1)
})

test('admin workspace old initial GET cannot populate replacement session',async()=>{
  const old=studyDeferred()
  let reads=0,identity={id:90,name:'ADMIN ban đầu',email:'a@example.test',role:'ADMIN'}
  globalThis.fetch=async()=>++reads===1?old.promise:jsonResponse(adminList([adminRecord(2)]))
  renderAdminFixture(()=>identity,true)
  await waitFor(()=>assert.equal(reads,1))
  identity={...identity,id:91,name:'ADMIN thay thế'}
  await userEvent.click(screen.getByRole('button',{name:'Install new'}))
  await screen.findByText('learner2@example.test')
  old.resolve(jsonResponse(adminList([adminRecord(1)])))
  await act(async()=>{await new Promise(done=>setTimeout(done,0))})
  assert.equal(Boolean(screen.queryByText('learner1@example.test')),false)
})

for(const role of ['INSTRUCTOR','STUDENT']) test('admin workspace actual App denies '+role+' without admin list request',async()=>{
  localStorage.setItem('luminaToken','fixture-same')
  window.history.replaceState(null,'','/admin')
  let adminReads=0
  globalThis.fetch=async url=>{if(String(url).includes('/api/admin'))adminReads++;return jsonResponse({user:accountUser(10,role)})}
  render(h(App))
  await screen.findByRole('heading',{name:'Không có quyền truy cập'})
  assert.equal(adminReads,0)
})

test('admin workspace actual App permission reverify routes a changed role to existing denial',async()=>{
  localStorage.setItem('luminaToken','fixture-same')
  window.history.replaceState(null,'','/admin')
  let identity=accountUser(90,'ADMIN'),writes=0
  globalThis.fetch=async(url,options={})=>{
    if(String(url).endsWith('/api/auth/me'))return jsonResponse({user:identity})
    if(options.method==='PATCH'){writes++;return jsonResponse({error:'fixture no ADMIN'},403)}
    return jsonResponse(adminList())
  }
  render(h(App))
  fireEvent.change(await selectAdmin(1),{target:{value:'Tên đã sửa'}})
  await userEvent.click(screen.getByRole('button',{name:'Lưu thay đổi'}))
  await screen.findByText('Không còn quyền quản trị')
  identity=accountUser(90,'STUDENT')
  await userEvent.click(screen.getByRole('button',{name:'Xác minh tài khoản'}))
  await screen.findByRole('heading',{name:'Không có quyền truy cập'})
  assert.equal(writes,1)
  assert.equal(Boolean(screen.queryByLabelText('Họ tên')),false)
})

test('admin workspace actual App current401 expires without reviving account data',async()=>{
  localStorage.setItem('luminaToken','fixture-same')
  window.history.replaceState(null,'','/admin')
  globalThis.fetch=async url=>String(url).endsWith('/api/auth/me')?jsonResponse({user:accountUser(90,'ADMIN')}):jsonResponse({error:'fixture expired',code:'SESSION_INVALID'},401)
  render(h(App))
  await screen.findByText('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  assert.equal(window.location.pathname,'/auth')
  assert.equal(localStorage.getItem('luminaToken'),null)
})

test('admin workspace route roundtrip resets search selection and drafts without changing URL contract',async()=>{
  localStorage.setItem('luminaToken','fixture-same')
  window.history.replaceState(null,'','/admin')
  globalThis.fetch=async url=>String(url).endsWith('/api/auth/me')?jsonResponse({user:accountUser(90,'ADMIN')}):jsonResponse(adminList())
  render(h(App))
  fireEvent.change(await selectAdmin(1),{target:{value:'Nháp theo trang'}})
  fireEvent.change(screen.getByRole('searchbox'),{target:{value:'learner'}})
  await waitFor(()=>assert.equal(Boolean(screen.queryByText('Đang cập nhật danh sách…')),false))
  assert.equal(window.location.search,'')
  await userEvent.click(screen.getByRole('link',{name:'Tài khoản'}))
  await screen.findByLabelText('Họ và tên')
  await userEvent.click(screen.getByRole('link',{name:'Quản trị'}))
  await screen.findByText('learner1@example.test')
  assert.equal(screen.getByRole('searchbox').value,'')
  assert.equal(Boolean(screen.queryByLabelText('Họ tên')),false)
  assert.equal((await selectAdmin(1)).value,'Học viên 1')
})
