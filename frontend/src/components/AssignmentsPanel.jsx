import { useState } from 'react'
import { apiRequest } from '../services/api.js'

const formatDate = (value) => new Date(value).toLocaleString('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const toLocalDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function AssignmentsPanel({ course, isInstructor, onAssignmentsChange, onNotice }) {
  const [form, setForm] = useState({ title: '', description: '', dueAt: '', points: 100 })
  const [submissionDrafts, setSubmissionDrafts] = useState({})
  const [gradeDrafts, setGradeDrafts] = useState({})
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const createAssignment = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const data = await apiRequest(`/api/courses/${course.id}/assignments`, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          points: Number(form.points),
          dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
        }),
      })
      onAssignmentsChange([...course.assignments, data.assignment])
      setForm({ title: '', description: '', dueAt: '', points: 100 })
      onNotice('Đã tạo bài tập.')
    } catch (error) {
      onNotice(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteAssignment = async (assignment) => {
    if (!window.confirm(`Xóa bài tập “${assignment.title}” và tất cả bài nộp?`)) return
    try {
      await apiRequest(`/api/courses/assignments/${assignment.id}`, { method: 'DELETE' })
      onAssignmentsChange(course.assignments.filter(({ id }) => id !== assignment.id))
      onNotice('Đã xóa bài tập.')
    } catch (error) {
      onNotice(error.message)
    }
  }

  const saveAssignment = async (event) => {
    event.preventDefault()
    if (!editing) return
    setSubmitting(true)
    try {
      const data = await apiRequest(`/api/courses/assignments/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editing.title,
          description: editing.description,
          points: Number(editing.points),
          dueAt: editing.dueAt ? new Date(editing.dueAt).toISOString() : null,
        }),
      })
      onAssignmentsChange(course.assignments.map((assignment) => assignment.id === editing.id
        ? { ...assignment, ...data.assignment, isOverdue: Boolean(data.assignment.dueAt && new Date(data.assignment.dueAt) < new Date()) }
        : assignment))
      setEditing(null)
      onNotice('Đã cập nhật bài tập.')
    } catch (error) {
      onNotice(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const submitWork = async (assignment) => {
    setSubmitting(true)
    try {
      const data = await apiRequest(`/api/courses/assignments/${assignment.id}/submission`, {
        method: 'PUT',
        body: JSON.stringify({ content: submissionDrafts[assignment.id] ?? assignment.submissions[0]?.content ?? '' }),
      })
      onAssignmentsChange(course.assignments.map((item) => item.id === assignment.id
        ? { ...item, submissions: [data.submission] }
        : item))
      onNotice('Đã nộp bài tập.')
    } catch (error) {
      onNotice(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const gradeWork = async (assignment, submission) => {
    const draft = gradeDrafts[submission.id] || {}
    const gradeValue = draft.grade ?? submission.grade
    setSubmitting(true)
    try {
      const data = await apiRequest(`/api/courses/assignments/${assignment.id}/submissions/${submission.studentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          grade: gradeValue === '' || gradeValue === null ? null : Number(gradeValue),
          feedback: draft.feedback ?? submission.feedback ?? '',
        }),
      })
      onAssignmentsChange(course.assignments.map((item) => item.id === assignment.id
        ? { ...item, submissions: item.submissions.map((current) => current.id === submission.id ? { ...current, ...data.submission } : current) }
        : item))
      onNotice(data.submission.grade === null ? 'Đã lưu nhận xét.' : 'Đã lưu điểm và nhận xét.')
    } catch (error) {
      onNotice(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="lesson-section assignment-section">
      <div className="section-title"><div><span className="eyebrow">BÀI TẬP</span><h2>{isInstructor ? 'Bài tập và bài nộp' : 'Bài tập của khóa học'}</h2></div><span>{course.assignments.length} bài tập</span></div>
      {isInstructor && <section className="management-card assignment-create">
        <h3>Giao bài tập mới</h3>
        <form onSubmit={createAssignment}>
          <label>Tiêu đề<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} minLength="3" maxLength="160" required /></label>
          <label>Yêu cầu<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="4" maxLength="20000" required /></label>
          <div className="form-row"><label>Hạn nộp<input type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} /></label><label>Điểm tối đa<input type="number" min="1" max="1000" value={form.points} onChange={(event) => setForm({ ...form, points: event.target.value })} required /></label></div>
          <button className="primary-button" disabled={submitting}>{submitting ? 'Đang tạo…' : 'Giao bài tập'}</button>
        </form>
      </section>}
      {course.assignments.length === 0
        ? <div className="empty-state"><strong>Chưa có bài tập</strong><span>{isInstructor ? 'Tạo bài tập ở biểu mẫu phía trên.' : 'Giảng viên chưa giao bài tập cho khóa học này.'}</span></div>
        : <div className="assignment-list">{course.assignments.map((assignment) => {
          const submission = assignment.submissions[0]
          const overdue = assignment.isOverdue
          return <article className="management-card assignment-card" key={assignment.id}>
            <div className="assignment-heading"><div><h3>{assignment.title}</h3><span>{assignment.points} điểm tối đa{assignment.dueAt ? ` · Hạn ${formatDate(assignment.dueAt)}` : ' · Không giới hạn thời gian'}</span></div>{isInstructor && <div className="form-actions"><button type="button" onClick={() => setEditing({ ...assignment, dueAt: toLocalDateTime(assignment.dueAt) })}>Sửa</button><button className="danger-button" type="button" onClick={() => deleteAssignment(assignment)}>Xóa</button></div>}</div>
            <p className="assignment-description">{assignment.description}</p>
            {editing?.id === assignment.id && <form className="assignment-edit-form" onSubmit={saveAssignment}><label>Tiêu đề<input value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} minLength="3" maxLength="160" required /></label><label>Yêu cầu<textarea value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} rows="4" maxLength="20000" required /></label><div className="form-row"><label>Hạn nộp<input type="datetime-local" value={editing.dueAt} onChange={(event) => setEditing({ ...editing, dueAt: event.target.value })} /></label><label>Điểm tối đa<input type="number" min="1" max="1000" value={editing.points} onChange={(event) => setEditing({ ...editing, points: event.target.value })} required /></label></div><div className="form-actions"><button className="primary-button" disabled={submitting}>Lưu bài tập</button><button type="button" onClick={() => setEditing(null)}>Hủy</button></div></form>}
            {isInstructor
              ? assignment.submissions.length === 0
                ? <p className="assignment-empty">Chưa có học viên nộp bài.</p>
                : <div className="submission-list">{assignment.submissions.map((item) => <form className="submission-card" key={item.id} onSubmit={(event) => { event.preventDefault(); gradeWork(assignment, item) }}>
                  <div><strong>{item.student.name}</strong><small>{item.student.email} · Nộp {formatDate(item.submittedAt)}</small></div>
                  <p>{item.content}</p>
                  <div className="form-row"><label>Điểm<input type="number" min="0" max={assignment.points} value={gradeDrafts[item.id]?.grade ?? item.grade ?? ''} onChange={(event) => setGradeDrafts({ ...gradeDrafts, [item.id]: { ...gradeDrafts[item.id], grade: event.target.value } })} placeholder={`/ ${assignment.points}`} /></label><label>Nhận xét<textarea value={gradeDrafts[item.id]?.feedback ?? item.feedback ?? ''} onChange={(event) => setGradeDrafts({ ...gradeDrafts, [item.id]: { ...gradeDrafts[item.id], feedback: event.target.value } })} rows="2" maxLength="5000" /></label></div>
                  <button className="primary-button" disabled={submitting}>Lưu chấm bài</button>
                </form>)}</div>
              : <div className="student-submission">
                {submission && <div className="submission-result"><strong>Đã nộp · {formatDate(submission.submittedAt)}</strong>{submission.grade !== null ? <p>Kết quả: <b>{submission.grade}/{assignment.points}</b>{submission.feedback && <span>{submission.feedback}</span>}</p> : <p>Đang chờ giảng viên chấm bài.</p>}</div>}
                {submission?.grade === null && !overdue && <label>Bài làm<textarea value={submissionDrafts[assignment.id] ?? submission.content} onChange={(event) => setSubmissionDrafts({ ...submissionDrafts, [assignment.id]: event.target.value })} rows="6" maxLength="20000" required /></label>}
                {!submission && !overdue && <label>Bài làm<textarea value={submissionDrafts[assignment.id] || ''} onChange={(event) => setSubmissionDrafts({ ...submissionDrafts, [assignment.id]: event.target.value })} rows="6" maxLength="20000" placeholder="Nhập câu trả lời hoặc nội dung bài làm…" required /></label>}
                {submission?.grade === null && !overdue && <button className="primary-button" type="button" disabled={submitting} onClick={() => submitWork(assignment)}>Cập nhật bài nộp</button>}
                {!submission && !overdue && <button className="primary-button" type="button" disabled={submitting || !submissionDrafts[assignment.id]?.trim()} onClick={() => submitWork(assignment)}>Nộp bài</button>}
                {overdue && !submission && <p className="assignment-empty">Đã quá hạn nộp bài.</p>}
              </div>}
          </article>
        })}</div>}
    </section>
  )
}

export default AssignmentsPanel
