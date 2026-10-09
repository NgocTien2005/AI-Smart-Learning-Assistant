import { randomInt } from 'node:crypto'

const splitStatements = (text) => [...new Set(text
  .split(/\n+|(?<=[.!?])\s+/)
  .map((value) => value.replace(/^[-*•]\s*/, '').trim())
  .filter((value) => value.length >= 20 && value.length <= 320))]

const shuffle = (values) => {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

export const createPracticeQuestions = (text, requestedCount = 5) => {
  const statements = splitStatements(text)
  if (statements.length < 4) {
    return { error: 'Bài học cần ít nhất bốn ý hoặc câu rõ ràng để tạo bài ôn tập.' }
  }

  const count = Math.min(requestedCount, statements.length, 10)
  const targets = shuffle(statements).slice(0, count)
  const questions = targets.map((answer) => {
    const distractors = shuffle(statements.filter((statement) => statement !== answer)).slice(0, 3)
    const options = shuffle([answer, ...distractors])
    return {
      prompt: 'Theo nội dung bài học, phát biểu nào được nêu?',
      options,
      correctIndex: options.indexOf(answer),
    }
  })

  return { questions }
}

