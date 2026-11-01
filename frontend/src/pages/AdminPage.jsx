import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from '../app/SessionContext.jsx'
import { apiRequest, getSessionGeneration } from '../services/api.js'
import Button from '../components/ui/Button.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { EmptyState, ErrorState, FieldError, LoadingState, StatusMessage } from '../components/ui/Feedback.jsx'
import './LearningApp.css'
import './RoleDashboards.css'
import './AdminWorkspace.css'

const roleName = (role) => role === 'INSTRUCTOR' ? 'Giảng viên' : 'Học viên'
const queryFor = (value) => value.trim().slice(0, 120)
const validName = (name) => name.trim().length >= 2 && name.trim().length <= 80
const managedRole = (role) => ['INSTRUCTOR', 'STUDENT'].includes(role)

function AccountEditor({ user, draft, pending, blocked, fieldError, onEdit, onSave, onClose }) {
  const heading = useRef(null)
  useEffect(() => { heading.current?.focus() }, [])
  const changed = draft.name !== user.name || draft.role !== user.role
  return <section className="admin-editor" id="admin-account-editor" aria-labelledby="admin-editor-heading" aria-busy={Boolean(pending)}>
    <div className="admin-editor-heading"><h2 ref={heading} tabIndex={-1} id="admin-editor-heading">Chỉnh sửa tài khoản</h2><Button variant="secondary" onClick={onClose} aria-label="Đóng chỉnh sửa">Đóng</Button></div>
    <p className="admin-editor-target">Tài khoản: {user.email}</p>
    <p>Vai trò hiện tại: {roleName(user.role)} · Trạng thái: {user.isActive ? 'đang hoạt động' : 'đã khóa'}</p>
    <div className="admin-user-stats"><span>{user.role === 'INSTRUCTOR' ? user._count?.courses ?? '—' : user._count?.enrollments ?? '—'}</span>{user.role === 'INSTRUCTOR' ? 'khóa học đang sở hữu' : 'khóa học đã tham gia'}<span>{user._count?.submissions ?? '—'}</span>bài nộp</div>
    <form onSubmit={(event) => { event.preventDefault(); onSave(user) }} noValidate>
      <label htmlFor={'user-name-' + user.id}>Họ tên</label>
      <input id={'user-name-' + user.id} value={draft.name} autoComplete="off" disabled={Boolean(pending) || blocked} aria-invalid={Boolean(fieldError)} aria-describedby={'user-help-' + user.id + (fieldError ? ' user-error-' + user.id : '')} onChange={(event) => onEdit(user, { name: event.target.value })} />
      <small id={'user-help-' + user.id}>2–80 ký tự sau khi bỏ khoảng trắng ở hai đầu. Email chỉ đọc.</small>
      <FieldError id={'user-error-' + user.id}>{fieldError}</FieldError>
      <label htmlFor={'user-role-' + user.id}>Vai trò</label>
      <select id={'user-role-' + user.id} value={draft.role} disabled={Boolean(pending) || blocked} onChange={(event) => onEdit(user, { role: event.target.value })}><option value="INSTRUCTOR">Giảng viên</option><option value="STUDENT">Học viên</option></select>
      <p className="admin-draft-note">{changed ? 'Bản chỉnh sửa chưa lưu. Đóng hoặc chuyển tài khoản vẫn giữ bản nháp trên trang này.' : 'Thông tin đang khớp với tài khoản đã tải.'}</p>
      <Button type="submit" disabled={!changed || !validName(draft.name) || !managedRole(draft.role) || Boolean(pending) || blocked}>{pending === 'save' ? 'Đang lưu…' : 'Lưu thay đổi'}</Button>
    </form>
  </section>
}

function AdminWorkspace({ generation }) {
  const { status, refresh } = useSession()
  const [users, setUsers] = useState([])
  const [drafts, setDrafts] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingActions, setPendingActions] = useState({})
  const [outcomes, setOutcomes] = useState({})
  const [confirmation, setConfirmation] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [denied, setDenied] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const mounted = useRef(false)
  const request = useRef({ sequence: 0, controller: null })
  const view = useRef({ query: '', page: 1 })
  const records = useRef([])
  const draftValues = useRef({})
  const dirty = useRef(new Set())
  const edits = useRef({})
  const locks = useRef(new Set())
  const deniedRef = useRef(false)
  const selectedTrigger = useRef(null)
  const isCurrent = useCallback(() => mounted.current && generation === getSessionGeneration(), [generation])
  const updateDrafts = useCallback((update) => {
    const next = update(draftValues.current)
    draftValues.current = next
    setDrafts(next)
  }, [])
  const invalidate = useCallback(() => {
    request.current.sequence += 1
    request.current.controller?.abort()
  }, [])
  const denyAccess = useCallback(() => {
    deniedRef.current = true
    setDenied(true)
    setConfirmation(null)
    setLoading(false)
    invalidate()
  }, [invalidate])

  const loadUsers = useCallback(async () => {
    if (!isCurrent() || deniedRef.current) return
    invalidate()
    const sequence = request.current.sequence
    const target = { ...view.current }
    const controller = new AbortController()
    request.current.controller = controller
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/admin/users?q=' + encodeURIComponent(target.query) + '&page=' + target.page, { signal: controller.signal })
      if (!isCurrent() || sequence !== request.current.sequence || deniedRef.current) return
      if (!Array.isArray(data?.users) || !Number.isInteger(data.total) || data.total < 0 || !Number.isInteger(data.totalPages) || data.totalPages < 0) throw new Error('Máy chủ chưa trả danh sách tài khoản hợp lệ.')
      const lastPage = Math.max(1, data.totalPages)
      if (target.page > lastPage) {
        view.current = { ...target, page: lastPage }
        setPage(lastPage)
        return
      }
      records.current = data.users
      setUsers(data.users)
      setSnapshot({ ...target, total: data.total, totalPages: lastPage })
      setSelectedId((current) => data.users.some((user) => user.id === current) ? current : null)
      updateDrafts((current) => {
        const next = { ...current }
        for (const user of data.users) if (!dirty.current.has(user.id) && !locks.current.has(user.id)) next[user.id] = { name: user.name, role: user.role }
        return next
      })
    } catch (requestError) {
      if (!isCurrent() || sequence !== request.current.sequence || requestError.name === 'AbortError') return
      setError(requestError.message)
      if (requestError.status === 403) denyAccess()
    } finally {
      if (isCurrent() && sequence === request.current.sequence) setLoading(false)
    }
  }, [invalidate, isCurrent, updateDrafts, denyAccess])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; invalidate() }
  }, [invalidate])
  useEffect(() => {
    const timer = window.setTimeout(loadUsers, search ? 250 : 0)
    return () => { window.clearTimeout(timer); invalidate() }
  }, [search, page, loadUsers, invalidate])

  const allowed = () => isCurrent() && status === 'authenticated' && !deniedRef.current
  const changeView = (query, nextPage) => {
    if (!isCurrent()) return
    invalidate()
    view.current = { query: queryFor(query), page: nextPage }
    setSearch(query)
    setPage(nextPage)
    setLoading(true)
    setError('')
    setConfirmation(null)
  }
  const editDraft = (user, changes) => {
    if (!allowed() || locks.current.has(user.id)) return
    const next = { ...(draftValues.current[user.id] || { name: user.name, role: user.role }), ...changes }
    dirty.current.add(user.id)
    edits.current[user.id] = (edits.current[user.id] || 0) + 1
    updateDrafts((current) => ({ ...current, [user.id]: next }))
    setFieldErrors((current) => ({ ...current, [user.id]: validName(next.name) ? '' : 'Họ tên cần từ 2 đến 80 ký tự.' }))
  }
  const writeUser = async (user, payload, kind) => {
    if (!allowed() || locks.current.has(user.id)) return
    locks.current.add(user.id)
    const editVersion = edits.current[user.id] || 0
    setPendingActions((current) => ({ ...current, [user.id]: kind }))
    setOutcomes((current) => ({ ...current, [user.id]: null }))
    invalidate()
    setLoading(false)
    try {
      const data = await apiRequest('/api/admin/users/' + user.id, { method: 'PATCH', body: JSON.stringify(payload) })
      if (!isCurrent() || deniedRef.current) return
      const updated = data?.user
      if (updated?.id !== user.id || typeof updated.name !== 'string' || typeof updated.email !== 'string' || !managedRole(updated.role) || typeof updated.isActive !== 'boolean') throw new Error('Máy chủ chưa trả xác nhận cập nhật hợp lệ.')
      invalidate()
      records.current = records.current.map((item) => item.id === user.id ? { ...item, ...updated } : item)
      setUsers(records.current)
      if (kind === 'save' && (edits.current[user.id] || 0) === editVersion) {
        dirty.current.delete(user.id)
        updateDrafts((current) => ({ ...current, [user.id]: { name: updated.name, role: updated.role } }))
      }
      setOutcomes((current) => ({ ...current, [user.id]: { type: 'success', email: updated.email, text: kind === 'save' ? 'Đã cập nhật tài khoản ' + updated.email + '.' : payload.isActive ? 'Đã mở lại tài khoản.' : 'Đã khóa tài khoản và thu hồi các phiên đăng nhập.' } }))
    } catch (requestError) {
      if (!isCurrent()) return
      const nameError = requestError.status === 400 && requestError.message === 'Họ tên phải từ 2 đến 80 ký tự'
      if (nameError) setFieldErrors((current) => ({ ...current, [user.id]: requestError.message }))
      const uncertain = !requestError.status || requestError.status >= 500
      const text = nameError ? 'Tên của ' + user.email + ' chưa được chấp nhận. Mở chỉnh sửa để xem lỗi.'
        : requestError.status === 409 ? requestError.message + ' Các khóa học hoặc lượt tham gia liên kết cần được xử lý trước khi đổi vai trò.'
          : uncertain ? requestError.message + ' Chưa xác định kết quả cập nhật; thay đổi có thể đã được ghi. Không tự động gửi lại. Hãy tải lại danh sách trước khi chủ động thử lại.' : requestError.message
      setOutcomes((current) => ({ ...current, [user.id]: { type: 'error', email: user.email, text } }))
      if (requestError.status === 403) denyAccess()
    } finally {
      locks.current.delete(user.id)
      if (isCurrent()) {
        setPendingActions((current) => ({ ...current, [user.id]: null }))
        if (!deniedRef.current) void loadUsers()
      }
    }
  }
  const requestSave = (user) => {
    if (!allowed() || locks.current.has(user.id)) return
    const draft = draftValues.current[user.id] || { name: user.name, role: user.role }
    const payload = { name: draft.name.trim(), role: draft.role }
    if (!validName(payload.name) || !managedRole(payload.role)) {
      setFieldErrors((current) => ({ ...current, [user.id]: 'Họ tên cần từ 2 đến 80 ký tự; chọn vai trò hợp lệ.' }))
      document.getElementById('user-name-' + user.id)?.focus()
      return
    }
    if (payload.role !== user.role) setConfirmation({ title: 'Xác nhận đổi vai trò', message: 'Đổi ' + user.email + ' từ ' + roleName(user.role) + ' sang ' + roleName(payload.role) + '? Tài khoản còn khóa học đang dạy hoặc đang tham gia có thể chưa đổi được vai trò. Thay đổi vai trò sẽ thu hồi các phiên đăng nhập hiện tại.', confirmLabel: 'Đổi vai trò', onConfirm: () => writeUser(user, payload, 'save') })
    else void writeUser(user, payload, 'save')
  }
  const requestToggle = (user) => {
    if (!allowed() || locks.current.has(user.id)) return
    const payload = { isActive: !user.isActive }
    setConfirmation({ title: user.isActive ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?', message: user.isActive ? 'Khóa ' + user.email + '. Các phiên hiện tại sẽ bị thu hồi và người dùng không thể truy cập cho đến khi mở lại.' : 'Cho phép ' + user.email + ' đăng nhập và sử dụng hệ thống trở lại. Các phiên cũ vẫn cần đăng nhập lại.', confirmLabel: user.isActive ? 'Khóa tài khoản' : 'Mở khóa', danger: user.isActive, onConfirm: () => writeUser(user, payload, 'active') })
  }
  const verifyAccess = async () => {
    if (!isCurrent() || verifying) return
    setVerifying(true)
    try {
      const identity = await refresh()
      if (!isCurrent() || !identity || identity.role !== 'ADMIN') return
      deniedRef.current = false
      setDenied(false)
      await loadUsers()
    } catch (requestError) { if (isCurrent()) setError(requestError.message) }
    finally { if (isCurrent()) setVerifying(false) }
  }
  const currentSnapshot = snapshot && snapshot.query === queryFor(search) && snapshot.page === page
  const selected = users.find((user) => user.id === selectedId)
  const blocked = denied || status !== 'authenticated'
  return <main className="admin-main role-dashboard role-dashboard--admin admin-workspace">
    <section className="account-heading"><span className="eyebrow">QUẢN TRỊ HỆ THỐNG</span><h1>Giảng viên và học viên</h1><p>Tìm tài khoản, chọn để chỉnh sửa hồ sơ hoặc quản lý quyền truy cập. Tài khoản Admin không xuất hiện trong danh sách này.</p></section>
    <section className="admin-toolbar"><label htmlFor="admin-search">Tìm theo tên hoặc email<input id="admin-search" type="search" value={search} disabled={blocked} onChange={(event) => changeView(event.target.value, 1)} placeholder="Nhập tên hoặc email…" /></label><strong>{snapshot ? snapshot.total + ' tài khoản' + (currentSnapshot ? '' : ' · kết quả trước') : loading ? 'Đang tìm…' : 'Chưa tải được tổng số'}</strong></section>
    {denied && <section className="admin-access-recovery"><ErrorState title="Không còn quyền quản trị">Server đã từ chối thao tác. Các thay đổi đang bị chặn; hãy xác minh tài khoản hiện tại.</ErrorState><Button onClick={verifyAccess} disabled={verifying}>{verifying ? 'Đang xác minh…' : 'Xác minh tài khoản'}</Button></section>}
    <div className="admin-outcomes">{Object.entries(outcomes).filter(([, outcome]) => outcome).map(([id, outcome]) => <section key={id} aria-label={'Kết quả cho ' + outcome.email}><p>Tài khoản thao tác: {outcome.email}</p><StatusMessage type={outcome.type} onDismiss={() => setOutcomes((current) => ({ ...current, [id]: null }))}>{outcome.text}</StatusMessage></section>)}</div>
    {error && !denied && <ErrorState title={snapshot ? 'Chưa làm mới được danh sách' : 'Không thể tải tài khoản'} onRetry={loadUsers}>{error}{Object.values(outcomes).some((outcome) => outcome?.type === 'success') ? ' Thay đổi đã được lưu; thử lại chỉ tải danh sách.' : ''}</ErrorState>}
    {loading && <LoadingState>{snapshot ? 'Đang cập nhật danh sách…' : 'Đang tải tài khoản…'}</LoadingState>}
    {snapshot && <>
      {(!currentSnapshot || error || loading) && <p className="refetching-status">Kết quả trước đó — chưa cập nhật theo tìm kiếm/trang hiện tại.</p>}
      <div className={'admin-content' + (selected ? ' has-selection' : '')}><section className="admin-results" aria-labelledby="admin-list-heading"><h2 id="admin-list-heading">Danh sách tài khoản</h2>
        {!users.length ? <EmptyState title={snapshot.query ? 'Không tìm thấy tài khoản' : 'Chưa có tài khoản'}>{snapshot.query ? 'Thử thay đổi cụm từ tìm kiếm.' : 'Các tài khoản học viên và giảng viên sẽ xuất hiện tại đây.'}</EmptyState> : <div className="admin-user-list">{users.map((user) => <article className={'admin-user-card' + (selectedId === user.id ? ' selected' : '')} key={user.id} aria-busy={Boolean(pendingActions[user.id])}>
          <div className="admin-row-identity"><h3>{user.name}</h3><p className="admin-email">{user.email}</p><div className="admin-row-meta"><span className="admin-effective-role">{roleName(user.role)}</span><span className={'account-status ' + (user.isActive ? 'active' : 'inactive')}>{user.isActive ? 'Đang hoạt động' : 'Đã khóa'}</span><small>Tham gia {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}</small></div></div>
          <div className="admin-row-actions"><Button variant="secondary" aria-label={'Chỉnh sửa ' + user.email} aria-expanded={selectedId === user.id} aria-controls="admin-account-editor" disabled={blocked} onClick={(event) => { setConfirmation(null); selectedTrigger.current = event.currentTarget; setSelectedId(user.id) }}>Chỉnh sửa</Button><Button variant={user.isActive ? 'danger' : 'secondary'} disabled={blocked || Boolean(pendingActions[user.id])} onClick={() => requestToggle(user)}>{pendingActions[user.id] === 'active' ? 'Đang cập nhật…' : user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}</Button>{pendingActions[user.id] && <span role="status">{pendingActions[user.id] === 'save' ? 'Đang lưu hồ sơ…' : 'Đang cập nhật trạng thái…'}</span>}</div>
        </article>)}</div>}
        {snapshot.totalPages > 1 && <div className="admin-pagination"><Button variant="secondary" disabled={blocked || page <= 1 || loading} onClick={() => changeView(search, page - 1)}>Trang trước</Button><span>Trang {snapshot.page}/{snapshot.totalPages}{!currentSnapshot ? ' · kết quả trước' : ''}</span><Button variant="secondary" disabled={blocked || page >= snapshot.totalPages || loading} onClick={() => changeView(search, page + 1)}>Trang sau</Button></div>}
      </section>
      {selected && <AccountEditor key={selected.id} user={selected} draft={drafts[selected.id] || { name: selected.name, role: selected.role }} pending={pendingActions[selected.id]} blocked={blocked} fieldError={fieldErrors[selected.id]} onEdit={editDraft} onSave={requestSave} onClose={() => { setConfirmation(null); setSelectedId(null); if (selectedTrigger.current?.isConnected) selectedTrigger.current.focus() }} />}
      </div>
    </>}
    {confirmation && <ConfirmDialog {...confirmation} onCancel={() => setConfirmation(null)} onConfirm={() => { const confirm = confirmation.onConfirm; setConfirmation(null); void confirm() }} />}
  </main>
}

export default function AdminPage() {
  const { user, generation } = useSession()
  if (!user || user.role !== 'ADMIN') return null
  return <AdminWorkspace key={user.id + ':' + generation} generation={generation} />
}
