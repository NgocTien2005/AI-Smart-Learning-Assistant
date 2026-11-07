import { useEffect, useRef, useState } from 'react'
import { apiRequest, getSessionGeneration } from '../services/api.js'
import { loadGoogleIdentity } from '../services/googleIdentity.js'
import { StatusMessage } from './ui/Feedback.jsx'
import './GoogleIdentityButton.css'

export default function GoogleIdentityButton({ intent = 'login', disabled = false, onCredential }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
  const [stage, setStage] = useState('idle')
  const [error, setError] = useState('')
  const container = useRef(null)
  const lifetime = useRef({ active: false, preparing: false, attempt: 0, timer: null, generation: getSessionGeneration() })
  useEffect(() => {
    const scope = lifetime.current
    scope.active = true
    return () => { scope.active = false; scope.attempt++; window.clearTimeout(scope.timer); window.google?.accounts?.id?.cancel?.() }
  }, [])
  const current = attempt => lifetime.current.active && lifetime.current.attempt === attempt && lifetime.current.generation === getSessionGeneration()
  const cancel = () => {
    lifetime.current.attempt++
    window.clearTimeout(lifetime.current.timer)
    window.google?.accounts?.id?.cancel?.()
    container.current?.replaceChildren()
    setStage('idle')
    setError('')
  }
  const prepare = async () => {
    if (disabled || !clientId || lifetime.current.preparing) return
    lifetime.current.preparing = true
    const attempt = ++lifetime.current.attempt
    setStage('loading'); setError('')
    try {
      const challenge = await apiRequest('/api/auth/google/challenge', { method: 'POST', body: JSON.stringify({ intent }) })
      if (!current(attempt)) return
      if (typeof challenge?.challengeId !== 'string' || typeof challenge.nonce !== 'string') throw new Error('Chưa nhận được yêu cầu Google hợp lệ. Hãy thử lại.')
      const sdk = await loadGoogleIdentity()
      if (!current(attempt)) return
      let consumed = false
      sdk.initialize({
        client_id: clientId, nonce: challenge.nonce, auto_select: false, ux_mode: 'popup',
        callback: response => {
          if (!current(attempt) || consumed) return
          consumed = true
          window.clearTimeout(lifetime.current.timer)
          if (typeof response?.credential !== 'string' || !response.credential) { setError('Google chưa trả kết quả đăng nhập. Hãy bắt đầu lại.'); setStage('idle'); return }
          // Parent acquires its synchronous operation gate and owns the request.
          onCredential({ challengeId: challenge.challengeId, credential: response.credential })
        },
      })
      container.current.replaceChildren()
      sdk.renderButton(container.current, { type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', locale: 'vi', width: Math.min(360, container.current.clientWidth || 320) })
      setStage('ready')
      lifetime.current.timer = window.setTimeout(() => {
        if (!current(attempt)) return
        lifetime.current.attempt++
        container.current?.replaceChildren()
        setStage('idle'); setError('Yêu cầu Google đã hết hạn. Hãy bắt đầu lại.')
      }, Math.min(challenge.expiresIn || 300, 300) * 1000)
    } catch (requestError) {
      if (current(attempt)) { setStage('idle'); setError(requestError.message) }
    } finally {
      if (current(attempt)) lifetime.current.preparing = false
    }
  }
  return <div className="google-identity">
    {stage !== 'ready' && <button type="button" className="entry-secondary google-start" disabled={disabled || !clientId || stage === 'loading'} onClick={prepare}>{stage === 'loading' ? 'Đang chuẩn bị Google…' : intent === 'link' ? 'Liên kết Google' : 'Đăng nhập bằng Google'}</button>}
    <div ref={container} hidden={stage !== 'ready' || disabled} className="google-provider-button" />
    {stage === 'ready' && <><small>Chọn nút Google để tiếp tục. Nếu đã đóng cửa sổ, bạn có thể hủy và bắt đầu lại.</small><button type="button" className="text-button" onClick={cancel}>Hủy yêu cầu Google</button></>}
    {!clientId && <small>Google hiện chưa sẵn sàng. Bạn vẫn có thể dùng email và mật khẩu.</small>}
    {error && <StatusMessage type="error">{error}</StatusMessage>}
  </div>
}
