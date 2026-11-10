const stopWords = new Set([
  'ai', 'anh', 'ban', 'bai', 'cac', 'cai', 'cho', 'co', 'cua', 'duoc', 'gi', 'hay', 'khi', 'la', 'lam',
  'mot', 'nao', 'nhung', 'noi', 'o', 'tai', 'the', 'thi', 'toi', 'trong', 'tu', 'va', 've', 'voi',
])

const normalize = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/đ/g, 'd')
  .replace(/[^a-z0-9\s]/g, ' ')

const keywords = (question) => [...new Set(normalize(question)
  .split(/\s+/)
  .filter((word) => word.length > 1 && !stopWords.has(word)))]

export const answerFromDocument = (question, documentText) => {
  const terms = keywords(question)
  const passages = documentText
    .split(/\n\s*\n|(?<=[.!?])\s+/)
    .map((passage) => passage.trim())
    .filter((passage) => passage.length >= 20)

  const ranked = passages
    .map((passage, index) => {
      const passageTerms = new Set(normalize(passage).split(/\s+/))
      const score = terms.reduce((total, term) => total + (passageTerms.has(term) ? 1 : 0), 0)
      return { passage, score, index }
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 3)

  if (!terms.length || !ranked.length) {
    return 'Không tìm thấy đoạn nội dung phù hợp trong tài liệu của bài học. Hãy hỏi bằng từ khóa cụ thể hơn.'
  }

  return `Theo tài liệu bài học:\n\n${ranked.map(({ passage }) => `• ${passage}`).join('\n\n')}`
}
