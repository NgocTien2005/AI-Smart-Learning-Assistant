import test from 'node:test'
import assert from 'node:assert/strict'
import { createPracticeQuestions } from '../src/utils/studyQuiz.js'

const source = [
  'Lập trình mô tả các bước để máy tính thực hiện một nhiệm vụ.',
  'Biến lưu trữ giá trị để chương trình có thể sử dụng lại.',
  'Các kiểu dữ liệu phổ biến gồm số, chuỗi và giá trị boolean.',
  'Câu lệnh điều kiện chọn nhánh dựa trên biểu thức đúng hoặc sai.',
  'Vòng lặp giúp thực hiện lại một nhóm lệnh nhiều lần.',
].join('\n')

test('creates answer-keyed multiple-choice questions from source statements', () => {
  const result = createPracticeQuestions(source, 5)
  assert.equal(result.questions.length, 5)
  for (const question of result.questions) {
    assert.equal(question.options.length, 4)
    assert.equal(new Set(question.options).size, 4)
    assert.ok(question.correctIndex >= 0 && question.correctIndex < 4)
    assert.ok(source.includes(question.options[question.correctIndex]))
  }
})

test('caps the requested number of questions to available source statements', () => {
  assert.equal(createPracticeQuestions(source, 10).questions.length, 5)
})

test('requires enough source statements for meaningful choices', () => {
  const result = createPracticeQuestions('Một câu đơn giản không đủ để tạo bài ôn.')
  assert.match(result.error, /ít nhất bốn/)
})

