import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../services/api.js'

const lessonQuizPath = (lessonId) => `/api/courses/lessons/${lessonId}/quizzes`
const attemptPath = (attemptId) => `/api/courses/quiz-attempts/${attemptId}`

function PracticeQuizPanel({ lesson, onClose }) {
  const [attempts, setAttempts] = useState([])
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [count, setCount] = useState(5)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const versionsRef = useRef(new Map())
  const sequenceRef = useRef(0)
  const currentAttemptRef = useRef(null)
  const answersRef = useRef([])
  const saveChainRef = useRef(Promise.resolve())
  const timerRef = useRef(null)
  const mountedRef = useRef(true)

  const refreshHistory = useCallback(async () => {
    setLoading(true)
    setMessage('')
    try {
      const data = await apiRequest(lessonQuizPath(lesson.id))
      if (mountedRef.current) setAttempts(data.attempts)
    } catch (error) {
      if (mountedRef.current) setMessage(error.message)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [lesson.id])

  useEffect(() => {
    mountedRef.current = true
    queueMicrotask(() => {
      if (mountedRef.current) refreshHistory()
    })
    return () => {
      mountedRef.current = false
      clearTimeout(timerRef.current)
      sequenceRef.current += 1
    }
  }, [refreshHistory])

  const createQuiz = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setResult(null)
    try {
      const data = await apiRequest(lessonQuizPath(lesson.id), {
        method: 'POST',
        body: JSON.stringify({ count: Number(count) }),
      })
      currentAttemptRef.current = data.attemptId
      versionsRef.current.set(data.attemptId, data.version)
      answersRef.current = data.questions.map(() => null)
      setQuiz(data)
      setAnswers(answersRef.current)
      setStatus('Đã lưu')
      if (data.message) setMessage(data.message)
      await refreshHistory()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const openAttempt = async (attemptId) => {
    clearTimeout(timerRef.current)
    setLoading(true)
    setMessage('')
    setStatus('')
    setSaving(false)
    setQuiz(null)
    setResult(null)
    currentAttemptRef.current = attemptId
    const requestSequence = ++sequenceRef.current
    try {
      const data = await apiRequest(attemptPath(attemptId))
      if (!mountedRef.current || requestSequence !== sequenceRef.current) return
      if (data.submittedAt) {
        setResult(data)
        currentAttemptRef.current = null
      } else {
        setQuiz({ attemptId, questions: data.questions })
        versionsRef.current.set(attemptId, data.version)
        answersRef.current = data.answers
        setAnswers(data.answers)
        setStatus('Đã khôi phục bản nháp')
      }
    } catch (error) {
      if (mountedRef.current && requestSequence === sequenceRef.current) setMessage(error.message)
    } finally {
      if (mountedRef.current && requestSequence === sequenceRef.current) setLoading(false)
    }
  }

  const persistAnswers = useCallback((attemptId, draft, revision) => {
    setSaving(true)
    setStatus('Đang lưu…')
    const operation = saveChainRef.current.catch(() => {}).then(async () => {
      const data = await apiRequest(`${attemptPath(attemptId)}/draft`, {
        method: 'PUT',
        body: JSON.stringify({ answers: draft, version: versionsRef.current.get(attemptId) }),
      })
      versionsRef.current.set(attemptId, data.version)
      return data
    })
    saveChainRef.current = operation
    operation.then(() => {
      if (!mountedRef.current || currentAttemptRef.current !== attemptId) return
      if (revision === sequenceRef.current) setStatus('Đã lưu')
    }).catch((error) => {
      if (mountedRef.current && currentAttemptRef.current === attemptId) {
        setStatus('Chưa lưu được')
        setMessage(error.message)
      }
    }).finally(() => {
      if (mountedRef.current && currentAttemptRef.current === attemptId && revision === sequenceRef.current) setSaving(false)
    })
    return operation
  }, [])

  useEffect(() => {
    if (!quiz || result) return undefined
    clearTimeout(timerRef.current)
    const attemptId = quiz.attemptId
    const revision = sequenceRef.current
    timerRef.current = setTimeout(() => persistAnswers(attemptId, answers, revision), 550)
    return () => clearTimeout(timerRef.current)
  }, [answers, quiz, result, persistAnswers])

  const chooseAnswer = (questionIndex, optionIndex) => {
    const next = answers.map((answer, index) => index === questionIndex ? optionIndex : answer)
    answersRef.current = next
    sequenceRef.current += 1
    setAnswers(next)
    setMessage('')
  }

  const submitQuiz = async (event) => {
    event.preventDefault()
    if (!quiz || answers.some((answer) => answer === null)) return
    clearTimeout(timerRef.current)
    setLoading(true)
    setMessage('')
    const submittedAttemptId = quiz.attemptId
    const finalAnswers = answersRef.current
    try {
      await saveChainRef.current.catch(() => {})
      const savedAnswers = answersRef.current
      if (savedAnswers.some((answer) => answer === null)) throw new Error('Hãy trả lời tất cả câu hỏi trước khi nộp.')
      const savedDraft = await apiRequest(`${attemptPath(submittedAttemptId)}/draft`, {
        method: 'PUT',
        body: JSON.stringify({ answers: savedAnswers, version: versionsRef.current.get(submittedAttemptId) }),
      })
      versionsRef.current.set(submittedAttemptId, savedDraft.version)
      const data = await apiRequest(`${attemptPath(submittedAttemptId)}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: finalAnswers, version: versionsRef.current.get(submittedAttemptId) }),
      })
      setResult(data)
      currentAttemptRef.current = null
      setQuiz(null)
      await refreshHistory()
    } catch (error) {
      setMessage(error.message)
      if (error.status === 409) await openAttempt(submittedAttemptId)
    } finally {
      setLoading(false)
    }
  }

  const unfinished = attempts.filter((attempt) => !attempt.submittedAt)
  const submitted = attempts.filter((attempt) => attempt.submittedAt)

  return (
    <section className="practice-panel" aria-labelledby="practice-title">
      <header><div><span aria-hidden="true">✦</span><div><small>ÔN TẬP CỤC BỘ</small><h3 id="practice-title">{lesson.title}</h3></div></div><button type="button" aria-label="Đóng bài ôn tập" onClick={onClose}>×</button></header>
      <p className="practice-note">Tạo câu hỏi luyện tập cục bộ từ các câu định nghĩa được hỗ trợ trong nội dung bài học. Không sử dụng dịch vụ AI bên ngoài.</p>
      {message && <p className="inline-message" role="status">{message}</p>}
      {message && !quiz && !result && <button type="button" onClick={refreshHistory} disabled={loading}>Thử tải lại lịch sử</button>}
      {loading && !quiz && !result && <p role="status">Đang tải bài ôn tập…</p>}
      {!loading && !quiz && !result && <form className="practice-create" onSubmit={createQuiz}>
        <label htmlFor="practice-count">Số câu hỏi
          <select id="practice-count" value={count} onChange={(event) => setCount(event.target.value)}>
            {Array.from({ length: 8 }, (_, index) => index + 3).map((value) => <option key={value} value={value}>{value} câu</option>)}
          </select>
        </label>
        <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Đang tạo…' : 'Tạo bài ôn nhanh'}</button>
      </form>}
      {quiz && <>
        <div className="practice-save-status" role="status">{status} · Đã trả lời {answers.filter((answer) => answer !== null).length}/{quiz.questions.length}</div>
        {quiz.actualCount && quiz.actualCount < quiz.requestedCount && <p className="practice-note">Chỉ tạo được {quiz.actualCount} câu phù hợp từ nội dung hiện có.</p>}
        <form className="practice-questions" onSubmit={submitQuiz}>
          {quiz.questions.map((question, questionIndex) => <fieldset key={question.id}>
            <legend>{questionIndex + 1}. {question.prompt}</legend>
            {question.options.map((option, optionIndex) => <label key={`${question.id}-${optionIndex}`}><input type="radio" name={`question-${question.id}`} checked={answers[questionIndex] === optionIndex} onChange={() => chooseAnswer(questionIndex, optionIndex)} disabled={loading} />{option}</label>)}
          </fieldset>)}
          <button className="primary-button" type="submit" disabled={loading || saving || answers.some((answer) => answer === null)}>{loading ? 'Đang nộp…' : `Nộp bài (${answers.filter((answer) => answer !== null).length}/${quiz.questions.length})`}</button>
        </form>
      </>}
      {result && <div className="practice-result"><strong>Kết quả: {result.score}/{result.total}</strong>
        {result.legacyAnswersUnavailable && <p role="status">Đáp án đã chọn không được lưu ở phiên bản trước</p>}
        <div>{result.questions.map((question, index) => <article className={question.isCorrect ? 'practice-correct' : 'practice-incorrect'} key={`${result.attemptId}-${index}`}>
          <b>{index + 1}. {question.isCorrect === null ? 'Kết quả cũ' : question.isCorrect ? 'Đúng' : 'Chưa đúng'}</b>
          <p>{question.prompt}</p>
          <p>Đáp án đã chọn: {question.selectedIndex === null ? 'Đáp án đã chọn không được lưu ở phiên bản trước' : question.options[question.selectedIndex]}</p>
          <p>Đáp án đúng: {question.options[question.correctIndex]}</p>
          {question.explanation && <p>Giải thích: {question.explanation}</p>}
          {question.sourcePassage && <blockquote>Nội dung nguồn: “{question.sourcePassage}”</blockquote>}
        </article>)}</div>
        <button type="button" onClick={() => setResult(null)}>Quay lại lịch sử</button>
      </div>}
      <div className="practice-history"><h4>Lịch sử ôn tập</h4>
        {loading && attempts.length === 0 ? <p>Đang tải lịch sử…</p> : attempts.length === 0 ? <p>Chưa có bài ôn tập. Tạo bài đầu tiên từ nội dung phía trên.</p> : <>
          {unfinished.length > 0 && <ul aria-label="Bài ôn tập chưa nộp">{unfinished.map((attempt) => <li key={attempt.id}><span>{new Date(attempt.createdAt).toLocaleString('vi-VN')} · {attempt.questionCount} câu</span><button type="button" onClick={() => openAttempt(attempt.id)} disabled={loading}>Tiếp tục</button></li>)}</ul>}
          {submitted.length > 0 && <ul aria-label="Bài ôn tập đã nộp">{submitted.map((attempt) => <li key={attempt.id}><span>{new Date(attempt.createdAt).toLocaleString('vi-VN')} · {attempt.score ?? '—'}/{attempt.questionCount}</span><button type="button" onClick={() => openAttempt(attempt.id)} disabled={loading}>Xem kết quả</button></li>)}</ul>}
        </>}
      </div>
    </section>
  )
}

export default PracticeQuizPanel
