import { createApp } from './src/app.js'
import { port } from './src/config/env.js'
import { prisma } from './src/lib/prisma.js'

const server = createApp().listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`)
})

let isShuttingDown = false

const shutdown = (signal) => {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log(`${signal} received, shutting down`)
  server.close(async (error) => {
    try {
      await prisma.$disconnect()
    } finally {
      if (error) console.error('HTTP server shutdown error:', error)
      process.exitCode = error ? 1 : 0
    }
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
