import test from 'node:test'
import assert from 'node:assert/strict'
import { createPracticeQuestions } from '../src/utils/studyQuiz.js'

const source = [
  'Lập trình mô tả các bước để máy tính thực hiện một nhiệm vụ.',
  'Biến lưu trữ giá trị để chương trình có thể sử dụng lại.',
  'Vòng lặp giúp thực hiện lại một nhóm lệnh nhiều lần.',
  'Kiểu dữ liệu bao gồm số, chuỗi và giá trị boolean.',
  'Hàm là một nhóm lệnh có thể được gọi lại trong chương trình.',
].join('\n')

test('uses source-grounded fill-in prompts instead of asking which source statement appears', () => {
  const result = createPracticeQuestions(source, 5)
  assert.equal(result.questions.length, 5)
  for (const question of result.questions) {
    assert.doesNotMatch(question.prompt, /phát biểu nào được nêu/iu)
    assert.equal(question.options.length, 4)
    assert.equal(new Set(question.options.map((option) => option.normalize('NFKC').toLocaleLowerCase('vi'))).size, 4)
    assert.equal(question.options.filter((option) => option.normalize('NFKC').toLocaleLowerCase('vi') === question.options[question.correctIndex].normalize('NFKC').toLocaleLowerCase('vi')).length, 1)
    assert.ok(question.prompt.startsWith('_____'))
    assert.ok(question.sourcePassage)
    assert.ok(question.explanation)
    const concept = question.sourcePassage.match(/^(.+?)\s+(?:giúp|cho phép|lưu trữ|chứa|mô tả|biểu diễn|bao gồm|gồm|là)\s+/iu)?.[1]
    assert.ok(concept)
    assert.equal(question.options.filter((option) => option.normalize('NFKC').toLocaleLowerCase('vi') === concept.normalize('NFKC').toLocaleLowerCase('vi')).length, 1)
  }
})

test('supports Vietnamese definition patterns and returns fewer questions without padding', () => {
  const result = createPracticeQuestions(source, 8)
  assert.equal(result.actualCount, 5)
  assert.equal(result.requestedCount, 8)
  assert.equal(result.questions.length, 5)
})

test('skips duplicate concepts, normalized duplicate passages, unsupported and ambiguous sentence shapes', () => {
  const result = createPracticeQuestions([
    'Vòng lặp giúp thực hiện lại một nhóm lệnh nhiều lần.',
    '  VÒNG   LẶP giúp thực hiện lại một nhóm lệnh nhiều lần! ',
    'Biến lưu trữ giá trị để chương trình có thể sử dụng lại.',
    'Thành phần này hoạt động theo cách đặc biệt trong vài trường hợp.',
    'Kiểu dữ liệu bao gồm số, chuỗi và giá trị boolean.',
    'Hàm là một nhóm lệnh có thể được gọi lại trong chương trình.',
  ].join('\n'), 5)
  assert.equal(result.questions.length, 4)
  for (const question of result.questions) assert.equal(new Set(question.options.map((option) => option.normalize('NFKC').toLocaleLowerCase('vi'))).size, 4)
})

test('returns a useful failure when insufficient supported source concepts exist', () => {
  const result = createPracticeQuestions('Một câu thông thường không có khái niệm và định nghĩa rõ ràng.')
  assert.equal(result.questions, undefined)
  assert.equal(result.availableCount, 0)
  assert.match(result.error, /ít nhất 4 khái niệm/iu)
})
