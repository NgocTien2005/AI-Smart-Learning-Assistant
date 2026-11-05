import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSession } from '../app/SessionContext.jsx'
import { apiRequest, getSessionGeneration } from '../services/api.js'
import { isInvalidResetLink, validateReset } from '../services/authEntry.js'
import AuthEntryShell, { EntryField } from '../components/AuthEntryShell.jsx'
import { StatusMessage } from '../components/ui/Feedback.jsx'

function ResetForm({ token, generation }) {
  const { logout } = useSession()
  const validToken = /^[a-f\d]{64}$/i.test(token)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [invalidLink, setInvalidLink] = useState(!validToken)
  const [outcome, setOutcome] = useState(validToken ? null : { type: 'error', text: 'Liên kết đặt lại mật khẩu bị thiếu hoặc sai định dạng. Hãy yêu cầu một liên kết mới.' })
  const [uncertain, setUncertain] = useState(false)
  const mounted = useRef(false)
  const pending = useRef(false)
  const heading = useRef(null)
  useEffect(() => { mounted.current = true; heading.current?.focus(); return () => { mounted.current = false } }, [])
  const current = () => mounted.current && generation === getSessionGeneration()
  const disabled = busy || completed || invalidLink
  const submit = async (event) => {
    event.preventDefault()
    if (!current() || pending.current || completed || invalidLink) return
    const validation = validateReset(password, confirmation)
    setErrors(validation)
    setOutcome(null)
    if (Object.keys(validation).length) {
      document.getElementById(validation.password ? 'new-password' : 'confirm-password')?.focus()
      return
    }
    pending.current = true
    setBusy(true)
    setUncertain(false)
    try {
      const data = await apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) })
      if (!current()) return
      setCompleted(true)
      setPassword('')
      setConfirmation('')
      setShowPassword(false)
      setOutcome({ type: 'success', text: data.message || 'Mật khẩu đã được đặt lại. Hãy đăng nhập bằng mật khẩu mới.' })
    } catch (error) {
      if (!current()) return
      if (isInvalidResetLink(error)) setInvalidLink(true)
      const unknown = !error.status || error.status >= 500
      setUncertain(unknown)
      setOutcome({ type: 'error', text: unknown ? error.message + ' Chưa xác định kết quả đặt lại; mật khẩu có thể đã thay đổi. Không tự động gửi lại. Bạn có thể đăng nhập để kiểm tra hoặc yêu cầu liên kết mới.' : error.message })
    } finally { if (current()) { pending.current = false; setBusy(false) } }
  }
  const change = (name, value) => {
    if (pending.current) return
    if (name === 'password') setPassword(value)
    else setConfirmation(value)
    setErrors((previous) => ({ ...previous, [name]: '' }))
    if (!uncertain) setOutcome(null)
  }
  const field = (id, name, value) => ({ id, value, disabled, required: true, type: showPassword ? 'text' : 'password', autoComplete: 'new-password', 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `${id}-error` : undefined })
  const safeLink = { onClick: (e) => { if (pending.current) e.preventDefault() }, 'aria-disabled': busy, tabIndex: busy ? -1 : undefined }
  return <AuthEntryShell title="Đặt lại mật khẩu" description="Tạo mật khẩu mới từ 6 đến 72 ký tự. Khoảng trắng được giữ nguyên." headingRef={heading}>
    <form className="auth-card" noValidate onSubmit={submit} aria-busy={busy}>
      <div className="form-fields">
        <EntryField id="new-password" label="Mật khẩu mới" error={errors.password}><input {...field('new-password', 'password', password)} onChange={(e) => change('password', e.target.value)} /><button type="button" className="password-toggle" disabled={disabled} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ẩn' : 'Hiện'}</button></EntryField>
        <EntryField id="confirm-password" label="Xác nhận mật khẩu" error={errors.confirmation}><input {...field('confirm-password', 'confirmation', confirmation)} onChange={(e) => change('confirmation', e.target.value)} /></EntryField>
      </div>
      {!completed && !invalidLink && <button className="submit-button" type="submit" disabled={busy}>{busy ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}</button>}
      {outcome && <StatusMessage type={outcome.type}>{outcome.text}</StatusMessage>}
      {(invalidLink || uncertain) && <Link className="entry-secondary reset-request-link" to="/auth?mode=forgot" {...safeLink}>Yêu cầu liên kết mới</Link>}
      <p className="switch-copy"><Link to="/auth" {...safeLink} onClick={(e) => { if (pending.current) e.preventDefault(); else if (completed) logout({ passwordChanged: true }) }}>Quay lại đăng nhập</Link></p>
    </form>
  </AuthEntryShell>
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const { generation } = useSession()
  const token = params.get('token') || ''
  // React keys are not DOM attributes. The secret link never enters rendered text.
  return <ResetForm key={`${generation}:${token}`} token={token} generation={generation} />
}
