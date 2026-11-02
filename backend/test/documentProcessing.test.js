import test from 'node:test'
import assert from 'node:assert/strict'
import { processDocument } from '../src/services/documentProcessing.js'
import { createExtractiveSummary, resolveLessonSource } from '../src/utils/lessonText.js'

import { pdfFixture } from '../scripts/fixtures/pdf.mjs'

test('extracts PDF text with real page references and Vietnamese text', async () => {
  const text = 'Hệ thống quản lý học tập lưu trữ bài học.'
  const result = await processDocument({ name: 'lesson.pdf', buffer: pdfFixture(text) })
  assert.equal(result.status, 'SUCCESS')
  assert.match(result.text, /Hệ thống quản lý học tập lưu trữ bài học/)
  assert.deepEqual(result.pages, [1])
})

test('reports no-text PDFs and rejects disguised corrupt files', async () => {
  const blank = await processDocument({ name: 'scan.pdf', buffer: pdfFixture('') })
  assert.equal(blank.status, 'NO_TEXT')
  await assert.rejects(processDocument({ name: 'fake.pdf', buffer: Buffer.from('not a PDF') }), { code: 'CORRUPT_DOCUMENT' })
  await assert.rejects(processDocument({ name: 'too-many-pages.pdf', buffer: pdfFixture('x', 251) }), { code: 'PAGE_LIMIT' })
})

test('accepts text file extensions when platform MIME is missing and enforces timeout', async () => {
  const result = await processDocument({ name: 'notes.markdown', buffer: Buffer.from('Một đoạn văn bản có dấu.') })
  assert.equal(result.status, 'SUCCESS')
  assert.equal((await processDocument({ name: 'data.csv', mimetype: 'application/vnd.ms-excel', buffer: Buffer.from('a,b\n1,2') })).status, 'SUCCESS')
  await assert.rejects(processDocument({ name: 'slow.pdf', buffer: pdfFixture('abc'), timeoutMs: 0 }), { code: 'EXTRACTION_TIMEOUT' })
})

test('bounds upload and extracted text sizes and rejects invalid MIME/content combinations', async () => {
  await assert.rejects(processDocument({ name: 'large.txt', buffer: Buffer.alloc(10 * 1024 * 1024 + 1, 65) }), { code: 'SIZE_LIMIT' })
  const longText = await processDocument({ name: 'long.txt', buffer: Buffer.from('A'.repeat(100_020)) })
  assert.equal(longText.text.length, 100_000)
  assert.equal(longText.truncated, true)
  await assert.rejects(processDocument({ name: 'fake.pdf', buffer: Buffer.from('plain text') }), { code: 'CORRUPT_DOCUMENT' })
  await assert.rejects(processDocument({ name: 'notes.txt', mimetype: 'application/pdf', buffer: Buffer.from('text') }), { code: 'TYPE_MISMATCH' })
})

test('summaries select unique source sentences with page references and source fallback', () => {
  const source = { text: '[Trang 2]\nHệ thống quản lý lưu trữ tài liệu quan trọng. Hệ thống quản lý lưu trữ tài liệu quan trọng.\nMột nội dung khác giải thích dữ liệu được tổ chức theo khóa học.', sourceType: 'DOCUMENT', revision: 2, truncated: false }
  const points = createExtractiveSummary(source)
  assert.equal(points.length, 2)
  assert.equal(points[0].page, 2)
  const fallback = resolveLessonSource({ content: 'Nội dung do giảng viên nhập.', documentUrl: 'old.pdf', extractionStatus: 'NOT_PROCESSED', extractedText: 'legacy pdf fallback' })
  assert.equal(fallback.sourceType, 'LESSON_CONTENT')
  assert.equal(fallback.text, 'Nội dung do giảng viên nhập.')
})
