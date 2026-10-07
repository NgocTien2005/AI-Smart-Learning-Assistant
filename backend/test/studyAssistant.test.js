import assert from 'node:assert/strict'
import test from 'node:test'
import { answerFromDocument } from '../src/utils/studyAssistant.js'

test('returns the most relevant passage without changing the source text', () => {
  const source = [
    'Machine Learning giúp hệ thống học từ dữ liệu thay vì chỉ làm theo quy tắc cố định.',
    'Mạng nơ-ron gồm nhiều lớp nút xử lý và thường được dùng trong nhận dạng hình ảnh.',
    'Prompt là chỉ dẫn được gửi tới một mô hình ngôn ngữ.',
  ].join('\n\n')

  const answer = answerFromDocument('Mạng nơ-ron dùng để làm gì?', source)

  assert.match(answer, /nhận dạng hình ảnh/)
  assert.doesNotMatch(answer, /Prompt là chỉ dẫn/)
})

test('reports when the document does not contain a relevant passage', () => {
  const answer = answerFromDocument('Blockchain hoạt động thế nào?', 'Bài học này giới thiệu mạng nơ-ron nhân tạo.')
  assert.match(answer, /Không tìm thấy/)
})
