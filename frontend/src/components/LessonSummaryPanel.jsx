import { useEffect, useId, useRef, useState } from 'react'
import { apiRequest } from '../services/api.js'
import { LessonRequestGuard } from '../services/lessonRequestGuard.js'
import Button from './ui/Button.jsx'
import { EmptyState, ErrorState, LoadingState, StatusMessage } from './ui/Feedback.jsx'
import './DocumentStudyPanels.css'

const sourceLabels = { DOCUMENT: 'văn bản trích từ tài liệu', LESSON_CONTENT: 'nội dung giảng viên nhập' }

function SummaryWorkspace({ lesson, onClose }) {
  const [state, setState] = useState({ status: 'loading', summary: null, error: '' })
  const [retry, setRetry] = useState(0)
  const guard = useRef(new LessonRequestGuard())
  const pending = useRef(true)
  const closed = useRef(false)
  const controllerRef = useRef(null)
  const id = useId()

  useEffect(() => {
    closed.current = false
    pending.current = true
    const reads = guard.current
    const request = reads.select(lesson.id)
    const controller = new AbortController()
    controllerRef.current = controller
    apiRequest(`/api/courses/lessons/${lesson.id}/summary`, { signal: controller.signal }).then((summary) => {
      if (!reads.isCurrent(request)) return
      if (Number.isInteger(lesson.sourceRevision) && Number.isInteger(summary.sourceRevision) && lesson.sourceRevision !== summary.sourceRevision) {
        setState({ status: 'changed', summary: null, error: '' })
      } else setState({ status: 'success', summary, error: '' })
    }).catch((error) => {
      if (reads.isCurrent(request) && error.name !== 'AbortError') setState({ status: error.status === 422 ? 'unavailable' : 'error', summary: null, error: error.message })
    }).finally(() => { if (reads.isCurrent(request)) pending.current = false })
    return () => {
      closed.current = true
      reads.clear()
      controller.abort()
    }
  }, [lesson.id, lesson.sourceRevision, retry])

  const reload = () => {
    if (pending.current || closed.current) return
    pending.current = true
    setState({ status: 'loading', summary: null, error: '' })
    setRetry((value) => value + 1)
  }
  const close = () => {
    closed.current = true
    guard.current.clear()
    controllerRef.current?.abort()
    onClose()
  }
  const summary = state.summary
  const recoverable = ['unavailable', 'error', 'changed'].includes(state.status)
  return <section className="lesson-summary-panel summary-workspace" aria-labelledby={id + '-title'}>
    <header className="study-panel-header"><div><span className="eyebrow">TÓM TẮT TRÍCH XUẤT</span><h3 id={id + '-title'}>{lesson.title}</h3></div><Button variant="secondary" aria-label="Đóng tóm tắt" onClick={close}>Đóng</Button></header>
    <p className="study-panel-intro">Các câu được chọn từ văn bản nguồn, không phải diễn giải bằng AI. Chỉ hiển thị tham chiếu trang khi nguồn cung cấp.</p>
    {state.status === 'loading' && <LoadingState>Đang tạo tóm tắt từ nội dung bài học…</LoadingState>}
    {state.status === 'unavailable' && <ErrorState title="Chưa có nguồn văn bản để tóm tắt">Bài học chưa có văn bản dùng được. Có thể dùng nội dung nhập trực tiếp hoặc văn bản trích từ tài liệu. PDF cần có lớp chữ; không hỗ trợ OCR. Giảng viên sở hữu khóa học có thể kiểm tra nguồn trong phần bài học.</ErrorState>}
    {state.status === 'error' && <ErrorState title="Không tải được tóm tắt">{state.error}</ErrorState>}
    {state.status === 'changed' && <ErrorState title="Nguồn bài học đã thay đổi">Tóm tắt nhận được thuộc phiên bản nguồn khác nên chưa được hiển thị. Thử lại hoặc tải lại trang để cập nhật nội dung bài học.</ErrorState>}
    {(recoverable || retry > 0) && <div className="summary-recovery"><Button variant="secondary" disabled={state.status === 'loading'} onClick={reload}>Thử lại</Button></div>}
    {summary && <>
      <div className="summary-source">
        {sourceLabels[summary.sourceType] && <p>Nguồn: {sourceLabels[summary.sourceType]}</p>}
        {Number.isInteger(summary.sourceRevision) && <p>Phiên bản nguồn {summary.sourceRevision}</p>}
        {summary.truncated && <p>Nguồn đã được giới hạn; tóm tắt chỉ dựa trên phần văn bản được trích xuất.</p>}
      </div>
      <StatusMessage type="success">Đã tạo tóm tắt trích xuất.</StatusMessage>
      {summary.points.length > 0 ? <ol className="summary-points">{summary.points.map((point, index) => <li key={index}><p>{point.text}</p>{Number.isInteger(point.page) && point.page > 0 && <small>Trang {point.page}</small>}</li>)}</ol>
        : <EmptyState title="Chưa có điểm tóm tắt phù hợp">Nguồn văn bản đã có nhưng ngắn hoặc chưa có câu phù hợp để trích xuất. Bạn vẫn có thể đọc nội dung gốc của bài học.</EmptyState>}
    </>}
  </section>
}

export default function LessonSummaryPanel({ lesson, ...props }) {
  return <SummaryWorkspace key={lesson.id + ':' + lesson.sourceRevision} lesson={lesson} {...props} />
}
