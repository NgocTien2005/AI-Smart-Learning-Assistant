import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.ts'
import 'dotenv/config'
import { createApp } from './app.js'

const port = Number(process.env.PORT) || 3000
const connectionString = process.env.DATABASE_URL
const jwtSecret = process.env.JWT_SECRET

if (!connectionString) {
  throw new Error('DATABASE_URL is required to start the backend')
}
if (!jwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })
const app = createApp({
  prisma,
  jwtSecret: jwtSecret || 'development-only-secret',
  corsOrigin: process.env.CORS_ORIGIN || '*',
})

const server = app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`)
})

const shutdown = () => {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
