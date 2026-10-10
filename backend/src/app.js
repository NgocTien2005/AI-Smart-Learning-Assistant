import cors from 'cors'
import express from 'express'
import multer from 'multer'
import { corsOrigins } from './config/env.js'
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'
import coursesRouter from './routes/courses.js'
import healthRouter from './routes/health.js'

export const createApp = () => {
  const app = express()

  app.use(cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Origin is not allowed by CORS'))
    },
  }))
  app.use(express.json({ limit: '1mb' }))
  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/courses', coursesRouter)
  app.use((_request, response) => {
    response.status(404).json({ error: 'Không tìm thấy endpoint' })
  })
  app.use((error, _request, response, _next) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return response.status(413).json({ code: 'UPLOAD_TOO_LARGE', error: 'Tài liệu không được vượt quá 10 MiB' })
      }
      return response.status(400).json({ code: 'INVALID_UPLOAD', error: 'Tài liệu upload không hợp lệ' })
    }

    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return response.status(400).json({ error: 'JSON không hợp lệ' })
    }

    if (error.message === 'Origin is not allowed by CORS') {
      return response.status(403).json({ error: 'Origin không được phép truy cập' })
    }

    if (error.message === 'Unsupported document type') {
      return response.status(400).json({ code: 'UNSUPPORTED_TYPE', error: 'Chỉ hỗ trợ PDF, TXT, Markdown hoặc CSV.' })
    }

    console.error('Unhandled request error:', error)
    return response.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' })
  })

  return app
}
