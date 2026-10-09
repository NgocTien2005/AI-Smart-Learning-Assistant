import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useSession } from '../app/SessionContext.jsx'
import { apiRequest } from '../services/api.js'
import { resolvePostLoginDestination, roleHome } from '../services/navigation.js'

function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, status, acceptCredentials } = useSession()
  const loginCompletedRef = useRef(false)
  const initialMode = searchParams.get('mode') === 'forgot' ? 'forgot' : 'login'
  const [mode, setMode] = useState(initialMode)
  const [role, setRole] = useState('STUDENT')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const initialNotice = location.state?.sessionExpired
    ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    : location.state?.passwordChanged ? 'Mật khẩu đã được thay đổi. Hãy đăng nhập bằng mật khẩu mới.' : ''
  const [message, setMessage] = useState(initialNotice)
  const [messageType, setMessageType] = useState(location.state?.sessionExpired ? 'error' : location.state?.passwordChanged ? 'success' : '')
  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'

  useEffect(() => {
    if (status === 'authenticated' && user && !isSubmitting && !loginCompletedRef.current) navigate(roleHome(user.role), { replace: true })
  }, [status, user, navigate, isSubmitting])

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
    setMessage('')
    setMessageType('')
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setSearchParams(nextMode === 'forgot' ? { mode: 'forgot' } : {})
    setMessage('')
    setMessageType('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setMessage('')
    setMessageType('')
    if (isRegister && form.name.trim().length < 2) {
      setMessageType('error')
      setMessage('Họ và tên cần có ít nhất 2 ký tự.')
      return
    }
    setIsSubmitting(true)
    try {
      if (isForgot) {
        const data = await apiRequest('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: form.email.trim() }) })
        setMessageType('success')
        setMessage(data.message || 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.')
        return
      }

      const data = await apiRequest(isRegister ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(isRegister
          ? { name: form.name.trim(), email: form.email.trim(), password: form.password, role }
          : { email: form.email.trim(), password: form.password }),
      })
      const validatedUser = await acceptCredentials(data, rememberMe || isRegister)
      loginCompletedRef.current = true
      setMessageType('success')
      setMessage(isRegister ? 'Tạo tài khoản thành công.' : 'Đăng nhập thành công.')
      navigate(resolvePostLoginDestination(location.state?.from, validatedUser.role, window.location.origin), { replace: true })
    } catch (error) {
      setMessageType('error')
      if (error.status === 429) setMessage('Bạn đã yêu cầu quá nhiều lần đặt lại mật khẩu. Hãy thử lại sau 15 phút.')
      else if (error.status === 503) setMessage('Dịch vụ email chưa sẵn sàng. Hãy liên hệ quản trị viên để kiểm tra cấu hình SMTP.')
      else setMessage(error.message)
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
            {isRegister ? <div className="glass-copy"><h1>Lumina LMS</h1><h2>Bắt đầu hành trình học tập<br />cùng Lumina.</h2><div className="benefit"><span className="benefit-icon">✦</span><span>Ôn tập từ nội dung bài học.</span></div><div className="benefit"><span className="benefit-icon violet">⌁</span><span>Theo dõi tiến độ, bài nộp và kết quả.</span></div></div> : <><h1>Chào mừng trở lại<br />với Lumina LMS.</h1><p>Nền tảng học tập dành cho học viên, giảng viên và quản trị viên.</p></>}
          </div>
          {!isRegister && <div className="brand-logo"><span>◆</span> Lumina LMS</div>}
        </section>
        <section className={`form-panel ${isRegister ? 'register-form-panel' : ''}`}>
          <form className="auth-card" onSubmit={submit}>
            {isRegister && <div className="accent-line" />}
            <header className="form-heading"><h2>{isForgot ? 'Quên mật khẩu' : isRegister ? 'Tạo tài khoản mới' : 'Đăng nhập'}</h2>{!isRegister && <p>{isForgot ? 'Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.' : 'Nhập thông tin tài khoản để tiếp tục.'}</p>}</header>
            {isRegister && <div className="role-picker" aria-label="Chọn vai trò"><button type="button" aria-pressed={role === 'STUDENT'} className={role === 'STUDENT' ? 'selected' : ''} onClick={() => setRole('STUDENT')}><span aria-hidden="true">♢</span>Học viên</button><button type="button" aria-pressed={role === 'INSTRUCTOR'} className={role === 'INSTRUCTOR' ? 'selected' : ''} onClick={() => setRole('INSTRUCTOR')}><span aria-hidden="true">♧</span>Giảng viên</button></div>}
            <div className="form-fields">
              {isRegister && <label htmlFor="name">Họ và tên<div className="input-wrap"><span aria-hidden="true">♙</span><input id="name" name="name" autoComplete="name" value={form.name} onChange={updateField} placeholder="Nguyễn Văn A" minLength="2" maxLength="80" required /></div></label>}
              <label htmlFor="email">Email<div className="input-wrap"><span aria-hidden="true">✉</span><input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} placeholder="email@example.com" maxLength="254" required /></div></label>
              {!isForgot && <label htmlFor="password">Mật khẩu<div className="input-wrap"><span aria-hidden="true">▣</span><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={updateField} placeholder="Từ 6 đến 72 ký tự" minLength="6" maxLength="72" required /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword}>{showPassword ? '◌' : '◉'}</button></div></label>}
            </div>
            {!isRegister && !isForgot && <div className="form-options"><label className="remember"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /> Ghi nhớ đăng nhập</label><button className="text-button" type="button" onClick={() => switchMode('forgot')}>Quên mật khẩu?</button></div>}
            <button className="submit-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang xử lý…' : isForgot ? 'Gửi liên kết đặt lại' : isRegister ? 'Đăng ký ngay →' : 'Đăng nhập'}</button>
            {message && <p className={`form-message ${messageType}`} role={messageType === 'error' ? 'alert' : 'status'}>{message}</p>}
            <p className="switch-copy">{isForgot ? 'Đã nhớ mật khẩu?' : isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} <button type="button" onClick={() => switchMode(isForgot || isRegister ? 'login' : 'register')}>{isForgot || isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}</button></p>
            {isRegister && <p className="terms">Bằng việc đăng ký, bạn đồng ý với <Link to="/terms">Điều khoản dịch vụ</Link> và <Link to="/privacy">Chính sách bảo mật</Link>.</p>}
          </form>
        </section>
      </div>
    </main>
  )
}

export default AuthPage
