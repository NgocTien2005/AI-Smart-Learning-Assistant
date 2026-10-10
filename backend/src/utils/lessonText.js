export const resolveLessonSource = (lesson) => {
  if (lesson?.documentUrl && lesson.extractionStatus === 'SUCCESS' && lesson.documentText) return {
    text: lesson.documentText, sourceType: 'DOCUMENT', revision: lesson.sourceRevision || 0,
    truncated: Boolean(lesson.extractionTruncated), pages: extractPageReferences(lesson.documentText),
  }
  if (lesson?.content?.trim()) return { text: lesson.content.trim(), sourceType: 'LESSON_CONTENT', revision: lesson.sourceRevision || 0, truncated: false, pages: [] }
  return { text: '', sourceType: 'NONE', revision: lesson.sourceRevision || 0, truncated: false, pages: [] }
}

export const uploadedLessonText = ({ mimetype = '', buffer, content }) => {
  const extension = (mimetype || '').toLowerCase()
  if (['text/plain', 'text/markdown', 'text/csv'].includes(extension)) return buffer.toString('utf8').slice(0, 100000)
  return content || null
}

export const extractPageReferences = (text) => [...text.matchAll(/^\[Trang (\d+)\]$/gm)].map((match) => Number(match[1]))

export const lessonTextAfterContentEdit = (lesson, content) => {
  if (lesson.extractionStatus === 'SUCCESS' && lesson.documentText) return lesson.extractedText
  // Compatibility for legacy text uploads; newly processed sources use documentText.
  if (lesson.documentUrl && !lesson.documentName?.toLowerCase().endsWith('.pdf') && lesson.extractedText) return lesson.extractedText
  return content || null
}

export const lessonTextAfterDocumentRemoval = (content) => content || null

const sentences = (text) => text.replace(/\[Trang \d+\]\n/g, '').split(/(?<=[.!?。])\s+|\n+/).map((value) => value.trim()).filter(Boolean)
const words = (value) => new Set((value.toLocaleLowerCase('vi').match(/[\p{L}\p{N}]{3,}/gu) || []))

export const createExtractiveSummary = (source, limit = 5) => {
  const values = sentences(source.text)
  const unique = []
  const seen = new Set()
  for (const text of values) {
    const key = text.normalize('NFC').toLocaleLowerCase('vi').replace(/\s+/g, ' ')
    if (key.length < 18 || seen.has(key)) continue
    seen.add(key)
    const pageMarker = source.text.match(new RegExp(`\\[Trang (\\d+)\\][\\s\\S]*?${text.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`))?.[1]
    unique.push({ text, page: pageMarker ? Number(pageMarker) : null, score: words(text).size })
  }
  const selected = [...unique].sort((a, b) => b.score - a.score).slice(0, limit).sort((a, b) => values.indexOf(a.text) - values.indexOf(b.text))
  return selected.map(({ text, page }) => ({ text, page }))
}
