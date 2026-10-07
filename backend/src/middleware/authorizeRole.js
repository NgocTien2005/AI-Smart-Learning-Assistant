export const authorizeRole = (...roles) => (request, response, next) => {
  if (!roles.includes(request.user.role)) {
    return response.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này' })
  }

  return next()
}
