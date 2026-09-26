import { useEffect, useState } from 'react'
import './App.css'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')
const TOKEN_KEY = 'luminaToken'
const USER_KEY = 'luminaUser'

const clearSession = () => {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem(TOKEN_KEY)
    storage.removeItem(USER_KEY)
  }
}

const saveSession = (token, user, persistent) => {
  clearSession()
  const storage = persistent ? localStorage : sessionStorage
  storage.setItem(TOKEN_KEY, token)
  storage.setItem(USER_KEY, JSON.stringify(user))
}

const getToken = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)

const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, options)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Có lỗi xảy ra, vui lòng thử lại.')
  return data
}

function BrandPanel({ isRegister }) {
  return (
    <section className="brand-panel" aria-label="Lumina LMS">
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
            <p>Nền tảng học tập được hỗ trợ bởi AI, được thiết kế để nâng cao tiềm năng của bạn.</p>
          </>
        )}
      </div>
      {!isRegister && <div className="brand-logo"><span>◆</span> Lumina LMS</div>}
    </section>
  )
}

const navigationItems = [
  ['⌂', 'Trang chủ'],
  ['◇', 'Khóa học'],
  ['▧', 'Bài tập'],
  ['✣', 'AI Lab'],
  ['◎', 'Hồ sơ'],
]

function Sidebar({ user, onLogout }) {
  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-brand"><span>L</span><strong>Lumina<br />Academy</strong></div>
      <small>AI-Powered Learning</small>
      <nav aria-label="Điều hướng chính">
        {navigationItems.map(([icon, label], index) => (
          <button key={label} type="button" className={index === 0 ? 'active' : ''} disabled={index !== 0} title={index === 0 ? undefined : 'Tính năng đang được phát triển'}>
            <span aria-hidden="true">{icon}</span>{label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button type="button" className="upgrade-button">Nâng cấp Pro</button>
        <button type="button" disabled><span aria-hidden="true">?</span> Trợ giúp</button>
        <button type="button" onClick={onLogout}><span aria-hidden="true">↪</span> Đăng xuất</button>
        <p title={user.email}>{user.email}</p>
      </div>
    </aside>
  )
}

function DashboardHeader({ user }) {
  const initial = user.name?.trim().charAt(0).toUpperCase() || 'L'
  return (
    <header className="dashboard-topbar">
      <div className="mobile-brand">Lumina</div>
      <div className="topbar-actions">
        <button type="button" aria-label="Thông báo">♧</button>
        <button type="button" aria-label="Cài đặt">⚙</button>
        <span className="user-avatar" title={`${user.name} · ${user.email}`}>{initial}</span>
      </div>
    </header>
  )
}

function AiInsight({ instructor = false }) {
  return (
    <section className={`ai-insight ${instructor ? 'instructor-insight' : ''}`}>
      <h2><span aria-hidden="true">✣</span> AI Insights</h2>
      <p>{instructor
        ? '15% sinh viên đang gặp khó khăn ở chương “Con trỏ trong C++”.'
        : 'Dựa trên kết quả gần nhất, hệ thống khuyên bạn ôn lại phần Cấu trúc dữ liệu.'}</p>
      <div className="insight-tip"><span aria-hidden="true">♢</span><span><strong>{instructor ? 'Gợi ý giảng dạy' : 'Ôn tập chương 3'}</strong><small>{instructor ? 'Tạo thêm bài thảo luận hoặc cung cấp bài tập thực hành.' : 'Dành 20 phút để củng cố kiến thức.'}</small></span></div>
      <button type="button">✦ {instructor ? 'Tạo buổi thảo luận' : 'Bắt đầu ôn tập'}</button>
    </section>
  )
}

function StudentDashboard({ user }) {
  return (
    <>
      <section className="dashboard-welcome">
        <h1>Chào buổi sáng, {user.name?.split(' ').at(-1) || 'bạn'}! <span aria-hidden="true">👋</span></h1>
        <p>Sẵn sàng tiếp tục hành trình học tập hôm nay chưa?</p>
      </section>
      <div className="student-dashboard-grid">
        <div className="dashboard-main-column">
          <section className="dashboard-card learning-path">
            <div><h2>Lộ trình học tập cá nhân</h2><p>Hoàn thành Chứng chỉ Web Fullstack</p></div>
            <strong>65%</strong>
            <div className="progress-track"><span style={{ width: '65%' }} /></div>
            <div className="progress-labels"><span>Cơ bản</span><span>Trung cấp</span><span className="current">Hiện tại</span><span>Nâng cao</span></div>
          </section>
          <section className="course-section">
            <h2>Khóa học của tôi</h2>
            <div className="course-grid">
              <article className="course-card"><div className="course-cover code-cover">‹ ›</div><div className="course-body"><span>Tiến độ: 80%</span><h3>Lập trình Web nâng cao</h3><p>React, Node.js &amp; Cơ sở dữ liệu</p><div className="progress-track"><span style={{ width: '80%' }} /></div><button type="button">Tiếp tục học</button></div></article>
              <article className="course-card"><div className="course-cover idea-cover">♙</div><div className="course-body"><span>Tiến độ: 30%</span><h3>Trí tuệ nhân tạo cơ bản</h3><p>Machine Learning &amp; Neural Networks</p><div className="progress-track"><span style={{ width: '30%' }} /></div><button type="button">Tiếp tục học</button></div></article>
            </div>
          </section>
        </div>
        <aside className="dashboard-side-column">
          <AiInsight />
          <section className="dashboard-card recent-activity"><h2>Hoạt động gần đây</h2><ul><li><span className="activity-icon success">✓</span><span>Hoàn thành bài giảng<strong>Context API</strong><small>Hôm nay, 10:30 AM</small></span></li><li><span className="activity-icon warning">!</span><span>Nhận huy hiệu<strong>Chăm chỉ</strong><small>Hôm nay, 9:15 AM</small></span></li><li><span className="activity-icon info">▧</span><span>Đã nộp Quiz Chương 3<small>Hôm qua, 14:00 PM</small></span></li></ul></section>
        </aside>
      </div>
    </>
  )
}

function InstructorDashboard({ user }) {
  const bars = [18, 34, 58, 80, 52, 30, 15]
  return (
    <>
      <section className="dashboard-welcome instructor-welcome">
        <div><h1>Instructor Dashboard</h1><p>Chào mừng trở lại, {user.name}. Đây là tổng quan các lớp học của bạn.</p></div>
        <button type="button" className="primary-action">＋ Tạo khóa học</button>
      </section>
      <div className="instructor-dashboard-grid">
        <div className="dashboard-main-column">
          <section className="stat-grid"><article><span>♟</span><p>Tổng quan lớp học</p><strong>120</strong><small>↗ 12% tuần này</small></article><article><span>◎</span><p>Tỷ lệ hoàn thành</p><strong>92%</strong><div className="progress-track"><span style={{ width: '92%' }} /></div></article><article><span>✧</span><p>Điểm trung bình</p><strong>8.5</strong><small>/ 10.0</small></article></section>
          <section className="dashboard-card lesson-management"><header><h2>Quản lý bài giảng</h2><button type="button">Xem tất cả</button></header><div><span>▧</span><p><strong>C++ Basics - Chapter 1</strong><small>PDF · 2.4 MB</small></p><button type="button">✣ AI Quiz Generator</button></div><div><span>▧</span><p><strong>Con trỏ trong C++ - Chapter 2</strong><small>PDF · 3.1 MB</small></p><button type="button">✣ AI Quiz Generator</button></div></section>
          <section className="dashboard-card student-chart"><h2>Phân tích sinh viên</h2><div className="chart" aria-label="Biểu đồ hoạt động sinh viên">{bars.map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div></section>
        </div>
        <aside className="dashboard-side-column"><AiInsight instructor /><section className="dashboard-card grading"><header><h2>Cần chấm điểm</h2><span>5<br /><small>Pending</small></span></header><article><p>Assignment: Pointers Lab<small>Submitted by Nguyen Van A</small></p><div><button type="button">Grade</button><button type="button">View</button></div></article><article><p>Midterm Project<small>Submitted by Tran Thi B</small></p><div><button type="button">Grade</button><button type="button">View</button></div></article></section></aside>
      </div>
    </>
  )
}

function Dashboard({ user, onLogout }) {
  return (
    <main className="dashboard-shell">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="dashboard-page">
        <DashboardHeader user={user} />
        <div className="dashboard-content">{user.role === 'INSTRUCTOR' ? <InstructorDashboard user={user} /> : <StudentDashboard user={user} />}</div>
      </div>
    </main>
  )
}

function App() {
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('STUDENT')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(() => Boolean(getToken()))
  const [currentUser, setCurrentUser] = useState(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const isRegister = mode === 'register'

  useEffect(() => {
    const token = getToken()
    if (!token) {
      return undefined
    }

    const controller = new AbortController()
    apiRequest('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(({ user }) => setCurrentUser(user))
      .catch((error) => {
        if (error.name !== 'AbortError') clearSession()
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsRestoring(false)
      })

    return () => controller.abort()
  }, [])

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setMessage('')
    setMessageType('')
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setShowPassword(false)
    setMessage('')
    setMessageType('')
  }

  const logout = () => {
    clearSession()
    setCurrentUser(null)
    setForm({ name: '', email: '', password: '' })
    setMode('login')
    setMessage('Bạn đã đăng xuất an toàn.')
    setMessageType('success')
  }

  const submit = async (event) => {
    event.preventDefault()
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
    const payload = isRegister
      ? { name: form.name.trim(), email: form.email.trim(), password: form.password, role }
      : { email: form.email.trim(), password: form.password }

    setIsSubmitting(true)
    setMessage('')
    setMessageType('')

    try {
      const data = await apiRequest(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      saveSession(data.token, data.user, isRegister || rememberMe)
      setCurrentUser(data.user)
      setForm((current) => ({ ...current, password: '' }))
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof TypeError ? 'Không thể kết nối tới máy chủ.' : error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isRestoring) {
    return <main className="app-loading" role="status"><span className="spinner" />Đang khôi phục phiên đăng nhập…</main>
  }

  if (currentUser) {
    return <Dashboard user={currentUser} onLogout={logout} />
  }

  return (
    <main className={`auth-page ${isRegister ? 'register-page' : 'login-page'}`}>
      <div className="auth-layout">
        <BrandPanel isRegister={isRegister} />
        <section className={`form-panel ${isRegister ? 'register-form-panel' : ''}`}>
          {(
            <form className="auth-card" onSubmit={submit} noValidate={false}>
              {isRegister && <div className="accent-line" />}
              <header className="form-heading">
                <h2>{isRegister ? 'Tạo tài khoản mới' : 'Đăng nhập'}</h2>
                <p>{isRegister ? 'Tạo hồ sơ để bắt đầu học tập cùng Lumina.' : 'Nhập thông tin để truy cập tài khoản của bạn.'}</p>
              </header>

              {isRegister && (
                <fieldset className="role-picker">
                  <legend>Chọn vai trò</legend>
                  <button type="button" aria-pressed={role === 'STUDENT'} className={role === 'STUDENT' ? 'selected' : ''} onClick={() => setRole('STUDENT')}><span>♢</span>Học viên</button>
                  <button type="button" aria-pressed={role === 'INSTRUCTOR'} className={role === 'INSTRUCTOR' ? 'selected' : ''} onClick={() => setRole('INSTRUCTOR')}><span>♧</span>Giảng viên</button>
                </fieldset>
              )}

              <div className="form-fields">
                {isRegister && <label htmlFor="name">Họ và tên<div className="input-wrap"><span aria-hidden="true">♙</span><input id="name" name="name" autoComplete="name" value={form.name} onChange={updateField} placeholder="Nguyễn Văn A" minLength="2" maxLength="80" required /></div></label>}
                <label htmlFor="email">Email<div className="input-wrap"><span aria-hidden="true">✉</span><input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} placeholder="email@example.com" maxLength="254" required /></div></label>
                <label htmlFor="password">Mật khẩu<div className="input-wrap"><span aria-hidden="true">▣</span><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={updateField} placeholder="Từ 6 đến 72 ký tự" minLength="6" maxLength="72" required /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword}>{showPassword ? '◌' : '◉'}</button></div></label>
              </div>

              {!isRegister && <div className="form-options"><label className="remember"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /> Ghi nhớ đăng nhập</label><span className="coming-soon" title="Tính năng đang được phát triển">Quên mật khẩu? · Sắp có</span></div>}
              <button className="submit-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang xử lý…' : isRegister ? 'Đăng ký ngay  →' : 'Đăng nhập'}</button>
              {message && <p className={`form-message ${messageType}`} role="status" aria-live="polite">{message}</p>}

              <div className="divider"><span>Đăng nhập mạng xã hội · Sắp có</span></div>
              <div className="social-buttons" aria-label="Đăng nhập mạng xã hội đang được phát triển"><button type="button" disabled><b>G</b> Google</button><button type="button" disabled><b>⊞</b> Microsoft</button></div>
              <p className="switch-copy">{isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} <button type="button" onClick={() => switchMode(isRegister ? 'login' : 'register')}>{isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}</button></p>
              {isRegister && <p className="terms">Bằng việc đăng ký, bạn đồng ý với điều khoản sử dụng và chính sách bảo mật của Lumina.</p>}
            </form>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
