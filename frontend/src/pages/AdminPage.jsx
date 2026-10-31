import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../services/api.js'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { EmptyState, ErrorState, LoadingState, StatusMessage } from '../components/ui/Feedback.jsx'
import './LearningApp.css'
import './RoleDashboards.css'

const roleName = (role) => role === 'INSTRUCTOR' ? 'Giảng viên' : 'Học viên'
const queryFor = (value) => value.trim().slice(0, 120)

function AdminPage() {
  const [users, setUsers] = useState([])
  const [drafts, setDrafts] = useState({})
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingActions, setPendingActions] = useState({})
  const [message, setMessage] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const mounted = useRef(false)
  const request = useRef({ sequence: 0, controller: null })
  const view = useRef({ query: '', page: 1 })
  const dirty = useRef({})
  const locks = useRef(new Set())

  const invalidate = useCallback(() => {
    request.current.sequence += 1
    request.current.controller?.abort()
  }, [])

  const loadUsers = useCallback(async () => {
    invalidate()
    const sequence = request.current.sequence
    const target = { ...view.current }
    const controller = new AbortController()
    request.current.controller = controller
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/admin/users?q=' + encodeURIComponent(target.query) + '&page=' + target.page, { signal: controller.signal })
      if (!mounted.current || sequence !== request.current.sequence) return
      const lastPage = Math.max(1, data.totalPages)
      if (target.page > lastPage) {
        view.current = { ...target, page: lastPage }
        setPage(lastPage)
        return
      }
      setUsers(data.users)
      setSnapshot({ ...target, total: data.total, totalPages: lastPage })
      setDrafts((current) => {
        const next = { ...current }
        for (const user of data.users) if (!dirty.current[user.id] && !locks.current.has(user.id)) next[user.id] = { name: user.name, role: user.role }
        return next
      })
    } catch (requestError) {
      if (mounted.current && sequence === request.current.sequence && requestError.name !== 'AbortError') setError(requestError.message)
    } finally {
      if (mounted.current && sequence === request.current.sequence) setLoading(false)
    }
  }, [invalidate])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; invalidate() }
  }, [invalidate])

  useEffect(() => {
    const timer = window.setTimeout(loadUsers, search ? 250 : 0)
    return () => { window.clearTimeout(timer); invalidate() }
  }, [search, page, loadUsers, invalidate])

  const changeView = (query, nextPage) => {
    invalidate()
    view.current = { query: queryFor(query), page: nextPage }
    setSearch(query)
    setPage(nextPage)
    setLoading(true)
    setError('')
  }

  const editDraft = (user, changes) => {
    const next = { ...(drafts[user.id] || { name: user.name, role: user.role }), ...changes }
    dirty.current[user.id] = true
    setDrafts((current) => ({ ...current, [user.id]: next }))
    setFieldErrors((current) => ({ ...current, [user.id]: next.name.trim().length < 2 || next.name.trim().length > 80 ? 'Họ tên cần từ 2 đến 80 ký tự.' : '' }))
  }

  const writeUser = async (user, payload, kind) => {
    if (locks.current.has(user.id)) return
    locks.current.add(user.id)
    setPendingActions((current) => ({ ...current, [user.id]: kind }))
    setMessage(null)
    invalidate()
    try {
      const data = await apiRequest('/api/admin/users/' + user.id, { method: 'PATCH', body: JSON.stringify(payload) })
      if (!mounted.current) return
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, ...data.user } : item))
      if (kind === 'save') {
        delete dirty.current[user.id]
        setDrafts((current) => ({ ...current, [user.id]: { name: data.user.name, role: data.user.role } }))
      }
      setMessage({ type: 'success', text: kind === 'save' ? 'Đã cập nhật tài khoản ' + data.user.email + '.' : payload.isActive ? 'Đã mở lại tài khoản.' : 'Đã khóa tài khoản và thu hồi các phiên đăng nhập.' })
    } catch (requestError) {
      if (mounted.current) setMessage({ type: 'error', text: requestError.status === 409 ? requestError.message + ' Các khóa học hoặc lượt tham gia liên kết cần được xử lý trước khi đổi vai trò.' : requestError.message })
    } finally {
      locks.current.delete(user.id)
      if (mounted.current) {
        setPendingActions((current) => ({ ...current, [user.id]: null }))
        void loadUsers()
      }
    }
  }

  const requestSave = (user) => {
    if (locks.current.has(user.id)) return
    const draft = drafts[user.id] || { name: user.name, role: user.role }
    const payload = { name: draft.name.trim(), role: draft.role }
    if (payload.name.length < 2 || payload.name.length > 80 || !['INSTRUCTOR', 'STUDENT'].includes(payload.role)) {
      setFieldErrors((current) => ({ ...current, [user.id]: 'Họ tên cần từ 2 đến 80 ký tự; chọn vai trò hợp lệ.' }))
      document.getElementById('user-name-' + user.id)?.focus()
      return
    }
    if (payload.role !== user.role) setConfirmation({ title: 'Xác nhận đổi vai trò', message: 'Đổi ' + user.email + ' từ ' + roleName(user.role) + ' sang ' + roleName(payload.role) + '? Tài khoản còn khóa học đang dạy hoặc đang tham gia có thể chưa đổi được vai trò.', confirmLabel: 'Đổi vai trò', onConfirm: () => writeUser(user, payload, 'save') })
    else void writeUser(user, payload, 'save')
  }

  const requestToggle = (user) => {
    if (locks.current.has(user.id)) return
    const payload = { isActive: !user.isActive }
    setConfirmation({ title: user.isActive ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?', message: user.isActive ? 'Khóa ' + user.email + '. Các phiên hiện tại sẽ bị thu hồi và người dùng không thể truy cập cho đến khi mở lại.' : 'Cho phép ' + user.email + ' đăng nhập và sử dụng hệ thống trở lại.', confirmLabel: user.isActive ? 'Khóa tài khoản' : 'Mở khóa', danger: user.isActive, onConfirm: () => writeUser(user, payload, 'active') })
  }

  const currentSnapshot = snapshot && snapshot.query === queryFor(search) && snapshot.page === page
  return <main className="admin-main role-dashboard role-dashboard--admin">
    <section className="account-heading"><span className="eyebrow">QUẢN TRỊ HỆ THỐNG</span><h1>Giảng viên và học viên</h1><p>Quản lý hồ sơ, vai trò và quyền truy cập. Tài khoản Admin không xuất hiện trong danh sách này.</p></section>
    <section className="admin-toolbar"><label htmlFor="admin-search">Tìm theo tên hoặc email<input id="admin-search" type="search" value={search} onChange={(event) => changeView(event.target.value, 1)} placeholder="Nhập tên hoặc email…" /></label><strong>{snapshot ? snapshot.total + ' tài khoản' + (currentSnapshot ? '' : ' · kết quả trước') : loading ? 'Đang tìm…' : 'Chưa tải được tổng số'}</strong></section>
    {message && <StatusMessage type={message.type}>{message.text}</StatusMessage>}
    {error && <ErrorState title={snapshot ? 'Chưa làm mới được danh sách' : 'Không thể tải tài khoản'} onRetry={loadUsers}>{error}{message?.type === 'success' ? ' Thay đổi đã được lưu; thử lại chỉ tải danh sách.' : ''}</ErrorState>}
    {loading && <LoadingState>{snapshot ? 'Đang cập nhật danh sách…' : 'Đang tải tài khoản…'}</LoadingState>}
    {snapshot && <>
      {(!currentSnapshot || error) && <p className="refetching-status">Kết quả trước đó — chưa cập nhật theo tìm kiếm/trang hiện tại.</p>}
      {!users.length ? <EmptyState title={snapshot.query ? 'Không tìm thấy tài khoản' : 'Chưa có tài khoản'}>{snapshot.query ? 'Thử thay đổi cụm từ tìm kiếm.' : 'Các tài khoản học viên và giảng viên sẽ xuất hiện tại đây.'}</EmptyState> : <div className="admin-user-list">{users.map((user) => {
        const draft = drafts[user.id] || { name: user.name, role: user.role }
        const changed = draft.name !== user.name || draft.role !== user.role
        const valid = draft.name.trim().length >= 2 && draft.name.trim().length <= 80 && ['INSTRUCTOR', 'STUDENT'].includes(draft.role)
        const pending = pendingActions[user.id]
        return <article className="admin-user-card" key={user.id} aria-busy={Boolean(pending)}>
          <div className="admin-user-heading"><div><strong className="admin-email">{user.email}</strong><span className="admin-effective-role">{roleName(user.role)}</span><span className={'account-status ' + (user.isActive ? 'active' : 'inactive')}>{user.isActive ? 'Đang hoạt động' : 'Đã khóa'}</span></div><small>Tham gia {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}</small></div>
          <div className="admin-user-fields"><label htmlFor={'user-name-' + user.id}>Họ tên<input id={'user-name-' + user.id} value={draft.name} disabled={Boolean(pending)} aria-invalid={Boolean(fieldErrors[user.id])} aria-describedby={fieldErrors[user.id] ? 'user-error-' + user.id : undefined} onChange={(event) => editDraft(user, { name: event.target.value })} /></label>
            <label htmlFor={'user-role-' + user.id}>Vai trò<select id={'user-role-' + user.id} value={draft.role} disabled={Boolean(pending)} onChange={(event) => editDraft(user, { role: event.target.value })}><option value="INSTRUCTOR">Giảng viên</option><option value="STUDENT">Học viên</option></select></label>
            <div className="admin-user-stats"><span>{user.role === 'INSTRUCTOR' ? user._count?.courses ?? '—' : user._count?.enrollments ?? '—'}</span>{user.role === 'INSTRUCTOR' ? 'khóa học đang sở hữu' : 'khóa học đã tham gia'}<span>{user._count?.submissions ?? '—'}</span>bài nộp</div>
            <div className="form-actions"><button className="ui-button ui-button-primary" type="button" disabled={!changed || !valid || Boolean(pending)} onClick={() => requestSave(user)}>{pending === 'save' ? 'Đang lưu…' : 'Lưu thay đổi'}</button><button className={'ui-button ' + (user.isActive ? 'ui-button-danger' : 'ui-button-secondary')} type="button" disabled={Boolean(pending)} onClick={() => requestToggle(user)}>{pending === 'active' ? 'Đang cập nhật…' : user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}</button></div>
          </div>
          {fieldErrors[user.id] && <span id={'user-error-' + user.id} className="field-error" role="alert">{fieldErrors[user.id]}</span>}
        </article>
      })}</div>}
      {snapshot.totalPages > 1 && <div className="admin-pagination"><button type="button" disabled={page <= 1 || loading} onClick={() => changeView(search, page - 1)}>Trang trước</button><span>Trang {snapshot.page}/{snapshot.totalPages}{!currentSnapshot ? ' · kết quả trước' : ''}</span><button type="button" disabled={page >= snapshot.totalPages || loading} onClick={() => changeView(search, page + 1)}>Trang sau</button></div>}
    </>}
    {confirmation && <ConfirmDialog {...confirmation} onCancel={() => setConfirmation(null)} onConfirm={() => { const confirm = confirmation.onConfirm; setConfirmation(null); void confirm() }} />}
  </main>
}
export default AdminPage
