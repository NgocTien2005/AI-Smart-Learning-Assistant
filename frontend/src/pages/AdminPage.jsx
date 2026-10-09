import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../services/api.js'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { EmptyState, ErrorState, LoadingState, StatusMessage } from '../components/ui/Feedback.jsx'
import './LearningApp.css'

function AdminPage() {
  const [users, setUsers] = useState([])
  const [drafts, setDrafts] = useState({})
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingActions, setPendingActions] = useState({})
  const [message, setMessage] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const requestSequence = useRef(0)
  const dirtyDraftsRef = useRef({})

  const loadUsers = useCallback(async (query, requestedPage, signal) => {
    const sequence = ++requestSequence.current
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest(`/api/admin/users?q=${encodeURIComponent(query)}&page=${requestedPage}`, { signal })
      if (requestSequence.current !== sequence) return
      setUsers(data.users)
      setTotal(data.total)
      setTotalPages(Math.max(1, data.totalPages))
      setDrafts((current) => {
        const next = { ...current }
        for (const user of data.users) if (!dirtyDraftsRef.current[user.id]) next[user.id] = { name: user.name, role: user.role }
        return next
      })
      setMessage(null)
    } catch (requestError) {
      if (requestError.name !== 'AbortError' && requestSequence.current === sequence) setError(requestError.message)
    } finally {
      if (requestSequence.current === sequence) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => loadUsers(search, page, controller.signal), search ? 250 : 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
      requestSequence.current += 1
    }
  }, [search, page, loadUsers])

  const editDraft = (user, changes) => {
    dirtyDraftsRef.current[user.id] = true
    setDrafts((current) => ({ ...current, [user.id]: { ...(current[user.id] || { name: user.name, role: user.role }), ...changes } }))
  }

  const setPending = (key, active) => setPendingActions((current) => ({ ...current, [key]: active }))

  const saveUser = async (user) => {
    const draft = drafts[user.id] || { name: user.name, role: user.role }
    const key = `${user.id}:save`
    setPending(key, true)
    setMessage(null)
    try {
      const data = await apiRequest(`/api/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ name: draft.name.trim(), role: draft.role }) })
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, ...data.user } : item))
      setDrafts((current) => ({ ...current, [user.id]: { name: data.user.name, role: data.user.role } }))
      delete dirtyDraftsRef.current[user.id]
      const query = search.trim().toLocaleLowerCase('vi')
      if (query && !`${data.user.name} ${data.user.email}`.toLocaleLowerCase('vi').includes(query)) {
        setUsers((current) => current.filter((item) => item.id !== user.id))
        setTotal((current) => Math.max(0, current - 1))
      }
      setMessage({ type: 'success', text: `Đã cập nhật tài khoản ${data.user.email}.` })
    } catch (requestError) {
      const linkedConflict = requestError.status === 409
      setMessage({ type: 'error', text: linkedConflict ? `${requestError.message} Các khóa học hoặc lượt tham gia liên kết cần được xử lý trước khi đổi vai trò.` : requestError.message })
    } finally {
      setPending(key, false)
    }
  }

  const toggleUser = async (user) => {
    const nextActive = !user.isActive
    const key = `${user.id}:active`
    setPending(key, true)
    setMessage(null)
    try {
      const data = await apiRequest(`/api/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: nextActive }) })
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, ...data.user } : item))
      setMessage({ type: 'success', text: nextActive ? 'Đã mở lại tài khoản.' : 'Đã khóa tài khoản và thu hồi các phiên đăng nhập.' })
    } catch (requestError) {
      setMessage({ type: 'error', text: requestError.message })
    } finally {
      setPending(key, false)
    }
  }

  const requestSave = (user) => {
    const draft = drafts[user.id] || { name: user.name, role: user.role }
    if (draft.role !== user.role) setConfirmation({ title: 'Xác nhận đổi vai trò', message: `Đổi vai trò của ${user.email}? Backend sẽ từ chối nếu tài khoản còn khóa học do giảng dạy hoặc đang tham gia.`, confirmLabel: 'Đổi vai trò', onConfirm: () => saveUser(user) })
    else saveUser(user)
  }

  const requestToggle = (user) => setConfirmation({
    title: user.isActive ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?',
    message: user.isActive ? `Khóa ${user.email}. Các phiên hiện tại sẽ bị thu hồi và người dùng không thể truy cập cho đến khi mở lại.` : `Cho phép ${user.email} đăng nhập và sử dụng hệ thống trở lại.`,
    confirmLabel: user.isActive ? 'Khóa tài khoản' : 'Mở khóa',
    danger: user.isActive,
    onConfirm: () => toggleUser(user),
  })

  return <main className="admin-main">
    <section className="account-heading"><span className="eyebrow">QUẢN TRỊ HỆ THỐNG</span><h1>Giảng viên và học viên</h1><p>Quản lý hồ sơ, vai trò và quyền truy cập. Tài khoản Admin không xuất hiện trong danh sách này.</p></section>
    <section className="admin-toolbar"><label htmlFor="admin-search">Tìm theo tên hoặc email<input id="admin-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Nhập tên hoặc email…" /></label><strong>{loading && total === 0 ? 'Đang tìm…' : `${total} tài khoản`}</strong></section>
    {message && <StatusMessage type={message.type}>{message.text}</StatusMessage>}
    {error ? <ErrorState onRetry={() => loadUsers(search, page)}>{error}</ErrorState> : loading && users.length === 0 ? <LoadingState>Đang tải tài khoản…</LoadingState> : users.length === 0 ? <EmptyState title={search ? 'Không tìm thấy tài khoản' : 'Chưa có tài khoản'}>{search ? 'Thử thay đổi cụm từ tìm kiếm.' : 'Các tài khoản học viên và giảng viên sẽ xuất hiện tại đây.'}</EmptyState> : <>
      {loading && <p className="refetching-status" role="status">Đang cập nhật danh sách…</p>}
      <div className="admin-user-list">{users.map((user) => {
        const draft = drafts[user.id] || { name: user.name, role: user.role }
        const changed = draft.name !== user.name || draft.role !== user.role
        const saving = Boolean(pendingActions[`${user.id}:save`])
        const changingActive = Boolean(pendingActions[`${user.id}:active`])
        return <article className="admin-user-card" key={user.id}><div className="admin-user-heading"><div><strong className="admin-email">{user.email}</strong><span className={`account-status ${user.isActive ? 'active' : 'inactive'}`}>{user.isActive ? 'Đang hoạt động' : 'Đã khóa'}</span></div><small>Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}</small></div>
          <div className="admin-user-fields"><label htmlFor={`user-name-${user.id}`}>Họ tên<input id={`user-name-${user.id}`} value={draft.name} maxLength="80" minLength="2" onChange={(event) => editDraft(user, { name: event.target.value })} /></label><label htmlFor={`user-role-${user.id}`}>Vai trò<select id={`user-role-${user.id}`} value={draft.role} onChange={(event) => editDraft(user, { role: event.target.value })}><option value="INSTRUCTOR">Giảng viên</option><option value="STUDENT">Học viên</option></select></label><div className="admin-user-stats"><span>{user.role === 'INSTRUCTOR' ? user._count?.courses ?? '—' : user._count?.enrollments ?? '—'}</span>{user.role === 'INSTRUCTOR' ? 'khóa học đang sở hữu' : 'khóa học đã tham gia'}<span>{user._count?.submissions ?? '—'}</span>bài nộp</div></div>
          <div className="form-actions"><button className="primary-button" type="button" disabled={!changed || saving} onClick={() => requestSave(user)}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button><button className={user.isActive ? 'danger-button' : 'primary-button'} type="button" disabled={changingActive} onClick={() => requestToggle(user)}>{changingActive ? 'Đang cập nhật…' : user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}</button></div>
        </article>
      })}</div>
      {totalPages > 1 && <div className="admin-pagination"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Trang trước</button><span>Trang {page}/{totalPages}</span><button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>Trang sau</button></div>}
    </>}
    {confirmation && <ConfirmDialog {...confirmation} onCancel={() => setConfirmation(null)} onConfirm={async () => { const confirm = confirmation.onConfirm; setConfirmation(null); await confirm() }} />}
  </main>
}

export default AdminPage
