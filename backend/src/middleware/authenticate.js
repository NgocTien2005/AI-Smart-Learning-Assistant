import jwt from 'jsonwebtoken'
import { jwtSecret } from '../config/env.js'
import { prisma } from '../lib/prisma.js'

export const authenticate = async (request, response, next) => {
  const authorization = request.headers.authorization
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null

  if (!token) {
    return response.status(401).json({ error: 'Bạn chưa đăng nhập' })
  }

  let payload

  try {
    payload = jwt.verify(token, jwtSecret)
  } catch {
    return response.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' })
  }

  if (!Number.isInteger(payload.userId)) {
    return response.status(401).json({ error: 'Phiên đăng nhập không hợp lệ' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true },
    })

    if (!user) {
      return response.status(401).json({ error: 'Phiên đăng nhập không hợp lệ' })
    }

    request.user = user
    return next()
  } catch (error) {
    return next(error)
  }
}
