import { isSessionExpiration, readApiError, SESSION_EXPIRED_EVENT } from './apiErrors.js'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const getToken = () => localStorage.getItem('luminaToken') || sessionStorage.getItem('luminaToken')

export const getStoredUser = () => {
  const rawUser = localStorage.getItem('luminaUser') || sessionStorage.getItem('luminaUser')
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser)
  } catch {
    return null
  }
}

export const clearSession = () => {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem('luminaToken')
    storage.removeItem('luminaUser')
  }
}

const handleSessionError = (error) => {
  if (!isSessionExpiration(error)) return
  clearSession()
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
}

export const updateStoredUser = (user) => {
  const storage = localStorage.getItem('luminaToken') ? localStorage : sessionStorage
  storage.setItem('luminaUser', JSON.stringify(user))
}

export const apiRequest = async (path, options = {}) => {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  let response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch (cause) {
    if (cause?.name === 'AbortError') throw cause
    const error = new Error('Không thể kết nối tới máy chủ. Hãy kiểm tra kết nối và thử lại.')
    error.code = 'NETWORK_ERROR'
    error.status = 0
    throw error
  }

  if (response.status === 204) return null
  if (!response.ok) {
    const error = await readApiError(response)
    handleSessionError(error)
    throw error
  }

  return response.json()
}

export const fetchDocument = async (lessonId) => {
  const token = getToken()
  const response = await fetch(`${API_URL}/api/courses/lessons/${lessonId}/document`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    const error = await readApiError(response, 'Không thể tải tài liệu')
    handleSessionError(error)
    throw error
  }
  return response.blob()
}

export const downloadDocument = async (lessonId, fallbackName) => {
  const blob = await fetchDocument(lessonId)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fallbackName || 'tai-lieu'
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
