import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { apiRequest } from '../services/api.js'
import { LessonRequestGuard } from '../services/lessonRequestGuard.js'
import Button from './ui/Button.jsx'
import { EmptyState, ErrorState, LoadingState, StatusMessage } from './ui/Feedback.jsx'
import './DocumentStudyPanels.css'

const reconcileMessages = (...groups) => [...new Map(groups.flat().map((message) => [message.id, message])).values()]
  .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt) || left.id - right.id)
  .slice(-50)

function LookupWorkspace({ lesson, onClose }) {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [sending, setSending] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [sendError, setSendError] = useState('')
  const [notice, setNotice] = useState('')
  const [hasNewReply, setHasNewReply] = useState(false)
  const historyGuard = useRef(new LessonRequestGuard())
  const sendGuard = useRef(new LessonRequestGuard())
  const historyPending = useRef(false)
  const sendPending = useRef(false)
  const draftEdit = useRef(0)
  const closed = useRef(false)
  const confirmed = useRef([])
  const knownIds = useRef(new Set())
  const loaded = useRef(false)
  const historyRef = useRef(null)
  const nearBottom = useRef(true)
  const readingAnchor = useRef(null)
  const latestReplyRef = useRef(null)
  const composerRef = useRef(null)
  const id = useId()

  const captureReadingPosition = useCallback(() => {
    const region = historyRef.current
    if (!region || nearBottom.current) return
    const top = region.getBoundingClientRect().top
    const anchor = [...region.querySelectorAll('[data-message-id]')].find((element) => element.getBoundingClientRect().bottom > top)
    readingAnchor.current = { id: anchor?.dataset.messageId, top: anchor ? anchor.getBoundingClientRect().top - top : 0, scrollTop: region.scrollTop }
  }, [])

  const loadHistory = useCallback(async () => {
    if (closed.current || historyPending.current) return
    historyPending.current = true
    const request = historyGuard.current.select(lesson.id)
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const data = await apiRequest(`/api/courses/lessons/${lesson.id}/chat`)
      if (!historyGuard.current.isCurrent(request)) return
      const next = reconcileMessages(data.messages, confirmed.current)
      captureReadingPosition()
      if (loaded.current && next.some((message) => !knownIds.current.has(message.id)) && !nearBottom.current) setHasNewReply(true)
      knownIds.current = new Set(next.map((message) => message.id))
      loaded.current = true
      setHistoryLoaded(true)
      setMessages(next)
    } catch (error) {
      if (historyGuard.current.isCurrent(request)) setHistoryError(error.message)
    } finally {
      if (historyGuard.current.isCurrent(request)) {
        historyPending.current = false
        setHistoryLoading(false)
      }
    }
  }, [lesson.id, captureReadingPosition])

  useEffect(() => {
    closed.current = false
    let active = true
    const reads = historyGuard.current
    const sends = sendGuard.current
    queueMicrotask(() => { if (active) loadHistory() })
    return () => {
      active = false
      closed.current = true
      historyPending.current = false
      reads.clear()
      sends.clear()
    }
  }, [loadHistory])

  useLayoutEffect(() => {
    const region = historyRef.current
    if (!region) return
    if (nearBottom.current) region.scrollTop = region.scrollHeight
    else if (readingAnchor.current) {
      const saved = readingAnchor.current
      const anchor = [...region.querySelectorAll('[data-message-id]')].find((element) => element.dataset.messageId === saved.id)
      region.scrollTop = anchor ? saved.scrollTop + anchor.getBoundingClientRect().top - region.getBoundingClientRect().top - saved.top : saved.scrollTop
    }
    readingAnchor.current = null
  }, [messages])

  const sendQuestion = async (event) => {
    event.preventDefault()
    const submittedQuestion = question.trim()
    if (submittedQuestion.length < 3 || submittedQuestion.length > 1000) {
      setSendError('Câu hỏi phải từ 3 đến 1000 ký tự sau khi bỏ khoảng trắng ở hai đầu.')
      return
    }
    if (closed.current || sendPending.current) return
    sendPending.current = true
    const submittedEdit = draftEdit.current
    const request = sendGuard.current.select(lesson.id)
    setSending(true)
    setSendError('')
    setNotice('')
    composerRef.current?.focus({ preventScroll: true })
    try {
      const data = await apiRequest(`/api/courses/lessons/${lesson.id}/chat`, { method: 'POST', body: JSON.stringify({ question: submittedQuestion }) })
      if (!sendGuard.current.isCurrent(request)) return
      captureReadingPosition()
      confirmed.current = reconcileMessages(confirmed.current, [data.message])
      knownIds.current.add(data.message.id)
      setMessages((current) => reconcileMessages(current, [data.message]))
      if (draftEdit.current === submittedEdit) setQuestion('')
      setHasNewReply(!nearBottom.current)
      setNotice('Đã thêm câu trả lời vào lịch sử.')
    } catch (error) {
      if (!sendGuard.current.isCurrent(request)) return
      setSendError(error.status === 422
        ? 'Bài học chưa có nguồn văn bản dùng được để tra cứu. Có thể dùng nội dung nhập trực tiếp hoặc tài liệu có lớp văn bản; PDF scan không được hỗ trợ OCR.'
        : error.message + ' Câu hỏi có thể đã được lưu. Tải lại lịch sử để kiểm tra trước khi gửi lại.')
    } finally {
      if (sendGuard.current.isCurrent(request)) {
        sendPending.current = false
        setSending(false)
      }
    }
  }

  const jumpToLatest = () => {
    if (!historyRef.current) return
    historyRef.current.scrollTop = historyRef.current.scrollHeight
    nearBottom.current = true
    setHasNewReply(false)
    latestReplyRef.current?.focus({ preventScroll: true })
  }

  const close = () => {
    closed.current = true
    historyGuard.current.clear()
    sendGuard.current.clear()
    onClose()
  }

  const valid = question.trim().length >= 3 && question.trim().length <= 1000
  return <section className="assistant-panel lookup-workspace" aria-labelledby={id + '-title'}>
    <header className="study-panel-header"><div><span className="eyebrow">TRA CỨU TÀI LIỆU CỤC BỘ</span><h2 id={id + '-title'}>{lesson.title}</h2></div><Button variant="secondary" onClick={close} aria-label="Đóng trợ lý tài liệu">Đóng</Button></header>
    <p className="study-panel-intro">Tìm đoạn liên quan trong văn bản bài học, không dùng dịch vụ AI bên ngoài. PDF cần có lớp văn bản; không hỗ trợ OCR.</p>
    <div className="lookup-history-toolbar"><div><h3>Lịch sử tra cứu</h3><small>Tối đa 50 câu hỏi gần nhất của bạn</small></div><Button variant="secondary" disabled={historyLoading} onClick={loadHistory} aria-label="Tải lại lịch sử">{historyLoading ? 'Đang tải…' : 'Tải lại lịch sử'}</Button></div>
    <p className="lookup-history-note">Câu trả lời trong lịch sử có thể dựa trên nội dung trước khi bài học được cập nhật.</p>
    {historyLoading && <LoadingState>{historyLoaded ? 'Đang tải lại lịch sử… Nội dung đã có vẫn được giữ.' : 'Đang tải lịch sử tra cứu…'}</LoadingState>}
    {historyError && <ErrorState title="Không tải được lịch sử tra cứu" onRetry={loadHistory}>{historyError} Các câu trả lời đã có và bản nháp vẫn được giữ.</ErrorState>}
    <div className="chat-history" ref={historyRef} role="region" aria-label="Lịch sử tra cứu" tabIndex={0} onScroll={(event) => {
      nearBottom.current = event.currentTarget.scrollHeight - event.currentTarget.scrollTop - event.currentTarget.clientHeight <= 56
      if (nearBottom.current) setHasNewReply(false)
    }}>
      {!historyLoading && !historyError && messages.length === 0 && <EmptyState title="Chưa có câu hỏi">Hỏi bằng từ khóa cụ thể trong nội dung bài học để tìm đoạn liên quan.</EmptyState>}
      {messages.map((message, index) => <article className="chat-pair" key={message.id} data-message-id={message.id} aria-label={'Câu hỏi ' + (index + 1)}>
        <div className="question"><span className="lookup-message-label">Bạn hỏi</span><p>{message.question}</p></div>
        <div className="answer" ref={index === messages.length - 1 ? latestReplyRef : undefined} tabIndex={-1}><span className="lookup-message-label">Lumina · tra cứu cục bộ</span><p>{message.answer}</p></div>
      </article>)}
    </div>
    {hasNewReply && <Button className="new-reply-button" variant="secondary" onClick={jumpToLatest}>Có câu trả lời mới · Đến câu trả lời mới nhất</Button>}
    <div className="lookup-composer">
      <form onSubmit={sendQuestion} noValidate>
        <label htmlFor={id + '-question'}>Câu hỏi về bài học</label>
        <textarea ref={composerRef} id={id + '-question'} rows={2} value={question} onChange={(event) => { draftEdit.current += 1; setQuestion(event.target.value); setSendError(''); setNotice('') }} maxLength={1000} aria-describedby={id + '-help' + (sendError ? ' ' + id + '-error' : '')} aria-invalid={Boolean(sendError)} placeholder="Nhập từ khóa hoặc câu hỏi trong bài…" />
        <div className="lookup-composer-actions"><small id={id + '-help'}>3–1000 ký tự sau khi bỏ khoảng trắng · {question.length}/1000</small><Button type="submit" aria-label="Gửi câu hỏi" disabled={sending || !valid}>{sending ? 'Đang tra cứu…' : 'Gửi câu hỏi'}</Button></div>
      </form>
      {sending && <StatusMessage>Đang tra cứu câu hỏi đã gửi. Bạn có thể viết câu hỏi tiếp theo.</StatusMessage>}
      {sendError && <div id={id + '-error'}><StatusMessage type="error">{sendError}</StatusMessage><Button variant="secondary" onClick={loadHistory} disabled={historyLoading}>Kiểm tra lịch sử trước khi gửi lại</Button></div>}
      <StatusMessage type="success">{notice}</StatusMessage>
    </div>
  </section>
}

export default function DocumentAssistantPanel({ lesson, ...props }) {
  return <LookupWorkspace key={lesson.id + ':' + lesson.sourceRevision} lesson={lesson} {...props} />
}
