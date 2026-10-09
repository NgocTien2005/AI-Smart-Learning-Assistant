import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { apiRequest, clearSession, getStoredUser } from '../services/api.js'
import './LearningApp.css'

function AdminPage() {
  const navigate = useNavigate()
  const isAdmin = getStoredUser()?.role === 'ADMIN'
  const [users, setUsers] = useState([])
  const [drafts, setDrafts] = useState({})
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    apiRequest(`/api/admin/users?q=${encodeURIComponent(search)}&page=${page}`)
      .then((data) => {
        if (!active) return
        setUsers(data.users)
        setTotal(data.total)
        setTotalPages(Math.max(1, data.totalPages))
        setDrafts(Object.fromEntries(data.users.map((user) => [user.id, { name: user.name, role: user.role }])))
        setMessage('')
      })
      .catch((error) => { if (active) setMessage(error.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [search, page])

  const logout = () => {
    clearSession()
    navigate('/auth', { replace: true })
  }

  const saveUser = async (user) => {
    const draft = drafts[user.id]
    setBusyId(user.id)
    setMessage('')
    try {
      const data = await apiRequest(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: draft.name, role: draft.role }),
      })
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, ...data.user } : item))
      setMessage(`Đã cập nhật tài khoản ${data.user.email}.`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusyId(null)
    }
  }

  const toggleUser = async (user) => {
    const nextActive = !user.isActive
    if (!nextActive && !window.confirm(`Khóa tài khoản ${user.email}? Phiên đăng nhập hiện tại sẽ bị thu hồi.`)) return
    setBusyId(user.id)
    setMessage('')
    try {
      const data = await apiRequest(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextActive }),
      })
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, ...data.user } : item))
      setMessage(nextActive ? 'Đã mở lại tài khoản.' : 'Đã khóa tài khoản và thu hồi các phiên đăng nhập.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusyId(null)
    }
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div className="learning-page">
      <header className="learning-header">
        <Link className="learning-brand" to="/admin"><span>L</span><strong>Lumina LMS · Quản trị</strong></Link>
        <nav><Link to="/account">Tài khoản</Link><button type="button" onClick={logout}>Đăng xuất</button></nav>
      </header>
      <main className="admin-main">
        <section className="account-heading"><span className="eyebrow">QUẢN TRỊ HỆ THỐNG</span><h1>Giảng viên và học viên</h1><p>Quản lý thông tin, vai trò và quyền truy cập tài khoản.</p></section>
        <section className="admin-toolbar">
          <label>Tìm theo tên hoặc email<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Nhập tên hoặc email…" /></label>
          <strong>{total} tài khoản</strong>
        </section>
        {message && <p className="workspace-notice" role="status">{message}</p>}
        {loading ? <div className="empty-state">Đang tải danh sách…</div> : users.length === 0
          ? <div className="empty-state"><strong>Không tìm thấy tài khoản</strong><span>Thử thay đổi cụm từ tìm kiếm.</span></div>
          : <div className="admin-user-list">{users.map((user) => {
            const draft = drafts[user.id] || { name: user.name, role: user.role }
            const changed = draft.name !== user.name || draft.role !== user.role
            return <article className="admin-user-card" key={user.id}>
              <div className="admin-user-heading"><div><strong>{user.email}</strong><span className={user.isActive ? 'account-status active' : 'account-status inactive'}>{user.isActive ? 'Đang hoạt động' : 'Đã khóa'}</span></div><small>Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}</small></div>
              <div className="admin-user-fields">
                <label>Họ tên<input value={draft.name} maxLength="80" minLength="2" onChange={(event) => setDrafts({ ...drafts, [user.id]: { ...draft, name: event.target.value } })} /></label>
                <label>Vai trò<select value={draft.role} onChange={(event) => setDrafts({ ...drafts, [user.id]: { ...draft, role: event.target.value } })}><option value="INSTRUCTOR">Giảng viên</option><option value="STUDENT">Học viên</option></select></label>
                <div className="admin-user-stats"><span>{user.role === 'INSTRUCTOR' ? user._count.courses : user._count.enrollments}</span>{user.role === 'INSTRUCTOR' ? 'khóa học đang sở hữu' : 'khóa học đã tham gia'}<span>{user._count.submissions} bài nộp</span></div>
              </div>
              <div className="form-actions"><button className="primary-button" type="button" disabled={!changed || busyId === user.id} onClick={() => saveUser(user)}>{busyId === user.id ? 'Đang lưu…' : 'Lưu thay đổi'}</button><button className={user.isActive ? 'danger-button' : 'primary-button'} type="button" disabled={busyId === user.id} onClick={() => toggleUser(user)}>{user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}</button></div>
            </article>
          })}</div>}
        {totalPages > 1 && <div className="admin-pagination"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Trang trước</button><span>Trang {page}/{totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Trang sau</button></div>}
      </main>
    </div>
  )
}

export default AdminPage

