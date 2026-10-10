import { createHash } from 'node:crypto'
import { extname } from 'node:path'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
export const MAX_DOCUMENT_PAGES = 250
export const MAX_DOCUMENT_TEXT = 100_000
export const EXTRACTION_TIMEOUT_MS = 15_000

const mimeByExtension = new Map([
  ['.pdf', 'application/pdf'], ['.txt', 'text/plain'], ['.md', 'text/markdown'],
  ['.markdown', 'text/markdown'], ['.csv', 'text/csv'],
])
const compatibleMimes = new Map([
  ['.pdf', new Set(['application/pdf'])], ['.txt', new Set(['text/plain'])],
  ['.md', new Set(['text/markdown', 'text/x-markdown', 'text/plain'])],
  ['.markdown', new Set(['text/markdown', 'text/x-markdown', 'text/plain'])],
  ['.csv', new Set(['text/csv', 'application/csv', 'application/vnd.ms-excel'])],
])
const normalize = (text) => text.replace(/\r\n?/g, '\n').replace(/[\t\f\v ]+/g, ' ')
  .replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim()
const textFromItems = (items) => {
  let output = ''
  let previous = null
  for (const item of items) {
    if (typeof item.str !== 'string' || !item.str) continue
    if (previous) {
      const previousY = previous.transform?.[5]
      const currentY = item.transform?.[5]
      const previousEnd = (previous.transform?.[4] || 0) + (previous.width || 0)
      const gap = (item.transform?.[4] || 0) - previousEnd
      if (item.hasEOL || (Number.isFinite(previousY) && Number.isFinite(currentY) && Math.abs(previousY - currentY) > 2)) output += '\n'
      else if (gap > 1.5 && !/\s$/.test(output) && !/^\s/.test(item.str)) output += ' '
    }
    output += item.str
    previous = item
  }
  return output
}

export const classifyDocument = ({ name, mimetype = '', buffer }) => {
  const extension = extname(name || '').toLowerCase()
  const expectedMime = mimeByExtension.get(extension)
  if (!expectedMime) throw Object.assign(new Error('Định dạng tệp chưa được hỗ trợ.'), { code: 'UNSUPPORTED_TYPE' })
  if (mimetype && mimetype !== 'application/octet-stream' && !compatibleMimes.get(extension).has(mimetype)) {
    throw Object.assign(new Error('Loại tệp không khớp với tên tệp.'), { code: 'TYPE_MISMATCH' })
  }
  const isPdf = extension === '.pdf'
  if (isPdf && buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw Object.assign(new Error('Tệp không phải PDF hợp lệ.'), { code: 'CORRUPT_DOCUMENT' })
  }
  if (!isPdf) {
    const text = buffer.toString('utf8')
    if (text.includes('\u0000') || text.includes('\uFFFD')) throw Object.assign(new Error('Tệp văn bản không đọc được.'), { code: 'INVALID_TEXT' })
  }
  return isPdf ? 'pdf' : 'text'
}

export const processDocument = async ({ name, mimetype, buffer, timeoutMs = EXTRACTION_TIMEOUT_MS }) => {
  if (!Buffer.isBuffer(buffer) || buffer.length > MAX_DOCUMENT_BYTES) throw Object.assign(new Error('Tệp vượt giới hạn 10 MiB.'), { code: 'SIZE_LIMIT' })
  const kind = classifyDocument({ name, mimetype, buffer })
  if (timeoutMs <= 0) throw Object.assign(new Error('Xử lý tài liệu quá thời gian.'), { code: 'EXTRACTION_TIMEOUT' })
  const hash = createHash('sha256').update(buffer).digest('hex')
  if (kind === 'text') {
    const text = normalize(buffer.toString('utf8')).slice(0, MAX_DOCUMENT_TEXT)
    return { status: text ? 'SUCCESS' : 'NO_TEXT', text: text || null, truncated: buffer.toString('utf8').length > MAX_DOCUMENT_TEXT, hash, pages: [] }
  }
  let activeTask
  const parse = async () => {
    let pdf
    try {
      const task = getDocument({ data: new Uint8Array(buffer), stopAtErrors: true, isEvalSupported: false,
        standardFontDataUrl: new URL('../../node_modules/pdfjs-dist/standard_fonts/', import.meta.url).href })
      activeTask = task
      pdf = await task.promise
      if (pdf.numPages > MAX_DOCUMENT_PAGES) throw Object.assign(new Error(), { code: 'PAGE_LIMIT' })
      const pages = []
      let total = 0
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber)
        const content = await page.getTextContent()
        const lines = textFromItems(content.items)
        const text = normalize(lines)
        if (text) pages.push({ page: pageNumber, text })
        total += text.length
        if (total >= MAX_DOCUMENT_TEXT) break
      }
      const truncated = total > MAX_DOCUMENT_TEXT || pdf.numPages > pages.length && total >= MAX_DOCUMENT_TEXT
      let remaining = MAX_DOCUMENT_TEXT
      const boundedPages = pages.map(({ page, text }) => { const part = text.slice(0, remaining); remaining -= part.length; return { page, text: part } }).filter(({ text }) => text)
      const output = boundedPages.map(({ page, text }) => `[Trang ${page}]\n${text}`).join('\n\n')
      return { status: output ? 'SUCCESS' : 'NO_TEXT', text: output || null, pages: boundedPages.map(({ page }) => page), truncated, hash }
    } catch (error) {
      if (error.code) throw error
      const message = `${error?.name || ''} ${error?.message || ''}`.toLowerCase()
      const code = /password|encrypt/.test(message) ? 'ENCRYPTED_PDF' : 'CORRUPT_DOCUMENT'
      throw Object.assign(new Error(code === 'ENCRYPTED_PDF' ? 'PDF được bảo vệ bằng mật khẩu.' : 'Không thể đọc tệp PDF.'), { code })
    } finally { await pdf?.cleanup?.() }
  }
  let timer
  try {
    return await Promise.race([parse(), new Promise((_, reject) => { timer = setTimeout(() => {
      activeTask?.destroy()
      reject(Object.assign(new Error('Xử lý tài liệu quá thời gian.'), { code: 'EXTRACTION_TIMEOUT' }))
    }, timeoutMs) })])
  } finally { clearTimeout(timer) }
}
