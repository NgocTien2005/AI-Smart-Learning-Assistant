import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../app/SessionContext.jsx'
import { apiRequest, getSessionGeneration } from '../services/api.js'
import Button from '../components/ui/Button.jsx'
import PasswordManager from '../components/account/PasswordManager.jsx'
import { ErrorState, FieldError, LoadingState, StatusMessage } from '../components/ui/Feedback.jsx'
import './LearningApp.css'
import './AccountPage.css'

const roleLabels = { ADMIN: 'Quản trị viên', INSTRUCTOR: 'Giảng viên', STUDENT: 'Học viên' }

function AccountWorkspace({ user, generation }) {
  const { status, error, refresh, logout } = useSession()
  const navigate = useNavigate()
  const [name, setName] = useState(user.name || '')
  const [nameError, setNameError] = useState('')
  const [operationError, setOperationError] = useState('')
  const [savedName, setSavedName] = useState(null)
  const [verificationError, setVerificationError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState('')
  const [passwordRecovery, setPasswordRecovery] = useState('')
  const [passwordLifetime, setPasswordLifetime] = useState(0)
  const mounted = useRef(false)
  const operation = useRef('')
  const edit = useRef(0)
  const nameRef = useRef(null)
  const id = useId()
  const verified = status === 'authenticated'

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const isCurrent = () => mounted.current && generation === getSessionGeneration()
  const verifyIdentity = async () => {
    setPasswordLifetime((previous) => previous + 1)
    const identity = await refresh()
    if (!isCurrent()) return
    if (!identity) throw new Error('Chưa nhận được kết quả xác minh tài khoản hiện tại. Hãy thử lại.')
    setVerificationError('')
    setInfo('Thông tin tài khoản đã được xác minh.')
  }
  const checkIdentity = async () => {
    if (!isCurrent() || operation.current || status === 'loading') return
    operation.current = 'verify'
    setBusy('verify')
    setVerificationError('')
    try { await verifyIdentity() }
    catch (requestError) { if (isCurrent()) setVerificationError(requestError.message) }
    finally { if (isCurrent()) { operation.current = ''; setBusy('') } }
  }

  const updateProfile = async (event) => {
    event.preventDefault()
    if (!isCurrent() || !verified || operation.current) return
    const submittedName = name.trim()
    if (submittedName.length < 2 || submittedName.length > 80) {
      setNameError('Họ và tên phải từ 2 đến 80 ký tự sau khi bỏ khoảng trắng ở hai đầu.')
      nameRef.current?.focus()
      return
    }
    const submittedEdit = edit.current
    operation.current = 'profile'
    setBusy('profile')
    setNameError('')
    setOperationError('')
    setVerificationError('')
    setInfo('')
    try {
      const data = await apiRequest('/api/auth/me', { method: 'PATCH', body: JSON.stringify({ name: submittedName }) })
      if (!isCurrent()) return
      if (data?.user?.id !== user.id || typeof data.user.name !== 'string') throw new Error('Máy chủ chưa trả kết quả hồ sơ hợp lệ.')
      setSavedName(data.user.name)
      if (edit.current === submittedEdit) setName(data.user.name)
      setBusy('verify')
      try { await verifyIdentity() }
      catch (requestError) { if (isCurrent()) setVerificationError(requestError.message) }
    } catch (requestError) {
      if (!isCurrent()) return
      if (requestError.status === 400) setNameError(requestError.message)
      else setOperationError(requestError.message + ' Chưa xác định kết quả lưu; thay đổi có thể đã được ghi. Kiểm tra hồ sơ trước khi chủ động lưu lại.')
    } finally {
      if (isCurrent()) { operation.current = ''; setBusy('') }
    }
  }

  const changePassword = async (values) => {
    if (!isCurrent() || !verified || operation.current) return null
    operation.current = 'password'
    setBusy('password')
    setPasswordRecovery('')
    try {
      const data = await apiRequest('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: values.currentPassword, newPassword: values.newPassword }) })
      if (!isCurrent()) return null
      if (typeof data?.message !== 'string' || !data.message) throw new Error('Máy chủ chưa trả xác nhận đổi mật khẩu.')
      logout({ passwordChanged: true })
      navigate('/auth', { replace: true, state: { passwordChanged: true } })
      return null
    } catch (requestError) {
      if (!isCurrent()) return null
      if (requestError.code === 'CURRENT_PASSWORD_INVALID') return { field: 'currentPassword', message: requestError.message }
      if (requestError.status === 400) return { message: requestError.message }
      const message = requestError.message + ' Chưa xác định kết quả đổi mật khẩu. Không tự động gửi lại; bạn có thể kiểm tra phiên hoặc đăng nhập lại.'
      setPasswordRecovery(message)
      return { message, handled: true }
    } finally {
      if (isCurrent()) { operation.current = ''; setBusy('') }
    }
  }
  const signInAgain = () => {
    if (!isCurrent()) return
    logout()
    navigate('/auth', { replace: true })
  }

  const readOnly = !verified || busy === 'verify' || busy === 'password'
  return <main className="account-main account-workspace">
    <section className="account-heading"><span className="eyebrow">TÀI KHOẢN</span><h1>Hồ sơ cá nhân</h1><p>Cập nhật tên hiển thị và quản lý mật khẩu của bạn.</p></section>
    {!verified && <section className="account-verification" aria-label="Xác minh tài khoản">
      {status === 'loading' ? <LoadingState>Đang xác minh tài khoản… Hồ sơ đang ở chế độ chỉ đọc.</LoadingState>
        : <ErrorState title="Chưa thể xác minh tài khoản">{verificationError || error?.message} Hồ sơ đã biết vẫn được giữ ở chế độ chỉ đọc. Bạn chưa thể thực hiện thay đổi.</ErrorState>}
      <p>Biểu mẫu mật khẩu được đóng và xóa khi tài khoản cần xác minh lại.</p>
      <Button onClick={checkIdentity} disabled={Boolean(busy) || status === 'loading'}>Thử lại xác minh</Button>
      <Button variant="secondary" onClick={signInAgain}>Đăng xuất</Button>
    </section>}
    <div className="account-columns">
      <aside className="account-identity" aria-labelledby={id + '-identity'}><h2 id={id + '-identity'}>Thông tin tài khoản</h2><p>{verified ? 'Danh tính đã xác minh' : 'Danh tính đã xác minh gần nhất'}</p><dl><div><dt>Tên hiển thị</dt><dd>{user.name}</dd></div><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Vai trò</dt><dd>{roleLabels[user.role] || 'Tài khoản'}</dd></div></dl><small>Email và vai trò chỉ đọc tại đây.</small></aside>
      <div className="account-forms">
        <section className="account-profile-card" aria-labelledby={id + '-profile'}><h2 id={id + '-profile'}>Tên hiển thị</h2><p>Tên này xuất hiện trong Lumina. Email và quyền truy cập không thay đổi.</p>
          <form onSubmit={updateProfile} noValidate><label htmlFor={id + '-name'}>Họ và tên</label><input ref={nameRef} id={id + '-name'} value={name} onChange={(event) => { edit.current += 1; setName(event.target.value); setNameError(''); setInfo('') }} autoComplete="name" readOnly={readOnly} aria-invalid={Boolean(nameError)} aria-describedby={id + '-help' + (nameError ? ' ' + id + '-error' : '')} />
            <small id={id + '-help'}>2–80 ký tự sau khi bỏ khoảng trắng ở hai đầu.</small><FieldError id={id + '-error'}>{nameError}</FieldError>
            <Button type="submit" aria-label="Lưu hồ sơ" disabled={!verified || Boolean(busy)}>{busy === 'profile' ? 'Đang lưu hồ sơ…' : busy === 'verify' ? 'Đang xác minh…' : 'Lưu hồ sơ'}</Button>
          </form>
          {savedName !== null && <StatusMessage type="success">Đã lưu tên: {savedName}. Máy chủ đã xác nhận thay đổi.</StatusMessage>}
          {busy === 'profile' && <StatusMessage>Đang lưu tên đã gửi. Bạn có thể tiếp tục chỉnh bản nháp.</StatusMessage>}
          {operationError && <StatusMessage type="error">{operationError}</StatusMessage>}
          {verificationError && verified && <StatusMessage type="error">{verificationError}</StatusMessage>}
          <StatusMessage>{info}</StatusMessage>
          {(operationError || verificationError) && verified && <Button variant="secondary" disabled={Boolean(busy)} onClick={checkIdentity}>Kiểm tra hồ sơ</Button>}
        </section>
        <PasswordManager key={passwordLifetime + ':' + verified} enabled={verified} busy={busy} onChangePassword={changePassword} />
        {passwordRecovery && <section className="account-password-recovery" aria-label="Khôi phục đổi mật khẩu"><StatusMessage type="error">{passwordRecovery}</StatusMessage><Button variant="secondary" disabled={Boolean(busy) || status === 'loading'} onClick={checkIdentity}>Kiểm tra phiên</Button><Button variant="secondary" disabled={Boolean(busy)} onClick={signInAgain}>Đăng nhập lại</Button></section>}
      </div>
    </div>
  </main>
}

export default function AccountPage() {
  const { user, generation } = useSession()
  if (!user) return null
  return <AccountWorkspace key={user.id + ':' + generation} user={user} generation={generation} />
}
