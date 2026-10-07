import jwt from 'jsonwebtoken'
import { jwtSecret } from '../config/env.js'

export const createToken = (user) => jwt.sign(
  { userId: user.id, role: user.role },
  jwtSecret,
  { expiresIn: '1d' },
)

export const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
})