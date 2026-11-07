import { useEffect, useRef, useState } from 'react'
import { apiRequest, getSessionGeneration } from '../../services/api.js'
import GoogleIdentityButton from '../GoogleIdentityButton.jsx'
import { StatusMessage } from '../ui/Feedback.jsx'
import Button from '../ui/Button.jsx'

export default function GoogleLinkPanel({ enabled, busy, generation, acquire, release }) {
  const [linked, setLinked] = useState(null)
  const [error, setError] = useState('')
  const [uncertain, setUncertain] = useState(false)
  const active = useRef(false)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const current = () => active.current && generation === getSessionGeneration()
  const check = async () => {
    if (!current() || !enabled || !acquire()) return
    setError('')
    try {
      const data = await apiRequest('/api/auth/google/link')
      if (!current()) return
      if (typeof data?.linked !== 'boolean') throw new Error('Chưa nhận được trạng thái liên kết hợp lệ.')
      setLinked(data.linked); setUncertain(false)
    } catch (requestError) { if (current()) setError(requestError.message) }
    finally { if (current()) release() }
  }
  const link = async payload => {
    if (!current() || !enabled || uncertain || !acquire()) return
    setError('')
    try {
      const data = await apiRequest('/api/auth/google/link', { method: 'POST', body: JSON.stringify(payload) })
      if (!current()) return
      if (data?.linked !== true) throw new Error('Chưa nhận được xác nhận liên kết.')
      setLinked(true)
    } catch (requestError) {
      if (!current()) return
      const unknown = !requestError.status || requestError.status >= 500
      setUncertain(unknown)
      setError(requestError.message + (unknown ? ' Chưa xác định kết quả liên kết. Hãy kiểm tra liên kết trước khi chủ động thử lại.' : ''))
    } finally { if (current()) release() }
  }
  return <section className="account-profile-card" aria-label="Liên kết Google">
    <h2>Đăng nhập Google</h2><p>Chỉ dùng cho tài khoản Lumina đã có. Email Google phải trùng email Lumina; mật khẩu và vai trò được giữ nguyên.</p>
    <Button variant="secondary" disabled={!enabled || Boolean(busy)} onClick={check}>Kiểm tra liên kết Google</Button>
    {linked !== null && <StatusMessage type={linked ? 'success' : 'info'}>{linked ? 'Đã liên kết Google.' : 'Chưa liên kết Google.'}</StatusMessage>}
    {linked === false && !uncertain && <GoogleIdentityButton key={String(busy)} intent="link" disabled={!enabled || Boolean(busy)} onCredential={link} />}
    {error && <StatusMessage type="error">{error}</StatusMessage>}
  </section>
}
