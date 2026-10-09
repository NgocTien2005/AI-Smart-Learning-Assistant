import { randomInt } from 'node:crypto'

// Supported local templates use an explicit concept followed by a definition.
// We deliberately skip other sentence shapes rather than guessing a blank.
const supportedPredicates = [
  /\s+(?:giúp|cho phép)\s+/iu,
  /\s+(?:lưu trữ|chứa)\s+/iu,
  /\s+(?:mô tả|biểu diễn)\s+/iu,
  /\s+(?:bao gồm|gồm)\s+/iu,
  /\s+(?:là)\s+/iu,
]

const splitStatements = (text) => text
  .split(/\n+|(?<=[.!?])\s+/u)
  .map((value) => value.replace(/^[-*•]\s*/u, '').trim())
  .filter((value) => value.length >= 24 && value.length <= 320)

const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase('vi').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

const shuffle = (values) => {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

const parseCandidate = (passage) => {
  for (const predicate of supportedPredicates) {
    const match = predicate.exec(passage)
    if (!match || match.index < 2) continue
    const concept = passage.slice(0, match.index).trim().replace(/[,:;]+$/u, '')
    const remainder = passage.slice(match.index + match[0].length).trim()
    if (concept.length < 2 || concept.length > 48 || remainder.length < 10) continue
    // Avoid blanks that are grammatical glue or vague pronouns.
    if (/^(?:nó|đó|điều này|chúng|các|một|những)$/iu.test(concept)) continue
    return { concept, passage, prompt: `_____ ${passage.slice(match.index + 1).trim()}` }
  }
  return null
}

export const createPracticeQuestions = (text, requestedCount = 5) => {
  const uniqueStatements = new Map()
  for (const passage of splitStatements(typeof text === 'string' ? text : '')) {
    const normalized = normalize(passage)
    if (!uniqueStatements.has(normalized)) uniqueStatements.set(normalized, passage)
  }

  const candidates = [...uniqueStatements.values()].map(parseCandidate).filter(Boolean)
  const uniqueCandidates = new Map()
  for (const candidate of candidates) {
    const key = normalize(candidate.concept)
    if (!uniqueCandidates.has(key)) uniqueCandidates.set(key, candidate)
  }
  const valid = [...uniqueCandidates.values()]
  if (valid.length < 4) {
    return { error: 'Chưa có đủ ít nhất 4 khái niệm kèm định nghĩa rõ ràng để tạo câu hỏi. Hãy bổ sung nội dung theo dạng “Khái niệm giúp/lưu trữ/mô tả…”.', availableCount: valid.length }
  }

  const count = Math.min(requestedCount, valid.length, 10)
  const targets = shuffle(valid).slice(0, count)
  const questions = targets.map((target) => {
    const distractorConcepts = shuffle(valid
      .filter(({ concept }) => normalize(concept) !== normalize(target.concept))
      .map(({ concept }) => concept))
    const options = shuffle([target.concept, ...distractorConcepts.slice(0, 3)])
    return {
      prompt: target.prompt,
      options,
      correctIndex: options.findIndex((option) => normalize(option) === normalize(target.concept)),
      explanation: `Trong nội dung bài học, “${target.concept}” được mô tả như trong câu trích dẫn.`,
      sourcePassage: target.passage,
    }
  })

  return { questions, requestedCount, actualCount: questions.length, availableCount: valid.length }
}

export const publicQuizQuestion = (question, index) => ({ id: index, prompt: question.prompt, options: question.options })
