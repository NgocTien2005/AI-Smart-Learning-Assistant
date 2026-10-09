import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api.js'

function PracticeQuizPanel({ lesson, onClose }) {
  const [attempts, setAttempts] = useState([])
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    apiRequest(`/api/courses/lessons/${lesson.id}/quizzes`)
      .then((data) => { if (active) setAttempts(data.attempts) })
      .catch((error) => { if (active) setMessage(error.message) })
    return () => { active = false }
  }, [lesson.id])

  const createQuiz = async () => {
    setLoading(true)
    setMessage('')
    setResult(null)
    try {
      const data = await apiRequest(`/api/courses/lessons/${lesson.id}/quizzes`, {
        method: 'POST',
        body: JSON.stringify({ count: 5 }),
      })
      setQuiz(data)
      setAnswers(data.questions.map(() => null))
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const submitQuiz = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const data = await apiRequest(`/api/courses/quiz-attempts/${quiz.attemptId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      })
      setResult(data)
      setAttempts((current) => [{ id: quiz.attemptId, score: data.score, questionCount: data.total, createdAt: data.submittedAt, submittedAt: data.submittedAt }, ...current].slice(0, 10))
      setQuiz(null)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="practice-panel">
      <header><div><span aria-hidden="true">✦</span><div><small>ÔN TẬP CỤC BỘ</small><h3>{lesson.title}</h3></div></div><button type="button" aria-label="Đóng bài ôn tập" onClick={onClose}>×</button></header>
      <p className="practice-note">Câu hỏi và đáp án được tạo từ nội dung bài học trên máy chủ Lumina; dữ liệu không gửi tới dịch vụ AI bên ngoài.</p>
      {message && <p className="inline-message" role="status">{message}</p>}
      {!quiz && !result && <button className="primary-button" type="button" onClick={createQuiz} disabled={loading}>{loading ? 'Đang tạo bài ôn…' : 'Tạo bài ôn nhanh'}</button>}
      {quiz && <p className="practice-note">Bài ôn này có {quiz.questions.length} câu hỏi.</p>}
      {quiz && <form className="practice-questions" onSubmit={submitQuiz}>
        {quiz.questions.map((question, questionIndex) => <fieldset key={question.id}>
          <legend>{questionIndex + 1}. {question.prompt}</legend>
          {question.options.map((option, optionIndex) => <label key={option}><input type="radio" name={`question-${question.id}`} checked={answers[questionIndex] === optionIndex} onChange={() => setAnswers((current) => current.map((answer, index) => index === questionIndex ? optionIndex : answer))} />{option}</label>)}
        </fieldset>)}
        <button className="primary-button" type="submit" disabled={loading || answers.some((answer) => answer === null)}>{loading ? 'Đang chấm…' : 'Nộp bài ôn'}</button>
      </form>}
      {result && <div className="practice-result"><strong>Kết quả: {result.score}/{result.total}</strong><div>{result.questions.map((question, index) => <p className={question.isCorrect ? 'practice-correct' : 'practice-incorrect'} key={index}><b>{index + 1}. {question.isCorrect ? 'Đúng' : 'Chưa đúng'}.</b> Đáp án đúng: {question.options[question.correctIndex]}</p>)}</div><button type="button" onClick={() => { setResult(null); setQuiz(null) }}>Đóng kết quả</button></div>}
      {attempts.length > 0 && <div className="practice-history"><h4>Lịch sử ôn tập</h4><ul>{attempts.map((attempt) => <li key={attempt.id}><span>{new Date(attempt.createdAt).toLocaleString('vi-VN')}</span><strong>{attempt.score === null ? 'Chưa nộp' : `${attempt.score}/${attempt.questionCount}`}</strong></li>)}</ul></div>}
    </section>
  )
}

export default PracticeQuizPanel
