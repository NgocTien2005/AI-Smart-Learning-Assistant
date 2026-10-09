import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../services/api.js'
import ConfirmDialog from './ui/ConfirmDialog.jsx'
import { EmptyState, ErrorState, LoadingState, StatusMessage } from './ui/Feedback.jsx'

const lessonQuizPath = (lessonId) => `/api/courses/lessons/${lessonId}/quizzes`
const attemptPath = (attemptId) => `/api/courses/quiz-attempts/${attemptId}`
const copyAnswers = (answers) => answers?.map((answer) => answer ?? null) || []

function PracticeQuizPanel({ lesson, onClose, onRegisterBeforeLeave }) {
  const [attempts, setAttempts] = useState([])
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [count, setCount] = useState(5)
  const [message, setMessage] = useState('')
  const [saveState, setSaveState] = useState('saved')
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [attemptLoading, setAttemptLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const timerRef = useRef(null)
  const mountedRef = useRef(false)
  const epochRef = useRef(0)
  const revisionRef = useRef(0)
  const currentAttemptRef = useRef(null)
  const answersRef = useRef([])
  const savedAnswersRef = useRef([])
  const versionsRef = useRef(new Map())
  const savingPromiseRef = useRef(Promise.resolve())
  const stateRef = useRef({ quiz: null, result: null, saveState: 'saved' })

  useEffect(() => { stateRef.current = { quiz, result, saveState } }, [quiz, result, saveState])

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const data = await apiRequest(lessonQuizPath(lesson.id))
      if (mountedRef.current) setAttempts(data.attempts)
    } catch (error) {
      if (mountedRef.current) setHistoryError(error.message)
    } finally { if (mountedRef.current) setHistoryLoading(false) }
  }, [lesson.id])

  useEffect(() => {
    mountedRef.current = true
    queueMicrotask(refreshHistory)
    return () => {
      mountedRef.current = false
      clearTimeout(timerRef.current)
      epochRef.current += 1
    }
  }, [refreshHistory])

  const saveDraft = useCallback((attemptId, draft, revision, epoch) => {
    if (JSON.stringify(draft) === JSON.stringify(savedAnswersRef.current)) {
      setSaveState('saved')
      return Promise.resolve(true)
    }
    clearTimeout(timerRef.current)
    setSaving(true)
    setSaveState('saving')
    const operation = savingPromiseRef.current.catch(() => {}).then(async () => {
      if (epoch !== epochRef.current || attemptId !== currentAttemptRef.current) return false
      const data = await apiRequest(`${attemptPath(attemptId)}/draft`, {
        method: 'PUT',
        body: JSON.stringify({ answers: draft, version: versionsRef.current.get(attemptId) }),
      })
      versionsRef.current.set(attemptId, data.version)
      savedAnswersRef.current = copyAnswers(draft)
      if (mountedRef.current && epoch === epochRef.current && attemptId === currentAttemptRef.current && revision === revisionRef.current) setSaveState('saved')
      return true
    })
    savingPromiseRef.current = operation
    operation.catch((error) => {
      if (!mountedRef.current || epoch !== epochRef.current || attemptId !== currentAttemptRef.current) return
      setSaveState(error.status === 409 ? 'conflicted' : 'failed')
      setMessage(error.status === 409 ? 'Bản nháp đã thay đổi ở một thẻ khác. Câu trả lời trên màn hình vẫn được giữ; hãy chọn cách khôi phục.' : error.message)
    }).finally(() => {
      if (mountedRef.current && epoch === epochRef.current && attemptId === currentAttemptRef.current && revision === revisionRef.current) setSaving(false)
    })
    return operation
  }, [])

  const flushBeforeLeave = useCallback(async () => {
    const current = stateRef.current
    if (!current.quiz || JSON.stringify(answersRef.current) === JSON.stringify(savedAnswersRef.current)) return true
    clearTimeout(timerRef.current)
    const attemptId = current.quiz.attemptId
    const epoch = epochRef.current
    try {
      const saved = await saveDraft(attemptId, copyAnswers(answersRef.current), revisionRef.current, epoch)
      if (saved && epoch === epochRef.current && attemptId === currentAttemptRef.current) return true
    } catch { /* Preserve edits and offer an explicit recovery choice. */ }
    return false
  }, [saveDraft])

  useEffect(() => {
    onRegisterBeforeLeave?.(flushBeforeLeave)
    return () => onRegisterBeforeLeave?.(null)
  }, [flushBeforeLeave, onRegisterBeforeLeave])

  useEffect(() => {
    const dirty = quiz && JSON.stringify(answers) !== JSON.stringify(savedAnswersRef.current)
    if (!dirty) return undefined
    const handleBeforeUnload = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [answers, quiz])

  useEffect(() => {
    if (!quiz || result || saveState === 'conflicted') return undefined
    if (JSON.stringify(answers) === JSON.stringify(savedAnswersRef.current)) return undefined
    clearTimeout(timerRef.current)
    const attemptId = quiz.attemptId
    const epoch = epochRef.current
    const revision = revisionRef.current
    timerRef.current = setTimeout(() => { void saveDraft(attemptId, copyAnswers(answers), revision, epoch) }, 550)
    return () => clearTimeout(timerRef.current)
  }, [answers, quiz, result, saveState, saveDraft])

  const prepareAttempt = (attemptId, nextAnswers, version) => {
    currentAttemptRef.current = attemptId
    answersRef.current = copyAnswers(nextAnswers)
    savedAnswersRef.current = copyAnswers(nextAnswers)
    versionsRef.current.set(attemptId, version)
    revisionRef.current += 1
    setAnswers(copyAnswers(nextAnswers))
    setSaveState('saved')
    setMessage('')
  }

  const createQuiz = async (event) => {
    event.preventDefault()
    const epoch = ++epochRef.current
    setCreating(true)
    setMessage('')
    try {
      const data = await apiRequest(lessonQuizPath(lesson.id), { method: 'POST', body: JSON.stringify({ count: Number(count) }) })
      if (!mountedRef.current || epoch !== epochRef.current) return
      prepareAttempt(data.attemptId, data.questions.map(() => null), data.version)
      setQuiz(data)
      setResult(null)
      if (data.message) setMessage(data.message)
      void refreshHistory()
    } catch (error) { if (epoch === epochRef.current) setMessage(error.message) }
    finally { if (epoch === epochRef.current) setCreating(false) }
  }

  const startOpenAttempt = async (attemptId) => {
    clearTimeout(timerRef.current)
    const epoch = ++epochRef.current
    currentAttemptRef.current = attemptId
    setAttemptLoading(true)
    setMessage('')
    setQuiz(null)
    setResult(null)
    try {
      const data = await apiRequest(attemptPath(attemptId))
      if (!mountedRef.current || epoch !== epochRef.current) return
      if (data.submittedAt) { currentAttemptRef.current = null; setResult(data); setSaveState('saved') }
      else {
        prepareAttempt(attemptId, data.answers, data.version)
        setQuiz({ attemptId, questions: data.questions })
      }
    } catch (error) { if (epoch === epochRef.current) setMessage(error.message) }
    finally { if (epoch === epochRef.current) setAttemptLoading(false) }
  }

  const openAttempt = async (attemptId) => {
    if (currentAttemptRef.current && currentAttemptRef.current !== attemptId && await flushBeforeLeave() === false) {
      setConfirmation({ title: 'B?n nh?p ch?a l?u', message: 'Kh?ng l?u ???c c?c c?u tr? l?i m?i nh?t. B?n c? th? ? l?i ho?c m? b?i kh?c v? b? thay ??i ch?a l?u.', confirmLabel: 'M? b?i kh?c v? b? thay ??i', onConfirm: () => { currentAttemptRef.current = null; startOpenAttempt(attemptId) } })
      return
    }
    await startOpenAttempt(attemptId)
  }

  const chooseAnswer = (questionIndex, optionIndex) => {
    const next = answersRef.current.map((answer, index) => index === questionIndex ? optionIndex : answer)
    answersRef.current = next
    revisionRef.current += 1
    setAnswers(next)
    setSaveState('unsaved')
    setMessage('')
  }

  const retrySave = async () => {
    if (!quiz) return
    const attemptId = quiz.attemptId
    const epoch = epochRef.current
    const revision = revisionRef.current
    try {
      if (saveState === 'conflicted') {
        const current = await apiRequest(attemptPath(attemptId))
        if (epoch !== epochRef.current || attemptId !== currentAttemptRef.current) return
        if (current.submittedAt) { setMessage('Bài ôn tập đã được nộp trong một thẻ khác.'); setSaveState('conflicted'); return }
        versionsRef.current.set(attemptId, current.version)
      }
      await saveDraft(attemptId, copyAnswers(answersRef.current), revision, epoch)
      setMessage('')
    } catch { /* saveDraft publishes the recoverable error state. */ }
  }

  const submitQuiz = async (event) => {
    event.preventDefault()
    if (!quiz || answersRef.current.some((answer) => answer === null)) return
    clearTimeout(timerRef.current)
    const attemptId = quiz.attemptId
    const epoch = epochRef.current
    const finalAnswers = copyAnswers(answersRef.current)
    setAttemptLoading(true)
    setMessage('')
    try {
      const flushed = await saveDraft(attemptId, finalAnswers, revisionRef.current, epoch)
      if (!flushed || epoch !== epochRef.current || attemptId !== currentAttemptRef.current) throw new Error('Không thể xác nhận bản nháp mới nhất. Hãy thử lưu lại trước khi nộp.')
      const data = await apiRequest(`${attemptPath(attemptId)}/submit`, { method: 'POST', body: JSON.stringify({ answers: finalAnswers, version: versionsRef.current.get(attemptId) }) })
      if (!mountedRef.current || epoch !== epochRef.current || attemptId !== currentAttemptRef.current) return
      currentAttemptRef.current = null
      setQuiz(null)
      setResult(data)
      setSaveState('saved')
      void refreshHistory()
    } catch (error) {
      if (epoch === epochRef.current && attemptId === currentAttemptRef.current) {
        setMessage(error.status === 409 ? 'Có xung đột phiên bản hoặc bài đã được nộp. Câu trả lời hiện tại vẫn được giữ.' : error.message)
        if (error.status === 409) setSaveState('conflicted')
      }
    } finally { if (epoch === epochRef.current) setAttemptLoading(false) }
  }

  const closePanel = async () => {
    if (await flushBeforeLeave()) { onClose(); return }
    setConfirmation({ title: 'Bản nháp chưa lưu', message: 'Lưu bản nháp không thành công. Bạn có thể ở lại để thử lại hoặc đóng và bỏ các thay đổi chưa được lưu.', confirmLabel: 'Đóng và bỏ thay đổi', onConfirm: onClose })
  }

  const unfinished = attempts.filter((attempt) => !attempt.submittedAt)
  const submitted = attempts.filter((attempt) => attempt.submittedAt)
  const saveLabel = { unsaved: 'Chưa lưu thay đổi', saving: 'Đang lưu…', saved: 'Đã lưu trên máy chủ', failed: 'Lưu thất bại', conflicted: 'Xung đột phiên bản' }[saveState]
  return <section className="practice-panel" aria-labelledby="practice-title">
    <header><div><span aria-hidden="true">✦</span><div><small>ÔN TẬP CỤC BỘ</small><h3 id="practice-title">{lesson.title}</h3></div></div><button type="button" aria-label="Đóng bài ôn tập" onClick={closePanel}>×</button></header>
    <p className="practice-note">Tạo câu hỏi luyện tập cục bộ từ các mẫu câu được hỗ trợ trong nội dung bài học. Không sử dụng dịch vụ AI bên ngoài.</p>
    {message && <StatusMessage type={saveState === 'failed' || saveState === 'conflicted' ? 'error' : 'info'}>{message}</StatusMessage>}
    {historyError && <ErrorState title="Không tải được lịch sử ôn tập" onRetry={refreshHistory}>{historyError}</ErrorState>}
    {historyLoading && attempts.length === 0 && <LoadingState>Đang tải lịch sử ôn tập…</LoadingState>}
    {attemptLoading && <LoadingState>Đang mở hoặc nộp bài ôn tập…</LoadingState>}
    {!quiz && !result && !attemptLoading && <form className="practice-create" onSubmit={createQuiz}><label htmlFor="practice-count">Số câu hỏi<select id="practice-count" value={count} onChange={(event) => setCount(event.target.value)}>{Array.from({ length: 8 }, (_, index) => index + 3).map((value) => <option key={value} value={value}>{value} câu</option>)}</select></label><button className="primary-button" disabled={creating}>{creating ? 'Đang tạo…' : 'Tạo bài ôn nhanh'}</button></form>}
    {quiz && <><div className={`practice-save-status is-${saveState}`} role="status">{saveLabel} · Đã trả lời {answers.filter((answer) => answer !== null).length}/{quiz.questions.length}{(saveState === 'failed' || saveState === 'conflicted') && <button type="button" onClick={retrySave}>Thử lưu lại</button>}</div>
      {quiz.actualCount && quiz.actualCount < quiz.requestedCount && <p className="practice-note">Chỉ tạo được {quiz.actualCount} câu phù hợp từ nội dung hiện có.</p>}
      <form className="practice-questions" onSubmit={submitQuiz}>{quiz.questions.map((question, questionIndex) => <fieldset key={question.id}><legend>{questionIndex + 1}. {question.prompt}</legend>{question.options.map((option, optionIndex) => <label key={`${question.id}-${optionIndex}`}><input type="radio" name={`question-${question.id}`} checked={answers[questionIndex] === optionIndex} onChange={() => chooseAnswer(questionIndex, optionIndex)} disabled={attemptLoading} />{option}</label>)}</fieldset>)}<button className="primary-button" type="submit" disabled={attemptLoading || saving || answers.some((answer) => answer === null)}>{attemptLoading ? 'Đang nộp…' : `Nộp bài (${answers.filter((answer) => answer !== null).length}/${quiz.questions.length})`}</button></form>
    </>}
    {result && <section className="practice-result" aria-labelledby="quiz-result-title"><h4 id="quiz-result-title">Kết quả: {result.score}/{result.total}</h4>{result.legacyAnswersUnavailable && <StatusMessage type="warning">Đáp án đã chọn không được lưu ở phiên bản trước</StatusMessage>}<nav aria-label="Điều hướng câu hỏi">{result.questions.map((question, index) => <a key={index} href={`#result-question-${index + 1}`}>Câu {index + 1}</a>)}</nav>{result.questions.map((question, index) => <article id={`result-question-${index + 1}`} className={question.isCorrect ? 'practice-correct' : 'practice-incorrect'} key={`${result.attemptId}-${index}`}><b>{index + 1}. {question.isCorrect === null ? 'Kết quả cũ' : question.isCorrect ? 'Đúng' : 'Chưa đúng'}</b><p>{question.prompt}</p><p>Đáp án đã chọn: {question.selectedIndex === null ? 'Đáp án đã chọn không được lưu ở phiên bản trước' : question.options[question.selectedIndex]}</p><p>Đáp án đúng: {question.options[question.correctIndex]}</p>{question.explanation && <p>Giải thích: {question.explanation}</p>}{question.sourcePassage && <blockquote>Nội dung nguồn: “{question.sourcePassage}”</blockquote>}</article>)}<button type="button" onClick={() => setResult(null)}>Quay lại lịch sử</button></section>}
    <div className="practice-history"><h4>Lịch sử ôn tập</h4>{historyLoading ? <LoadingState>Đang tải lịch sử…</LoadingState> : attempts.length === 0 ? <EmptyState title="Chưa có bài ôn tập">Tạo bài đầu tiên từ nội dung phía trên.</EmptyState> : <>
      {unfinished.length > 0 && <ul aria-label="Bài ôn tập chưa nộp">{unfinished.map((attempt) => <li key={attempt.id}><span>{new Date(attempt.createdAt).toLocaleString('vi-VN')} · {attempt.questionCount} câu</span><button type="button" onClick={() => openAttempt(attempt.id)} disabled={attemptLoading}>Tiếp tục</button></li>)}</ul>}
      {submitted.length > 0 && <ul aria-label="Bài ôn tập đã nộp">{submitted.map((attempt) => <li key={attempt.id}><span>{new Date(attempt.createdAt).toLocaleString('vi-VN')} · {attempt.score ?? '—'}/{attempt.questionCount}</span><button type="button" onClick={() => openAttempt(attempt.id)} disabled={attemptLoading}>Xem kết quả</button></li>)}</ul>}
    </>}</div>
    {confirmation && <ConfirmDialog {...confirmation} onCancel={() => setConfirmation(null)} onConfirm={async () => { const action = confirmation.onConfirm; setConfirmation(null); await action() }} />}
  </section>
}

export default PracticeQuizPanel
