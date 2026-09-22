import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function App() {
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('STUDENT')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const isRegister = mode === 'register'

  useEffect(() => {
    const token = localStorage.getItem('luminaToken') || sessionStorage.getItem('luminaToken')
    if (!token) return

    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('expired')
        const data = await response.json()
        setCurrentUser(data.user)
      })
      .catch(() => {
        localStorage.removeItem('luminaToken')
        localStorage.removeItem('luminaUser')
        sessionStorage.removeItem('luminaToken')
        sessionStorage.removeItem('luminaUser')
      })
  }, [])

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
    setMessage('')
    setMessageType('')
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setMessage('')
    setMessageType('')
    setCurrentUser(null)
  }

  const logout = () => {
    localStorage.removeItem('luminaToken')
    localStorage.removeItem('luminaUser')
    sessionStorage.removeItem('luminaToken')
    sessionStorage.removeItem('luminaUser')
    setCurrentUser(null)
    setForm({ name: '', email: '', password: '' })
    setMessage('Bạn đã đăng xuất.')
    setMessageType('success')
  }

  const submit = async (event) => {
    event.preventDefault()
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
    const payload = isRegister
      ? { email: form.email, password: form.password, role }
      : { email: form.email, password: form.password }

    setIsSubmitting(true)
    setMessage('')
    setMessageType('')

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Có lỗi xảy ra')
      const storage = rememberMe || isRegister ? localStorage : sessionStorage
      const otherStorage = storage === localStorage ? sessionStorage : localStorage
      storage.setItem('luminaToken', data.token)
      storage.setItem('luminaUser', JSON.stringify(data.user))
      otherStorage.removeItem('luminaToken')
      otherStorage.removeItem('luminaUser')
      setCurrentUser(data.user)
      setMessageType('success')
      setMessage(isRegister ? 'Tạo tài khoản thành công.' : 'Đăng nhập thành công.')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message === 'Failed to fetch' ? 'Không thể kết nối tới máy chủ.' : error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={`auth-page ${isRegister ? 'register-page' : 'login-page'}`}>
      <div className="auth-layout">
        <section className="brand-panel">
          <div className="brand-art" />
          <div className="brand-content">
            {isRegister ? (
              <div className="glass-copy">
                <h1>Lumina LMS</h1>
                <h2>Bắt đầu hành trình học tập<br />thông minh cùng AI.</h2>
                <div className="benefit"><span className="benefit-icon">✦</span><span>Cá nhân hóa lộ trình học bằng AI.</span></div>
                <div className="benefit"><span className="benefit-icon violet">⌁</span><span>Phân tích hiệu suất thời gian thực.</span></div>
              </div>
            ) : (
              <>
                <h1>Chào mừng trở lại<br />với tương lai của học<br />tập.</h1>
                <p>Trải nghiệm nền tảng học tập được hỗ trợ bởi AI, được thiết<br className="desktop-only" /> kế để nâng cao tiềm năng của bạn.</p>
              </>
            )}
          </div>
          {!isRegister && <div className="brand-logo"><span>◆</span> Lumina LMS</div>}
        </section>

        <section className={`form-panel ${isRegister ? 'register-form-panel' : ''}`}>
          <form className="auth-card" onSubmit={submit}>
            {isRegister && <div className="accent-line" />}
            <header className="form-heading">
              <h2>{isRegister ? 'Tạo tài khoản mới' : 'Đăng nhập'}</h2>
              {!isRegister && <p>Vui lòng nhập thông tin chi tiết của bạn để truy cập tài khoản.</p>}
            </header>

            {isRegister && (
              <div className="role-picker">
                <button type="button" className={role === 'STUDENT' ? 'selected' : ''} onClick={() => setRole('STUDENT')}><span>♢</span>Học viên</button>
                <button type="button" className={role === 'INSTRUCTOR' ? 'selected' : ''} onClick={() => setRole('INSTRUCTOR')}><span>♧</span>Giảng viên</button>
              </div>
            )}

            <div className="form-fields">
              {isRegister && <label>Họ và tên<div className="input-wrap"><span>♙</span><input name="name" value={form.name} onChange={updateField} placeholder="Nguyễn Văn A" minLength="2" maxLength="80" required /></div></label>}
              <label>Email<div className="input-wrap"><span>✉</span><input name="email" type="email" value={form.email} onChange={updateField} placeholder="email@example.com" required /></div></label>
              <label>Mật khẩu<div className="input-wrap"><span>▣</span><input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} placeholder="••••••••" minLength="6" required /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label="Hiện hoặc ẩn mật khẩu">◉</button></div></label>
            </div>

            {!isRegister && <div className="form-options"><label className="remember"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /> Ghi nhớ đăng nhập</label><button type="button" className="text-button">Quên mật khẩu?</button></div>}
            <button className="submit-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang xử lý...' : isRegister ? 'Đăng ký ngay  →' : 'Đăng nhập'}</button>
            {message && <p className={`form-message ${messageType}`} role="status">{message}</p>}
            {currentUser && <div className="signed-in-user"><span>Xin chào, {currentUser.name || currentUser.email}</span><button type="button" onClick={logout}>Đăng xuất</button></div>}

            <div className="divider"><span>{isRegister ? 'Hoặc đăng ký bằng' : 'Hoặc tiếp tục với'}</span></div>
            <div className="social-buttons"><button type="button"><b>G</b> Google</button><button type="button"><b>{isRegister ? '●' : '⊞'}</b> {isRegister ? 'Apple' : 'Microsoft'}</button></div>
            <p className="switch-copy">{isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} <button type="button" onClick={() => switchMode(isRegister ? 'login' : 'register')}>{isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}</button></p>
            {isRegister && <p className="terms">Bằng việc đăng ký, bạn đồng ý với <u>Điều khoản dịch vụ</u> và <u>Chính sách bảo mật</u><br />của chúng tôi.</p>}
          </form>
        </section>
      </div>
    </main>
  )
}

export default App
