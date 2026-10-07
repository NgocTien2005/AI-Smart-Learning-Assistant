import 'dotenv/config'
import { resolve } from 'node:path'

export const port = Number(process.env.PORT) || 3000
export const connectionString = process.env.DATABASE_URL
export const isProduction = process.env.NODE_ENV === 'production'
export const jwtSecret = process.env.JWT_SECRET || (isProduction ? undefined : 'development-only-secret')
export const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
export const validRoles = new Set(['INSTRUCTOR', 'STUDENT'])
export const uploadDirectory = resolve(process.env.UPLOAD_DIR || 'uploads')

if (!connectionString) {
  throw new Error('DATABASE_URL is required to start the backend')
}

if (!jwtSecret) {
  throw new Error('JWT_SECRET is required in production')
}
