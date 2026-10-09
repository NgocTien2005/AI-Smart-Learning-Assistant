import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest, clearSession, getStoredUser, updateStoredUser } from '../services/api.js'
import './LearningApp.css'

function AccountPage() {
  const initialUser = getStoredUser()
  const [user, setUser] = useState(initialUser)
  const [name, setName] = useState(initialUser?.name || '')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmation: '' })
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordChanged, setPasswordChanged] = useState(false)

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

  const changePassword = async (event) => {
    event.preventDefault()
    setPasswordMessage('')
    if (passwordForm.newPassword !== passwordForm.confirmation) {
      setPasswordMessage('Mật khẩu xác nhận không khớp.')
      return
    }

    setSubmitting(true)
    try {
      const data = await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
      })
      clearSession()
      setPasswordChanged(true)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmation: '' })
      setPasswordMessage(data.message)
    } catch (error) {
      setPasswordMessage(error.message)
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
          <dl><div><dt>Email</dt><dd>{user?.email}</dd></div><div><dt>Vai trò</dt><dd>{user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Học viên'}</dd></div></dl>
          <form onSubmit={updateProfile}><label htmlFor="profile-name">Họ và tên<input id="profile-name" value={name} onChange={(event) => { setName(event.target.value); setMessage('') }} minLength="2" maxLength="80" required /></label><button className="primary-button" disabled={submitting}>{submitting ? 'Đang lưu…' : 'Lưu hồ sơ'}</button></form>
          {message && <p className="inline-message" role="status">{message}</p>}
        </section>
        <section className="management-card account-card">
          <h2>Đổi mật khẩu</h2>
          {passwordChanged ? <div className="password-changed"><p>{passwordMessage}</p><Link className="primary-button" to="/auth">Đăng nhập lại</Link></div> : <form onSubmit={changePassword}><label htmlFor="current-password">Mật khẩu hiện tại<input id="current-password" type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => { setPasswordForm({ ...passwordForm, currentPassword: event.target.value }); setPasswordMessage('') }} minLength="6" maxLength="72" required /></label><label htmlFor="account-new-password">Mật khẩu mới<input id="account-new-password" type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => { setPasswordForm({ ...passwordForm, newPassword: event.target.value }); setPasswordMessage('') }} minLength="6" maxLength="72" required /></label><label htmlFor="account-confirm-password">Xác nhận mật khẩu mới<input id="account-confirm-password" type="password" autoComplete="new-password" value={passwordForm.confirmation} onChange={(event) => { setPasswordForm({ ...passwordForm, confirmation: event.target.value }); setPasswordMessage('') }} minLength="6" maxLength="72" required /></label><button className="primary-button" disabled={submitting}>{submitting ? 'Đang đổi…' : 'Đổi mật khẩu'}</button></form>}
          {passwordMessage && !passwordChanged && <p className="inline-message" role="status">{passwordMessage}</p>}
        </section>
      </main>
    </div>
  )
}

export default AccountPage
