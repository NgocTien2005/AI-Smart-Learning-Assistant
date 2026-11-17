import cors from 'cors'
import express from 'express'
import multer from 'multer'
import { corsOrigins } from './config/env.js'
import { authenticate } from './middleware/authenticate.js'
import { prisma } from './lib/prisma.js'
import { createToken, publicUser } from './utils/auth.js'
import { createAuthRouter } from './routes/auth.js'
import { isEmailConfigured, sendPasswordResetEmail } from './services/email.js'
import adminRouter from './routes/admin.js'
import coursesRouter from './routes/courses.js'
import healthRouter from './routes/health.js'
import { createDemoCloudRouter } from './routes/demoCloudAssistant.js'
import { createLessonChatRouter } from './routes/lessonChat.js'
import { createCloudBudget, createCloudService } from './services/demoCloudAssistant.js'
import { requestBoundary } from './middleware/requestBoundary.js'
import { securityHeaders, logSafeError } from './middleware/securityHeaders.js'

export const createApp = () => {
  const app = express()
  app.disable('x-powered-by')
  app.use(securityHeaders)

  app.use(cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Origin is not allowed by CORS'))
    },
  }))
  app.use(express.json({ limit: '1mb' }))
  app.use(requestBoundary)
  app.use('/api/health', healthRouter)
  app.use('/api/auth', createAuthRouter({ prisma, authenticate, createToken, publicUser, isEmailConfigured, sendPasswordResetEmail }))
  app.use('/api/admin', adminRouter)
  const budget = createCloudBudget()
  const providerOptions = { key: process.env.GEMINI_API_KEY || '', freeOnly: process.env.GEMINI_FREE_ONLY_CONFIRMED === 'true', budget }
  app.use('/api/courses/lessons', createDemoCloudRouter({ prisma, authenticate, service: createCloudService({ ...providerOptions, enabled: process.env.LUMINA_DEMO_ALLOWED === 'true' }) }))
  app.use('/api/courses/lessons', createLessonChatRouter({ prisma, authenticate, service: createCloudService({ ...providerOptions, enabled: process.env.GEMINI_CHAT_ALLOWED === 'true', chat: true }) }))
  app.use('/api/courses', coursesRouter)
  app.use((_request, response) => {
    response.status(404).json({ error: 'Không tìm thấy endpoint' })
  })
  app.use((error, _request, response, _next) => {
    if (error.type === 'entity.too.large') {
      return response.status(413).json({ error: 'Nội dung yêu cầu vượt quá giới hạn 1 MiB' })
    }
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return response.status(413).json({ code: 'UPLOAD_TOO_LARGE', error: 'Tài liệu không được vượt quá 10 MiB' })
      }
      return response.status(400).json({ code: 'INVALID_UPLOAD', error: 'Tài liệu upload không hợp lệ' })
    }

    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return response.status(400).json({ error: 'JSON không hợp lệ' })
    }

    if (error.status === 400 && ['Z_DATA_ERROR', 'Z_BUF_ERROR'].includes(error.code)) {
      return response.status(400).json({ error: 'Nội dung nén không hợp lệ' })
    }

    if (error.message === 'Origin is not allowed by CORS') {
      return response.status(403).json({ error: 'Origin không được phép truy cập' })
    }

    if (error.message === 'Unsupported document type') {
      return response.status(400).json({ code: 'UNSUPPORTED_TYPE', error: 'Chỉ hỗ trợ PDF, TXT, Markdown hoặc CSV.' })
    }

    logSafeError('Unhandled request error', error)
    return response.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' })
  })

  return app
}
