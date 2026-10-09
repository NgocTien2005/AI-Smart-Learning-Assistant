export const SESSION_EXPIRED_EVENT = 'lumina:session-expired'

export const readApiError = async (response, fallbackMessage = 'Yêu cầu không thành công') => {
  const responseText = await response.text().catch(() => '')
  let data = {}
  try {
    data = responseText ? JSON.parse(responseText) : {}
  } catch {
    // Proxies such as nginx may return an HTML error page instead of JSON.
  }

  const error = new Error(response.status === 413
    ? 'Tệp vượt quá giới hạn 10 MiB. Hãy chọn tệp nhỏ hơn.'
    : data.error || fallbackMessage)
  error.status = response.status
  error.code = data.code || (response.status === 413 ? 'UPLOAD_TOO_LARGE' : undefined)
  return error
}

export const isSessionExpiration = (error) => error?.status === 401
  && ['AUTH_REQUIRED', 'SESSION_INVALID'].includes(error.code)
