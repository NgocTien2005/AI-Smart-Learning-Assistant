import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../services/api.js'
import { LessonRequestGuard } from '../services/lessonRequestGuard.js'
import { EmptyState, ErrorState, LoadingState, StatusMessage } from './ui/Feedback.jsx'

function DocumentAssistantPanel({ lesson, onClose }) {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [historyLoading, setHistoryLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [sendError, setSendError] = useState('')
  const [hasNewReply, setHasNewReply] = useState(false)
  const guard = useRef(new LessonRequestGuard())
  const historyRef = useRef(null)
  const nearBottomRef = useRef(true)

  const loadHistory = useCallback(async () => {
    const request = guard.current.select(lesson.id)
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const data = await apiRequest(`/api/courses/lessons/${lesson.id}/chat`)
      if (guard.current.isCurrent(request)) setMessages(data.messages)
    } catch (error) {
      if (guard.current.isCurrent(request)) setHistoryError(error.message)
    } finally {
      if (guard.current.isCurrent(request)) setHistoryLoading(false)
    }
  }, [lesson.id])

  useEffect(() => {
    const requestGuard = guard.current
    queueMicrotask(loadHistory)
    return () => requestGuard.clear()
  }, [loadHistory])

  useEffect(() => {
    if (nearBottomRef.current && historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight
    else if (!historyLoading && messages.length) queueMicrotask(() => setHasNewReply(true))
  }, [messages, historyLoading])

  const sendQuestion = async (event) => {
    event.preventDefault()
    const submittedQuestion = question.trim()
    if (submittedQuestion.length < 3 || sending) return
    const request = guard.current.select(lesson.id)
    setSending(true)
    setSendError('')
    try {
      const data = await apiRequest(`/api/courses/lessons/${lesson.id}/chat`, { method: 'POST', body: JSON.stringify({ question: submittedQuestion }) })
      if (!guard.current.isCurrent(request)) return
      setMessages((current) => [...current, data.message])
      setQuestion('')
      setHasNewReply(!nearBottomRef.current)
    } catch (error) {
      if (!guard.current.isCurrent(request)) return
      setSendError(error.status === 422 ? 'Bài học chưa có nguồn văn bản dùng được để tra cứu. PDF cần có lớp văn bản trích xuất được; bản scan không được hỗ trợ OCR. Có thể dùng nội dung nhập trực tiếp.' : error.message)
    } finally {
      if (guard.current.isCurrent(request)) setSending(false)
    }
  }

  const jumpToLatest = () => {
    if (!historyRef.current) return
    historyRef.current.scrollTop = historyRef.current.scrollHeight
    nearBottomRef.current = true
    setHasNewReply(false)
  }

  return <section className="assistant-panel" aria-labelledby="assistant-title"><header><div><span aria-hidden="true">✦</span><div><small>TRA CỨU TÀI LIỆU CỤC BỘ</small><h2 id="assistant-title">{lesson.title}</h2></div></div><button type="button" aria-label="Đóng trợ lý tài liệu" onClick={() => { guard.current.clear(); onClose() }}>×</button></header>
    <p className="assistant-note">Tra cứu dựa trên nội dung văn bản của bài học. Câu trả lời không được gửi tới nhà cung cấp AI bên ngoài.</p>
    {historyError && <ErrorState title="Không tải được lịch sử trò chuyện" onRetry={loadHistory}>{historyError}</ErrorState>}
    {historyLoading ? <LoadingState>Đang tải lịch sử trò chuyện…</LoadingState> : <div className="chat-history" ref={historyRef} onScroll={(event) => { nearBottomRef.current = event.currentTarget.scrollHeight - event.currentTarget.scrollTop - event.currentTarget.clientHeight < 56; if (nearBottomRef.current) setHasNewReply(false) }} aria-live="polite">
      {messages.length === 0 ? <EmptyState title="Chưa có câu hỏi">Hỏi về nội dung văn bản trong bài học để tra cứu đoạn liên quan.</EmptyState> : messages.map((message) => <article className="chat-pair" key={message.id}><p className="question"><strong>Bạn</strong>{message.question}</p><p className="answer"><strong>Lumina · tra cứu cục bộ</strong>{message.answer}</p></article>)}
    </div>}
    {hasNewReply && <button type="button" className="new-reply-button" onClick={jumpToLatest}>Có câu trả lời mới · Đến tin mới nhất</button>}
    {sendError && <StatusMessage type="error">{sendError}</StatusMessage>}
    <form className="chat-form" onSubmit={sendQuestion}><label className="sr-only" htmlFor="lesson-question">Câu hỏi về bài học</label><input id="lesson-question" value={question} onChange={(event) => { setQuestion(event.target.value); setSendError('') }} minLength="3" maxLength="1000" placeholder="Nhập từ khóa hoặc câu hỏi trong bài…" disabled={historyLoading} required /><button className="primary-button" disabled={sending || historyLoading || !question.trim()}>{sending ? 'Đang tra cứu…' : 'Gửi'}</button></form>
  </section>
}

export default DocumentAssistantPanel
