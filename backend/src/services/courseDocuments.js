import { createHash } from 'node:crypto'
import { unlink } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import multer from 'multer'
import { uploadDirectory } from '../config/env.js'
import { processDocument } from './documentProcessing.js'

const maxDocumentSize = 10 * 1024 * 1024
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxDocumentSize, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!['.pdf', '.txt', '.md', '.markdown', '.csv'].includes(extname(file.originalname).toLowerCase())) {
      return callback(new Error('Chỉ hỗ trợ tài liệu PDF, TXT, Markdown hoặc CSV'))
    }

    return callback(null, true)
  },
})

export const removeStoredFile = async (storedName) => {
  if (!storedName) return

  const filePath = resolve(uploadDirectory, storedName)
  if (!filePath.startsWith(`${resolve(uploadDirectory)}\\`) && !filePath.startsWith(`${resolve(uploadDirectory)}/`)) return

  try {
    await unlink(filePath)
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Document cleanup error:', error)
  }
}

export const processUploadForStorage = async (file) => {
  try { return await processDocument({ name: file.originalname, mimetype: file.mimetype, buffer: file.buffer }) }
  catch (error) {
    if (!['ENCRYPTED_PDF', 'PAGE_LIMIT', 'EXTRACTION_TIMEOUT'].includes(error.code)) throw error
    return { status: 'FAILED', text: null, hash: createHash('sha256').update(file.buffer).digest('hex'), truncated: false, errorCode: error.code }
  }
}
