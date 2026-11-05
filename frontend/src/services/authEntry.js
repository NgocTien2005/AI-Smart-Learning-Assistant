const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function passwordError(password) {
  return password.length < 6 || password.length > 72 ? 'Mật khẩu phải từ 6 đến 72 ký tự; khoảng trắng được giữ nguyên.' : ''
}

export function validateEntry(mode, form) {
  const errors = {}
  if (mode === 'register' && (form.name.trim().length < 2 || form.name.trim().length > 80)) errors.name = 'Họ và tên phải từ 2 đến 80 ký tự sau khi bỏ khoảng trắng ở hai đầu.'
  if (!emailPattern.test(form.email.trim().toLowerCase())) errors.email = 'Nhập địa chỉ email hợp lệ.'
  if (mode !== 'forgot' && passwordError(form.password)) errors.password = passwordError(form.password)
  return errors
}

export function validateReset(password, confirmation) {
  const errors = {}
  if (passwordError(password)) errors.password = passwordError(password)
  if (password !== confirmation) errors.confirmation = 'Mật khẩu xác nhận không khớp.'
  return errors
}

export const isInvalidResetLink = (error) => error.status === 400 && error.message === 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'

export function entryError(mode, error) {
  if (mode === 'forgot' && error.status === 429) return 'Bạn đã yêu cầu quá nhiều lần. Hãy thử lại sau; không tự động gửi lại.'
  if (mode === 'forgot' && error.status === 503) return 'Dịch vụ email chưa sẵn sàng. Hãy thử lại sau hoặc liên hệ quản trị viên.'
  if (mode === 'register' && (!error.status || error.status >= 500)) return error.message + ' Chưa xác định kết quả đăng ký; tài khoản có thể đã được tạo. Bạn có thể chủ động đăng nhập để kiểm tra.'
  if (mode === 'forgot' && !error.status) return error.message + ' Chưa xác định kết quả yêu cầu; không tự động gửi lại.'
  return error.message
}
