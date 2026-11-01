import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../services/api.js'
import ConfirmDialog from './ui/ConfirmDialog.jsx'
import Button from './ui/Button.jsx'
import { EmptyState, ErrorState, LoadingState, StatusMessage } from './ui/Feedback.jsx'
import QuizHistory from './QuizHistory.jsx'
import QuizCreateDisclosure from './QuizCreateDisclosure.jsx'
import './PracticeQuizPanel.css'

const lessonQuizPath = (id) => '/api/courses/lessons/' + id + '/quizzes'
const attemptPath = (id) => '/api/courses/quiz-attempts/' + id
const copy = (answers) => answers.map((answer) => answer ?? null)
const same = (a, b) => a.length === b.length && a.every((answer, index) => answer === b[index])
const labels = { unsaved: 'Chưa lưu thay đổi', saving: 'Đang lưu…', saved: 'Đã lưu trên máy chủ', failed: 'Lưu thất bại', conflicted: 'Xung đột phiên bản' }

function QuizWorkspace({ lesson, onClose, onRegisterBeforeLeave }) {
  const [attempts, setAttempts] = useState(null)
  const [filter, setFilter] = useState('all')
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [saveState, setSaveState] = useState('saved')
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState('')
  const [opening, setOpening] = useState(null)
  const [openError, setOpenError] = useState(null)
  const [message, setMessage] = useState('')
  const [createError, setCreateError] = useState('')
  const [createdVersion, setCreatedVersion] = useState(0)
  const [confirmation, setConfirmation] = useState(null)
  const mounted = useRef(false)
  const lifecycle = useRef(0)
  const sessionRef = useRef(null)
  const actionLock = useRef('')
  const timer = useRef(null)
  const historySequence = useRef(0)
  const mutationGeneration = useRef(0)
  const historyController = useRef(null)
  const detailSequence = useRef(0)
  const detailController = useRef(null)
  const detailBusy = useRef(false)
  const historyHeading = useRef(null)
  const detailHeading = useRef(null)
  const activeId = quiz?.attemptId ?? result?.attemptId ?? null
  const activeIdRef = useRef(null)

  const isCurrent = useCallback((session) => mounted.current && sessionRef.current === session && lifecycle.current === session.generation, [])
  const refreshHistory = useCallback(async () => {
    historyController.current?.abort()
    const controller = new AbortController()
    historyController.current = controller
    const sequence = ++historySequence.current
    const generation = mutationGeneration.current
    const epoch = lifecycle.current
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const data = await apiRequest(lessonQuizPath(lesson.id), { signal: controller.signal })
      if (!mounted.current || lifecycle.current !== epoch || sequence !== historySequence.current || generation !== mutationGeneration.current) return
      if (!Array.isArray(data.attempts)) throw new Error('Máy chủ chưa trả lịch sử ôn tập.')
      setAttempts(data.attempts)
    } catch (error) {
      if (mounted.current && lifecycle.current === epoch && sequence === historySequence.current && error.name !== 'AbortError') setHistoryError(error.message)
    } finally {
      if (mounted.current && lifecycle.current === epoch && sequence === historySequence.current) setHistoryLoading(false)
    }
  }, [lesson.id])

  useEffect(() => {
    mounted.current = true
    lifecycle.current += 1
    let active = true
    queueMicrotask(() => { if (active) void refreshHistory() })
    return () => {
      active = false
      mounted.current = false
      lifecycle.current += 1
      historySequence.current += 1
      detailSequence.current += 1
      historyController.current?.abort()
      detailController.current?.abort()
      clearTimeout(timer.current)
    }
  }, [refreshHistory])

  // Compare inside the queue: a pending older write may change the server baseline.
  const saveDraft = useCallback((session, snapshot) => {
    if (!isCurrent(session) || session.blocked) return Promise.resolve(false)
    session.pending += 1
    setSaving(true)
    setSaveState('saving')
    const operation = session.tail.then(async () => {
      if (!isCurrent(session) || session.blocked) return false
      if (!session.uncertain && same(snapshot, session.saved)) return true
      try {
        const data = await apiRequest(attemptPath(session.id) + '/draft', {
          method: 'PUT', body: JSON.stringify({ answers: snapshot, version: session.version }),
        })
        if (!isCurrent(session)) return false
        if (!Number.isInteger(data.version)) throw new Error('Máy chủ chưa xác nhận phiên bản bản nháp.')
        session.version = data.version
        session.saved = copy(snapshot)
        session.uncertain = false
        return true
      } catch (error) {
        if (isCurrent(session)) {
          session.uncertain = true
          session.blocked = error.status === 409 ? 'conflicted' : 'failed'
          setSaveState(session.blocked)
          setMessage(error.status === 409 ? 'Bản nháp đã thay đổi hoặc được nộp ở thẻ khác. Câu trả lời hiện tại vẫn được giữ; hãy chọn cách khôi phục.' : error.message)
        }
        return false
      }
    }).finally(() => {
      session.pending -= 1
      if (!isCurrent(session)) return
      setSaving(session.pending > 0)
      setSaveState(session.blocked || (session.pending ? 'saving' : same(session.answers, session.saved) ? 'saved' : 'unsaved'))
    })
    session.tail = operation
    return operation
  }, [isCurrent])

  const flushBeforeLeave = useCallback(async () => {
    clearTimeout(timer.current)
    const session = sessionRef.current
    if (!session) return true
    await session.tail
    while (isCurrent(session)) {
      if (session.blocked) return false
      if (!session.pending && !session.uncertain && same(session.answers, session.saved)) return true
      if (!await saveDraft(session, copy(session.answers))) return false
    }
    return false
  }, [isCurrent, saveDraft])

  useEffect(() => {
    onRegisterBeforeLeave?.(flushBeforeLeave)
    return () => onRegisterBeforeLeave?.(null)
  }, [onRegisterBeforeLeave, flushBeforeLeave])

  useEffect(() => {
    const session = sessionRef.current
    if (!quiz || !session || saveState !== 'unsaved' || session.blocked) return undefined
    timer.current = setTimeout(() => { void saveDraft(session, copy(session.answers)) }, 550)
    return () => clearTimeout(timer.current)
  }, [answers, quiz, saveState, saveDraft])

  useEffect(() => {
    const session = sessionRef.current
    if (!quiz || !session || (!saving && !session.blocked && !session.uncertain && same(answers, session.saved))) return undefined
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [answers, quiz, saving, saveState])

  useEffect(() => { if (activeId !== null) detailHeading.current?.focus() }, [activeId])

  const invalidateDetails = () => {
    detailSequence.current += 1
    detailController.current?.abort()
    detailBusy.current = false
    setOpening(null)
  }
  const invalidateHistory = () => {
    mutationGeneration.current += 1
    historySequence.current += 1
    historyController.current?.abort()
    setHistoryLoading(false)
  }
  const activate = (data, id) => {
    clearTimeout(timer.current)
    activeIdRef.current = id
    setMessage('')
    setOpenError(null)
    setSaving(false)
    setSaveState('saved')
    if (data.submittedAt) {
      sessionRef.current = null
      setQuiz(null)
      setResult({ ...data, attemptId: id })
    } else {
      const saved = data.questions.map((_, index) => data.answers?.[index] ?? null)
      sessionRef.current = { id, generation: lifecycle.current, version: data.version, answers: copy(saved), saved: copy(saved), pending: 0, tail: Promise.resolve(true), blocked: null, uncertain: false }
      setAnswers(copy(saved))
      setResult(null)
      setQuiz({ ...data, attemptId: id })
    }
  }
  const discardSession = () => {
    clearTimeout(timer.current)
    sessionRef.current = null
    activeIdRef.current = null
    setQuiz(null)
    setResult(null)
    setSaving(false)
    setMessage('')
  }
  const beginAction = (name) => {
    if (actionLock.current) return false
    actionLock.current = name
    setBusy(name)
    invalidateDetails()
    return true
  }
  const finishAction = (name, epoch) => {
    if (mounted.current && lifecycle.current === epoch && actionLock.current === name) {
      actionLock.current = ''
      setBusy('')
    }
  }
  const askDiscard = (onConfirm, confirmLabel) => setConfirmation({
    title: 'Bản nháp chưa lưu',
    message: 'Câu trả lời hiện tại chưa được xác nhận trên máy chủ. Bạn có thể ở lại để thử lại hoặc tiếp tục và bỏ thay đổi chưa lưu.',
    confirmLabel,
    onConfirm,
  })

  const performOpen = async (id, sequence) => {
    const epoch = lifecycle.current
    const controller = new AbortController()
    detailController.current?.abort()
    detailController.current = controller
    detailBusy.current = true
    setOpening(id)
    setOpenError(null)
    try {
      const data = await apiRequest(attemptPath(id), { signal: controller.signal })
      if (!mounted.current || lifecycle.current !== epoch || sequence !== detailSequence.current) return
      if (!Array.isArray(data.questions)) throw new Error('Máy chủ chưa trả nội dung bài ôn.')
      activate(data, id)
    } catch (error) {
      if (mounted.current && lifecycle.current === epoch && sequence === detailSequence.current && error.name !== 'AbortError') setOpenError({ id, message: error.message })
    } finally {
      if (mounted.current && lifecycle.current === epoch && sequence === detailSequence.current) {
        detailBusy.current = false
        setOpening(null)
      }
    }
  }
  const openAttempt = async (id) => {
    if (actionLock.current) return
    if (activeIdRef.current === id) { invalidateDetails(); return }
    const sequence = ++detailSequence.current
    const epoch = lifecycle.current
    detailBusy.current = true
    setOpening(id)
    const flushed = await flushBeforeLeave()
    if (!mounted.current || lifecycle.current !== epoch || sequence !== detailSequence.current) return
    if (!flushed) {
      detailBusy.current = false
      setOpening(null)
      askDiscard(() => { discardSession(); void performOpen(id, ++detailSequence.current) }, 'Mở bài khác và bỏ thay đổi')
      return
    }
    await performOpen(id, sequence)
  }
  const chooseAnswer = (index, option) => {
    const session = sessionRef.current
    if (!session || actionLock.current || detailBusy.current) return
    session.answers = session.answers.map((answer, i) => i === index ? option : answer)
    setAnswers(copy(session.answers))
    setSaveState(session.blocked || 'unsaved')
    if (!session.blocked) setMessage('')
  }

  const createQuiz = async (count) => {
    if (!Number.isInteger(count) || count < 3 || count > 10) { setCreateError('Số câu hỏi phải từ 3 đến 10.'); return }
    if (!beginAction('create')) return
    const epoch = lifecycle.current
    setCreateError('')
    try {
      if (!await flushBeforeLeave()) {
        if (mounted.current && lifecycle.current === epoch) askDiscard(() => { discardSession(); void createQuiz(count) }, 'Tạo bài mới và bỏ thay đổi')
        return
      }
      if (!mounted.current || lifecycle.current !== epoch) return
      invalidateHistory()
      const data = await apiRequest(lessonQuizPath(lesson.id), { method: 'POST', body: JSON.stringify({ count }) })
      if (!mounted.current || lifecycle.current !== epoch) return
      activate(data, data.attemptId)
      setCreatedVersion((value) => value + 1)
      invalidateHistory()
      void refreshHistory()
    } catch (error) {
      if (mounted.current && lifecycle.current === epoch) setCreateError(error.message)
    } finally { finishAction('create', epoch) }
  }

  const retrySave = async () => {
    const session = sessionRef.current
    if (!session || !beginAction('recovery')) return
    const epoch = lifecycle.current
    setMessage('')
    try {
      await session.tail
      if (!isCurrent(session)) return
      if (session.blocked === 'conflicted') {
        const current = await apiRequest(attemptPath(session.id))
        if (!isCurrent(session)) return
        if (current.submittedAt) { setMessage('Bài ôn tập đã được nộp trong một thẻ khác. Chọn Tải bản đã lưu để xem kết quả.'); return }
        if (!Number.isInteger(current.version) || !Array.isArray(current.answers)) throw new Error('Máy chủ chưa trả trạng thái bản nháp hợp lệ.')
        session.version = current.version
        session.saved = copy(current.answers)
        session.uncertain = false
      }
      session.blocked = null
      if (await saveDraft(session, copy(session.answers)) && isCurrent(session)) setMessage('')
    } catch (error) {
      if (isCurrent(session)) setMessage('Không tải được trạng thái mới: ' + error.message + ' Câu trả lời hiện tại vẫn được giữ.')
    } finally { finishAction('recovery', epoch) }
  }

  const loadSaved = async () => {
    const session = sessionRef.current
    if (!session || !beginAction('recovery')) return
    const epoch = lifecycle.current
    try {
      await session.tail
      const data = await apiRequest(attemptPath(session.id))
      if (isCurrent(session)) activate(data, session.id)
    } catch (error) {
      if (isCurrent(session)) setMessage('Không tải được bản đã lưu: ' + error.message)
    } finally { finishAction('recovery', epoch) }
  }
  const requestLoadSaved = () => {
    const session = sessionRef.current
    if (!session || actionLock.current) return
    if (session.blocked || session.pending || !same(session.answers, session.saved)) askDiscard(loadSaved, 'Tải bản đã lưu và bỏ thay đổi')
    else void loadSaved()
  }

  const submitQuiz = async (event) => {
    event.preventDefault()
    const session = sessionRef.current
    if (!session || !session.answers.length || session.answers.some((answer) => answer === null) || !beginAction('submit')) return
    const epoch = lifecycle.current
    setMessage('')
    try {
      if (!await flushBeforeLeave()) return
      if (!isCurrent(session)) return
      const latestAnswers = copy(session.answers)
      invalidateHistory()
      const data = await apiRequest(attemptPath(session.id) + '/submit', { method: 'POST', body: JSON.stringify({ answers: latestAnswers, version: session.version }) })
      if (!isCurrent(session)) return
      activate(data, session.id)
      invalidateHistory()
      void refreshHistory()
    } catch (error) {
      if (isCurrent(session)) {
        if (error.status === 409) { session.blocked = 'conflicted'; setSaveState('conflicted') }
        setMessage(error.status === 409 ? 'Có xung đột phiên bản hoặc bài đã được nộp. Câu trả lời hiện tại vẫn được giữ.' : error.message)
      }
    } finally { finishAction('submit', epoch) }
  }

  const closePanel = async () => {
    if (!beginAction('close')) return
    const epoch = lifecycle.current
    try {
      if (await flushBeforeLeave()) {
        if (mounted.current && lifecycle.current === epoch) onClose()
      } else if (mounted.current && lifecycle.current === epoch) askDiscard(onClose, 'Đóng và bỏ thay đổi')
    } finally { finishAction('close', epoch) }
  }

  return <section className="practice-panel quiz-workspace" aria-labelledby="practice-title">
    <header><div className="qw-heading-text"><span aria-hidden="true">✦</span><div><small>ÔN TẬP CỤC BỘ</small><h3 id="practice-title">{lesson.title}</h3></div></div><Button variant="secondary" aria-label="Đóng bài ôn tập" disabled={Boolean(busy)} onClick={closePanel}>×</Button></header>
    <p className="practice-note">Luyện tập từ mẫu câu định nghĩa giới hạn trong bài học. Lịch sử và bản nháp thuộc tài khoản của bạn.</p>
    <div className="qw-layout">
      <QuizHistory attempts={attempts} loading={historyLoading} error={historyError} filter={filter} onFilter={setFilter} selectedId={activeId} onSelect={openAttempt} onRetry={refreshHistory} disabled={Boolean(busy)} headingRef={historyHeading} />
      <div className="qw-detail">
        <QuizCreateDisclosure pending={busy === 'create'} disabled={Boolean(busy) || opening !== null} error={createError} successVersion={createdVersion} onCreate={createQuiz} />
        {openError && <ErrorState title={'Không mở được bài ôn #' + openError.id}>{openError.message}<Button variant="secondary" onClick={() => openAttempt(openError.id)}>Thử mở lại bài #{openError.id}</Button></ErrorState>}
        {opening !== null && <LoadingState>Đang mở bài ôn #{opening}… Nội dung hiện tại vẫn được giữ.</LoadingState>}
        {message && <StatusMessage type={saveState === 'conflicted' || saveState === 'failed' ? 'error' : 'info'}>{message}</StatusMessage>}
        {!quiz && !result && <EmptyState title="Chọn bài ôn tập">Chọn Tiếp tục hoặc Xem kết quả từ lịch sử; mở Tạo bài ôn mới khi cần.</EmptyState>}
        {quiz && <section aria-label={'Bài đang làm #' + quiz.attemptId}>
          <h4 tabIndex="-1" ref={detailHeading}>Bài đang làm #{quiz.attemptId}</h4>
          <div className={'practice-save-status is-' + saveState} role="status">{labels[saveState]} · Đã trả lời {answers.filter((answer) => answer !== null).length}/{quiz.questions.length}
            {(saveState === 'failed' || saveState === 'conflicted') && <><Button variant="secondary" disabled={Boolean(busy)} onClick={retrySave}>{saveState === 'conflicted' ? 'Lưu câu trả lời hiện tại' : 'Thử lưu lại'}</Button><Button variant="secondary" disabled={Boolean(busy)} onClick={requestLoadSaved}>Tải bản đã lưu</Button></>}
          </div>
          {Number.isInteger(quiz.actualCount) && Number.isInteger(quiz.requestedCount) && quiz.actualCount < quiz.requestedCount && <p className="qw-muted">Chỉ tạo được {quiz.actualCount} câu phù hợp từ nội dung hiện có (yêu cầu {quiz.requestedCount}).</p>}
          <form className="practice-questions" onSubmit={submitQuiz} aria-label="Câu hỏi ôn tập" aria-busy={busy === 'submit'}>{quiz.questions.map((question, index) => <fieldset key={question.id}><legend>{index + 1}. {question.prompt}</legend>{question.options.map((option, optionIndex) => <label key={optionIndex}><input type="radio" name={'quiz-' + quiz.attemptId + '-question-' + question.id} checked={answers[index] === optionIndex} onChange={() => chooseAnswer(index, optionIndex)} disabled={Boolean(busy) || opening !== null} />{option}</label>)}</fieldset>)}
            <Button type="submit" disabled={Boolean(busy) || opening !== null || saving || saveState === 'conflicted' || saveState === 'failed' || answers.some((answer) => answer === null)}>{busy === 'submit' ? 'Đang nộp…' : 'Nộp bài (' + answers.filter((answer) => answer !== null).length + '/' + quiz.questions.length + ')'}</Button>
          </form>
        </section>}
        {result && <section className="practice-result" aria-labelledby="quiz-result-title">
          <h4 id="quiz-result-title" tabIndex="-1" ref={detailHeading}>Kết quả: {result.score ?? '—'}/{result.total ?? '—'}</h4>
          {result.legacyAnswersUnavailable && <StatusMessage type="warning">Đáp án đã chọn không được lưu ở phiên bản trước</StatusMessage>}
          <nav aria-label="Điều hướng câu hỏi">{result.questions.map((_, index) => <a key={index} href={'#quiz-' + result.attemptId + '-result-' + index}>Câu {index + 1}</a>)}</nav>
          {result.questions.map((question, index) => <article id={'quiz-' + result.attemptId + '-result-' + index} className={question.isCorrect === null ? '' : question.isCorrect ? 'practice-correct' : 'practice-incorrect'} key={index}>
            <b>{index + 1}. {question.isCorrect === null ? 'Kết quả cũ' : question.isCorrect ? 'Đúng' : 'Chưa đúng'}</b><p>{question.prompt}</p><p>Đáp án đã chọn: {question.selectedIndex === null ? 'Đáp án đã chọn không được lưu ở phiên bản trước' : question.options[question.selectedIndex]}</p><p>Đáp án đúng: {question.options[question.correctIndex]}</p>{question.explanation && <p>Giải thích: {question.explanation}</p>}{question.sourcePassage && <blockquote>Nội dung nguồn: “{question.sourcePassage}”</blockquote>}
          </article>)}
          <Button variant="secondary" onClick={() => { invalidateDetails(); activeIdRef.current = null; setResult(null); historyHeading.current?.focus() }}>Quay lại lịch sử</Button>
        </section>}
      </div>
    </div>
    {confirmation && <ConfirmDialog {...confirmation} onCancel={() => setConfirmation(null)} onConfirm={() => { const action = confirmation.onConfirm; setConfirmation(null); void action() }} />}
  </section>
}

export default function PracticeQuizPanel(props) {
  return <QuizWorkspace key={props.lesson.id} {...props} />
}
