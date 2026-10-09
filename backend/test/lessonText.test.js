import assert from 'node:assert/strict'
import test from 'node:test'
import { lessonTextAfterContentEdit, lessonTextAfterDocumentRemoval, uploadedLessonText } from '../src/utils/lessonText.js'

test('uses edited lesson content as the fallback for a PDF', () => {
  const lesson = { documentUrl: 'stored.pdf', documentName: 'slides.PDF', extractedText: 'old fallback' }
  assert.equal(lessonTextAfterContentEdit(lesson, 'new fallback'), 'new fallback')
})

test('preserves document-derived TXT, Markdown, and CSV text during content edits', () => {
  const lesson = { documentUrl: 'stored.txt', documentName: 'notes.txt', extractedText: 'document source' }
  assert.equal(lessonTextAfterContentEdit(lesson, 'edited description'), 'document source')
})

test('uses uploaded text documents as source and PDF content as fallback', () => {
  const text = Buffer.from('document source')
  assert.equal(uploadedLessonText({ mimetype: 'text/markdown', buffer: text, content: 'fallback' }), 'document source')
  assert.equal(uploadedLessonText({ mimetype: 'application/pdf', buffer: Buffer.from('%PDF'), content: 'fallback' }), 'fallback')
  assert.equal(lessonTextAfterDocumentRemoval('lesson content'), 'lesson content')
  assert.equal(lessonTextAfterDocumentRemoval(null), null)
})
