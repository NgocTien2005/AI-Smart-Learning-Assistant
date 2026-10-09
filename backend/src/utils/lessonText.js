import { extname } from 'node:path'

const textDocumentTypes = new Set(['text/plain', 'text/markdown', 'text/csv'])

export const uploadedLessonText = ({ mimetype, buffer, content }) => textDocumentTypes.has(mimetype)
  ? buffer.toString('utf8').slice(0, 100000)
  : content || null

export const lessonTextAfterContentEdit = (lesson, content) => {
  const isPdf = lesson.documentUrl && extname(lesson.documentName || '').toLowerCase() === '.pdf'
  return !lesson.documentUrl || isPdf ? content || null : lesson.extractedText
}

export const lessonTextAfterDocumentRemoval = (content) => content || null
