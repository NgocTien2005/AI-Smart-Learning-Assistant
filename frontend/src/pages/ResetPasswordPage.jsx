import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../services/api.js'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [completed, setCompleted] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setMessage('')

    if (!token) {
      setMessageType('error')
      setMessage('Liên kết đặt lại mật khẩu không hợp lệ.')
      return
    }

    if (password !== confirmation) {
      setMessageType('error')
      setMessage('Mật khẩu xác nhận không khớp.')
      return
    }

    setIsSubmitting(true)
    try {
      const data = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })
      setMessageType('success')
      setMessage(data.message)
      setCompleted(true)
      setPassword('')
      setConfirmation('')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page login-page reset-password-page">
      <div className="reset-password-card">
        <div className="brand-logo reset-brand"><span>◆</span> Lumina LMS</div>
        <header className="form-heading">
          <h2>Đặt lại mật khẩu</h2>
          <p>Tạo mật khẩu mới từ 6 đến 72 ký tự cho tài khoản của bạn.</p>
        </header>

        <form className="auth-card" onSubmit={submit}>
          <div className="form-fields">
            <label htmlFor="new-password">Mật khẩu mới<div className="input-wrap"><span aria-hidden="true">▣</span><input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => { setPassword(event.target.value); setMessage('') }} minLength="6" maxLength="72" disabled={completed} required /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword}>{showPassword ? '◌' : '◉'}</button></div></label>
            <label htmlFor="confirm-password">Xác nhận mật khẩu<div className="input-wrap"><span aria-hidden="true">▣</span><input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setMessage('') }} minLength="6" maxLength="72" disabled={completed} required /></div></label>
          </div>
          {!completed && <button className="submit-button" type="submit" disabled={isSubmitting || !token}>{isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</button>}
          {message && <p className={`form-message ${messageType}`} aria-live="polite">{message}</p>}
          <p className="switch-copy"><Link to="/auth">Quay lại đăng nhập</Link></p>
        </form>
      </div>
    </main>
  )
}

export default ResetPasswordPage
