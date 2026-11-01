import { useEffect, useId, useRef, useState } from 'react'
import Button from '../ui/Button.jsx'
import { FieldError, StatusMessage } from '../ui/Feedback.jsx'

const fields = [
  { key: 'currentPassword', label: 'Mật khẩu hiện tại', autoComplete: 'current-password' },
  { key: 'newPassword', label: 'Mật khẩu mới', autoComplete: 'new-password' },
  { key: 'confirmation', label: 'Xác nhận mật khẩu mới', autoComplete: 'new-password' },
]

function PasswordForm({ busy, onChangePassword }) {
  const [values, setValues] = useState({ currentPassword: '', newPassword: '', confirmation: '' })
  const [errors, setErrors] = useState({})
  const [operationError, setOperationError] = useState('')
  const inputs = useRef({})
  const pending = useRef(false)
  const mounted = useRef(false)
  const id = useId()

  useEffect(() => {
    mounted.current = true
    inputs.current.currentPassword?.focus()
    return () => { mounted.current = false }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    if (busy || pending.current) return
    const invalid = {}
    for (const key of ['currentPassword', 'newPassword']) {
      if (values[key].length < 6 || values[key].length > 72) invalid[key] = 'Mật khẩu phải từ 6 đến 72 ký tự. Khoảng trắng được giữ nguyên.'
    }
    if (!invalid.newPassword && values.newPassword === values.currentPassword) invalid.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại.'
    if (values.confirmation !== values.newPassword) invalid.confirmation = 'Xác nhận phải khớp chính xác với mật khẩu mới.'
    setErrors(invalid)
    setOperationError('')
    const firstInvalid = fields.find(({ key }) => invalid[key])
    if (firstInvalid) {
      inputs.current[firstInvalid.key]?.focus()
      return
    }
    pending.current = true
    try {
      const result = await onChangePassword(values)
      if (!mounted.current || !result) return
      if (result.field) {
        setErrors({ [result.field]: result.message })
        inputs.current[result.field]?.focus()
      } else if (!result.handled) setOperationError(result.message)
    } catch {
      if (mounted.current) setOperationError('Chưa xác định kết quả đổi mật khẩu. Hãy kiểm tra phiên hoặc đăng nhập lại trước khi chủ động thử lại.')
    } finally {
      pending.current = false
    }
  }

  return <form className="account-password-form" onSubmit={submit} noValidate>
    <p id={id + '-help'}>Mật khẩu hiện tại và mật khẩu mới phải có 6–72 ký tự. Khoảng trắng là một phần của mật khẩu.</p>
    {fields.map(({ key, label, autoComplete }) => <div className="account-password-field" key={key}>
      <label htmlFor={id + '-' + key}>{label}</label>
      <input ref={(element) => { inputs.current[key] = element }} id={id + '-' + key} type="password" autoComplete={autoComplete} value={values[key]} disabled={Boolean(busy)}
        aria-invalid={Boolean(errors[key])} aria-describedby={id + '-help' + (errors[key] ? ' ' + id + '-' + key + '-error' : '')}
        onChange={(event) => { setValues((previous) => ({ ...previous, [key]: event.target.value })); setErrors((previous) => ({ ...previous, [key]: '' })); setOperationError('') }} />
      <FieldError id={id + '-' + key + '-error'}>{errors[key]}</FieldError>
    </div>)}
    <StatusMessage type="error">{operationError}</StatusMessage>
    {busy === 'password' && <StatusMessage>Đang đổi mật khẩu… Vui lòng chờ xác nhận.</StatusMessage>}
    <Button type="submit" aria-label="Xác nhận đổi mật khẩu" disabled={Boolean(busy)}>{busy === 'password' ? 'Đang đổi mật khẩu…' : 'Xác nhận đổi mật khẩu'}</Button>
  </form>
}

export default function PasswordManager({ enabled, busy, onChangePassword }) {
  const [open, setOpen] = useState(false)
  const trigger = useRef(null)
  const id = useId()
  const expanded = enabled && open
  const toggle = () => {
    if (!enabled || busy === 'password') return
    setOpen(!open)
    if (open) trigger.current?.focus()
  }
  return <section className="account-password-card" aria-labelledby={id + '-heading'}>
    <div className="account-password-heading"><div><h2 id={id + '-heading'}>Đổi mật khẩu</h2><p>Quản lý mật khẩu riêng với hồ sơ cá nhân. Sau khi đổi thành công, bạn cần đăng nhập lại.</p></div>
      <Button ref={trigger} variant="secondary" aria-label={expanded ? 'Đóng biểu mẫu đổi mật khẩu' : 'Mở biểu mẫu đổi mật khẩu'} aria-expanded={expanded} aria-controls={id + '-form'} disabled={!enabled || busy === 'password'} onClick={toggle}>{expanded ? 'Đóng biểu mẫu' : 'Đổi mật khẩu'}</Button></div>
    <div id={id + '-form'}>{expanded && <PasswordForm busy={busy} onChangePassword={onChangePassword} />}</div>
  </section>
}
