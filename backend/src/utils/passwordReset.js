import { createHash, randomBytes } from 'node:crypto'

export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000

export const createPasswordResetToken = () => randomBytes(32).toString('hex')

export const hashPasswordResetToken = (token) => createHash('sha256').update(token).digest('hex')

export const isPasswordResetToken = (token) => typeof token === 'string' && /^[a-f\d]{64}$/i.test(token)
