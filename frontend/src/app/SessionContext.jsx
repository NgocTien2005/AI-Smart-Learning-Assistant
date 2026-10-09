/* eslint react-refresh/only-export-components: off */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest, clearSession, getToken } from '../services/api.js'
import { SESSION_EXPIRED_EVENT } from '../services/apiErrors.js'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(getToken() ? 'loading' : 'anonymous')
  const [error, setError] = useState(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const requestSequence = useRef(0)

  const refresh = useCallback(async () => {
    const sequence = ++requestSequence.current
    if (!getToken()) {
      setUser(null)
      setError(null)
      setStatus('anonymous')
      return null
    }
    setStatus('loading')
    setError(null)
    try {
      const data = await apiRequest('/api/auth/me')
      if (requestSequence.current !== sequence) return null
      setUser(data.user)
      const storage = localStorage.getItem('luminaToken') ? localStorage : sessionStorage
      storage.setItem('luminaUser', JSON.stringify(data.user))
      setStatus('authenticated')
      return data.user
    } catch (requestError) {
      if (requestSequence.current !== sequence) return null
      if (requestError.status === 401 && ['AUTH_REQUIRED', 'SESSION_INVALID'].includes(requestError.code)) {
        setUser(null)
        setStatus('anonymous')
        setError(null)
      } else {
        setStatus('error')
        setError(requestError)
      }
      throw requestError
    }
  }, [])

  const logout = useCallback(() => {
    requestSequence.current += 1
    clearSession()
    setUser(null)
    setError(null)
    setSessionExpired(false)
    setStatus('anonymous')
  }, [])

  const acceptCredentials = useCallback(async ({ token }, rememberMe = true) => {
    requestSequence.current += 1
    const targetStorage = rememberMe ? localStorage : sessionStorage
    const otherStorage = rememberMe ? sessionStorage : localStorage
    targetStorage.setItem('luminaToken', token)
    targetStorage.removeItem('luminaUser')
    otherStorage.removeItem('luminaToken')
    otherStorage.removeItem('luminaUser')
    setSessionExpired(false)
    const validatedUser = await refresh()
    if (!validatedUser) throw new Error('KhÃ´ng thá»ƒ xÃ¡c minh tÃ i khoáº£n vá»«a Ä‘Äƒng nháº­p. HÃ£y thá»­ láº¡i.')
    return validatedUser
  }, [refresh])

  useEffect(() => {
    const handleExpiration = () => {
      requestSequence.current += 1
      setUser(null)
      setError(null)
      setSessionExpired(true)
      setStatus('anonymous')
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpiration)
    let active = true
    queueMicrotask(() => {
      if (active && getToken()) refresh().catch(() => {})
    })
    return () => {
      active = false
      requestSequence.current += 1
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpiration)
    }
  }, [refresh])

  const value = useMemo(() => ({ user, status, error, sessionExpired, refresh, logout, acceptCredentials }), [user, status, error, sessionExpired, refresh, logout, acceptCredentials])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside SessionProvider')
  return session
}
