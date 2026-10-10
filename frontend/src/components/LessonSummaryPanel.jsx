import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api.js'
import { ErrorState, LoadingState } from './ui/Feedback.jsx'

export default function LessonSummaryPanel({ lesson, onClose }) {
  const [state, setState] = useState({ status: 'loading', summary: null, error: '' })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    apiRequest(`/api/courses/lessons/${lesson.id}/summary`).then((summary) => {
      if (active) setState({ status: 'success', summary, error: '' })
    }).catch((error) => {
      if (active) setState({ status: error.status === 422 ? 'unavailable' : 'error', summary: null, error: error.message })
    })
    return () => { active = false }
  }, [lesson.id, lesson.sourceRevision, retry])
  const summary = state.summary
  return <section className="lesson-summary-panel" aria-labelledby="lesson-summary-title">
    <header><div><span className="eyebrow">TÓM TẮT TRÍCH XUẤT</span><h3 id="lesson-summary-title">{lesson.title}</h3></div><button type="button" aria-label="Đóng tóm tắt" onClick={onClose}>Đóng</button></header>
    {state.status === 'loading' && <LoadingState>Đang tạo tóm tắt từ nội dung bài học…</LoadingState>}
    {state.status === 'unavailable' && <ErrorState title="Chưa có nguồn văn bản để tóm tắt">PDF scan, PDF khóa hoặc PDF không có lớp chữ chưa thể dùng. Giảng viên có thể nhập nội dung bài học hoặc thử trích xuất lại tài liệu.<button type="button" onClick={() => { setState({ status: 'loading', summary: null, error: '' }); setRetry((value) => value + 1) }}>Thử lại</button></ErrorState>}
    {state.status === 'error' && <ErrorState title="Không tải được tóm tắt">{state.error}<button type="button" onClick={() => { setState({ status: 'loading', summary: null, error: '' }); setRetry((value) => value + 1) }}>Thử lại</button></ErrorState>}
    {summary && <><p className="summary-source">Nguồn: {summary.sourceType === 'DOCUMENT' ? 'văn bản trích từ tài liệu' : 'nội dung giảng viên nhập'}{summary.truncated ? ' · Nội dung nguồn đã được giới hạn' : ''}</p>
      {summary.points.length ? <ol>{summary.points.map((point, index) => <li key={`${index}-${point.text}`}>{point.text}{point.page && <small> · Trang {point.page}</small>}</li>)}</ol> : <p>Nội dung ngắn, chưa có câu phù hợp để tạo điểm tóm tắt.</p>}
    </>}
  </section>
}
