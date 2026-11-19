import { createHash } from 'node:crypto'
import { extname } from 'node:path'
import multer from 'multer'
import { uploadDirectory } from '../config/env.js'
import { processDocument } from './documentProcessing.js'
import { createDocumentStorage } from './documentStorage.js'

export const documentStorage = createDocumentStorage({ directory: uploadDirectory })

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

export const removeStoredFile = async (storedName, storage = documentStorage) => {
  if (!storedName) return

  try {
    await storage.remove(storedName)
  } catch (error) {
    // A provider failure may retain an orphan. Never log URLs, keys or response bodies.
    console.error('Document cleanup incomplete', { code: error.code === 'STORAGE_UNAVAILABLE' ? error.code : 'STORAGE_CLEANUP_FAILED' })
  }
}

export const processUploadForStorage = async (file) => {
  try { return await processDocument({ name: file.originalname, mimetype: file.mimetype, buffer: file.buffer }) }
  catch (error) {
    if (!['ENCRYPTED_PDF', 'PAGE_LIMIT', 'EXTRACTION_TIMEOUT'].includes(error.code)) throw error
    return { status: 'FAILED', text: null, hash: createHash('sha256').update(file.buffer).digest('hex'), truncated: false, errorCode: error.code }
  }
}
