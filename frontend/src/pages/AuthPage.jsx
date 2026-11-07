import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useSession } from '../app/SessionContext.jsx'
import { apiRequest, getSessionGeneration } from '../services/api.js'
import { resolvePostLoginDestination, roleHome } from '../services/navigation.js'
import { entryError, validateEntry } from '../services/authEntry.js'
import AuthEntryShell, { EntryField } from '../components/AuthEntryShell.jsx'
import { StatusMessage } from '../components/ui/Feedback.jsx'
import GoogleIdentityButton from '../components/GoogleIdentityButton.jsx'

const titles = { login: 'Đăng nhập', register: 'Tạo tài khoản', forgot: 'Quên mật khẩu' }
const descriptions = { login: 'Dùng tài khoản Lumina để tiếp tục công việc của bạn.', register: 'Chọn vai trò và nhập thông tin để bắt đầu.', forgot: 'Nhập email để yêu cầu hướng dẫn đặt lại mật khẩu.' }

function VerificationRecovery({ continuation, generation }) {
  const { status, error, refresh, logout } = useSession()
  const pending = useRef(false)
  const mounted = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const retry = async () => {
    if (pending.current || status !== 'error' || generation !== getSessionGeneration()) return
    pending.current = true
    try { await refresh() } catch { /* SessionContext retains recoverable verification errors. */ }
    finally { if (mounted.current && generation === getSessionGeneration()) pending.current = false }
  }
  return <AuthEntryShell title="Xác minh phiên đăng nhập" description="Chỉ tiếp tục sau khi danh tính được máy chủ xác minh.">
    <div className="entry-recovery">
      {continuation && <StatusMessage type="success">{continuation.kind === 'register' ? 'Tài khoản đã được tạo.' : 'Thông tin đăng nhập đã được chấp nhận.'}</StatusMessage>}
      {status === 'loading' || status === 'authenticated' ? <StatusMessage>{status === 'authenticated' ? 'Danh tính đã được xác minh. Đang chuyển trang…' : 'Đang xác minh phiên đăng nhập…'}</StatusMessage> : <>
        <StatusMessage type="error"><strong>Chưa thể xác minh phiên đăng nhập</strong><br />{error?.message || 'Hãy thử xác minh lại để tiếp tục.'}</StatusMessage>
        {status === 'anonymous' && <p className="entry-hint">Phiên xác minh đã hết hiệu lực. Chọn Đăng xuất để bắt đầu đăng nhập lại.</p>}
        <p className="entry-hint">Các thao tác đăng nhập và đăng ký đang khóa. Thử lại chỉ kiểm tra phiên, không gửi lại thông tin đăng nhập.</p>
      </>}
      <div className="entry-actions"><button className="submit-button" type="button" disabled={status !== 'error'} onClick={retry}>Thử xác minh lại</button><button className="entry-secondary" type="button" onClick={() => logout()}>Đăng xuất</button></div>
    </div>
  </AuthEntryShell>
}

function EntryForm({ mode, draft, setDraft, switchMode, generation, onAccepted }) {
  const { acceptCredentials, sessionExpired, passwordChanged } = useSession()
  const location = useLocation()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('STUDENT')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState(null)
  const mounted = useRef(false)
  const pending = useRef(false)
  const heading = useRef(null)
  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'
  const notice = location.state?.sessionExpired || sessionExpired ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : location.state?.passwordChanged || passwordChanged ? 'Mật khẩu đã được thay đổi. Hãy đăng nhập bằng mật khẩu mới.' : ''
  useEffect(() => {
    mounted.current = true
    heading.current?.focus()
    return () => { mounted.current = false }
  }, [])
  const current = () => mounted.current && generation === getSessionGeneration()
  const update = (event) => {
    if (pending.current) return
    const { name, value } = event.target
    if (name === 'password') setPassword(value)
    else setDraft((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '' }))
    setOutcome(null)
  }
  const submit = async (event) => {
    event.preventDefault()
    if (pending.current || !current()) return
    const values = { ...draft, password }
    const validation = validateEntry(mode, values)
    setErrors(validation)
    setOutcome(null)
    if (Object.keys(validation).length) {
      document.getElementById(Object.keys(validation)[0])?.focus()
      return
    }
    pending.current = true
    setBusy(true)
    try {
      const email = draft.email.trim().toLowerCase()
      const payload = isForgot ? { email } : isRegister ? { name: draft.name.trim(), email, password, role } : { email, password }
      const data = await apiRequest(`/api/auth/${isForgot ? 'forgot-password' : isRegister ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(payload) })
      if (!current()) return
      if (isForgot) {
        // A generic confirmation never establishes address existence or delivery.
        setOutcome({ type: 'success', text: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.' })
      } else {
        // Installation synchronously advances the shared generation. The parent
        // adopts it and remounts a password-free verification continuation.
        const verification = acceptCredentials(data, remember || isRegister)
        onAccepted({ kind: mode, from: location.state?.from, generation: getSessionGeneration() })
        verification.catch(() => {})
      }
    } catch (error) {
      if (current()) setOutcome({ type: 'error', text: entryError(mode, error) })
    } finally {
      if (current()) { pending.current = false; setBusy(false) }
    }
  }
  const field = (name) => ({ id: name, name, value: name === 'password' ? password : draft[name], disabled: busy, required: true, 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `${name}-error` : undefined })
  const googleLogin = async (payload) => {
    if (pending.current || !current()) return
    pending.current = true; setBusy(true); setOutcome(null)
    try {
      const data = await apiRequest('/api/auth/google/login', { method: 'POST', body: JSON.stringify(payload) })
      if (!current()) return
      if (typeof data?.token !== 'string' || !data.token) throw new Error('Chưa nhận được phiên đăng nhập hợp lệ.')
      const verification = acceptCredentials(data, remember)
      onAccepted({ kind: 'login', from: location.state?.from, generation: getSessionGeneration() })
      verification.catch(() => {})
    } catch (error) {
      if (current()) setOutcome({ type: 'error', text: error.message })
    } finally { if (current()) { pending.current = false; setBusy(false) } }
  }
  return <AuthEntryShell title={titles[mode]} description={descriptions[mode]} headingRef={heading}>
    <form className="auth-card" noValidate onSubmit={submit} aria-busy={busy}>
      {notice && <StatusMessage>{notice}</StatusMessage>}
      {isRegister && <div className="role-picker" role="group" aria-label="Vai trò đăng ký">{[['STUDENT', 'Học viên'], ['INSTRUCTOR', 'Giảng viên']].map(([value, label]) => <button key={value} type="button" disabled={busy} aria-pressed={role === value} className={role === value ? 'selected' : ''} onClick={() => setRole(value)}>{label}</button>)}</div>}
      <div className="form-fields">
        {isRegister && <EntryField id="name" label="Họ và tên" error={errors.name}><input {...field('name')} onChange={update} autoComplete="name" placeholder="Họ và tên của bạn" /></EntryField>}
        <EntryField id="email" label="Email" error={errors.email}><input {...field('email')} onChange={update} type="email" autoComplete="email" placeholder="email@example.com" /></EntryField>
        {!isForgot && <EntryField id="password" label="Mật khẩu" error={errors.password}><input {...field('password')} onChange={update} type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="Từ 6 đến 72 ký tự" /><button className="password-toggle" type="button" disabled={busy} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ẩn' : 'Hiện'}</button></EntryField>}
      </div>
      {!isForgot && !isRegister && <div className="form-options"><label className="remember"><input type="checkbox" checked={remember} disabled={busy} onChange={(e) => setRemember(e.target.checked)} /> Ghi nhớ đăng nhập</label><button className="text-button" type="button" disabled={busy} onClick={() => switchMode('forgot')}>Quên mật khẩu?</button></div>}
      {isForgot && <p className="entry-hint">Kết quả không xác nhận email có tài khoản hay email đã được chuyển đến hộp thư.</p>}
      <button className="submit-button" type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : isForgot ? 'Gửi yêu cầu đặt lại' : isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</button>
      {!isForgot && !isRegister && <GoogleIdentityButton key={String(busy)} disabled={busy} onCredential={googleLogin} />}
      {outcome && <StatusMessage type={outcome.type}>{outcome.text}</StatusMessage>}
      <p className="switch-copy">{isForgot ? 'Đã nhớ mật khẩu?' : isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} <button type="button" disabled={busy} onClick={() => switchMode(isForgot || isRegister ? 'login' : 'register')}>{isForgot || isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}</button></p>
      {isRegister && <p className="terms">Bằng việc đăng ký, bạn đồng ý với <Link to="/terms" onClick={(e) => { if (pending.current) e.preventDefault() }} aria-disabled={busy} tabIndex={busy ? -1 : undefined}>Điều khoản dịch vụ</Link> và <Link to="/privacy" onClick={(e) => { if (pending.current) e.preventDefault() }} aria-disabled={busy} tabIndex={busy ? -1 : undefined}>Chính sách bảo mật</Link>.</p>}
    </form>
  </AuthEntryShell>
}

function AuthWorkspace({ generation, continuation, onAccepted }) {
  const { status } = useSession()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const [register, setRegister] = useState(false)
  const [draft, setDraft] = useState({ name: '', email: '' })
  const mode = params.get('mode') === 'forgot' ? 'forgot' : register ? 'register' : 'login'
  const switchMode = (next) => {
    setRegister(next === 'register')
    if ((params.get('mode') === 'forgot') !== (next === 'forgot')) setParams(next === 'forgot' ? { mode: 'forgot' } : {}, { state: location.state })
  }
  if (status === 'loading' || status === 'error' || continuation) return <VerificationRecovery continuation={continuation} generation={generation} />
  return <EntryForm key={`${location.key}:${mode}`} mode={mode} draft={draft} setDraft={setDraft} switchMode={switchMode} generation={generation} onAccepted={onAccepted} />
}

export default function AuthPage() {
  const { user, status, generation, sessionExpired } = useSession()
  const navigate = useNavigate()
  const [accepted, setAccepted] = useState(null)
  // Explicit expiry clears the installed session once. Retain the confirmed
  // mutation notice until the user explicitly restarts; never replay it.
  const continuation = accepted && (accepted.generation === generation || (sessionExpired && accepted.generation + 1 === generation)) ? accepted : null
  useEffect(() => {
    if (status === 'authenticated' && user) navigate(continuation ? resolvePostLoginDestination(continuation.from, user.role, window.location.origin) : roleHome(user.role), { replace: true })
  }, [status, user, navigate, continuation])
  return <AuthWorkspace key={generation} generation={generation} continuation={continuation} onAccepted={setAccepted} />
}
