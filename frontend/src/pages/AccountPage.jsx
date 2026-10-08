import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest, getStoredUser, updateStoredUser } from '../services/api.js'
import './LearningApp.css'

function AccountPage() {
  const initialUser = getStoredUser()
  const [user, setUser] = useState(initialUser)
  const [name, setName] = useState(initialUser?.name || '')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const updateProfile = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const data = await apiRequest('/api/auth/me', { method: 'PATCH', body: JSON.stringify({ name }) })
      setUser(data.user)
      setName(data.user.name)
      updateStoredUser(data.user)
      setMessage('Đã cập nhật hồ sơ.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="learning-page">
      <header className="learning-header"><Link className="learning-brand" to="/dashboard"><span>L</span><strong>Lumina LMS</strong></Link><nav><Link to="/dashboard">← Dashboard</Link></nav></header>
      <main className="account-main">
        <section className="account-heading"><span className="eyebrow">TÀI KHOẢN</span><h1>Hồ sơ cá nhân</h1><p>Cập nhật tên hiển thị của bạn trên Lumina LMS.</p></section>
        <section className="management-card account-card">
          <dl><div><dt>Email</dt><dd>{user?.email}</dd></div><div><dt>Vai trò</dt><dd>{user?.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Học viên'}</dd></div></dl>
          <form onSubmit={updateProfile}><label htmlFor="profile-name">Họ và tên<input id="profile-name" value={name} onChange={(event) => { setName(event.target.value); setMessage('') }} minLength="2" maxLength="80" required /></label><button className="primary-button" disabled={submitting}>{submitting ? 'Đang lưu…' : 'Lưu hồ sơ'}</button></form>
          {message && <p className="inline-message" role="status">{message}</p>}
        </section>
      </main>
    </div>
  )
}

export default AccountPage
