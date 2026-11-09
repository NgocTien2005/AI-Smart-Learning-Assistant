import jwt from 'jsonwebtoken'

export const createAuthenticate = ({ prisma, jwtSecret }) => async (request, response, next) => {
  const authorization = request.headers.authorization
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null

  if (!token) {
    return response.status(401).json({ code: 'AUTH_REQUIRED', error: 'Bạn chưa đăng nhập' })
  }

  let payload

  try {
    payload = jwt.verify(token, jwtSecret)
  } catch {
    return response.status(401).json({ code: 'SESSION_INVALID', error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' })
  }

  if (!Number.isInteger(payload.userId)) {
    return response.status(401).json({ code: 'SESSION_INVALID', error: 'Phiên đăng nhập không hợp lệ' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, authVersion: true, isActive: true },
    })

    if (!user || !user.isActive || payload.authVersion !== user.authVersion) {
      return response.status(401).json({ code: 'SESSION_INVALID', error: 'Phiên đăng nhập không hợp lệ' })
    }

    request.user = user
    return next()
  } catch (error) {
    return next(error)
  }
}
