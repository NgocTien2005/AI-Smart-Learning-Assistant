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
  } catch {
    throw new Error('Không thể kết nối tới máy chủ')
  }

  if (response.status === 204) return null
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401) clearSession()
    throw new Error(data.error || 'Yêu cầu không thành công')
  }

  return data
}

export const downloadDocument = async (lessonId, fallbackName) => {
  const token = getToken()
  const response = await fetch(`${API_URL}/api/courses/lessons/${lessonId}/document`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'Không thể tải tài liệu')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fallbackName || 'tai-lieu'
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
