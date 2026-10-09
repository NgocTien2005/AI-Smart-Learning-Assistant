import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api.js'
import ConfirmDialog from './ui/ConfirmDialog.jsx'
import { EmptyState, StatusMessage } from './ui/Feedback.jsx'

const formatDate = (value) => new Date(value).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })
const toLocalDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function AssignmentsPanel({ course, isInstructor, onAssignmentsChange, onNotice, onRefresh }) {
  const [form, setForm] = useState({ title: '', description: '', dueAt: '', points: 100 })
  const [submissionDrafts, setSubmissionDrafts] = useState({})
  const [gradeDrafts, setGradeDrafts] = useState({})
  const [editing, setEditing] = useState(null)
  const [pending, setPending] = useState({})
  const [notice, setNotice] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [filter, setFilter] = useState('all')
  const [now, setNow] = useState(0)

  useEffect(() => {
    const update = () => setNow(Date.now())
    update()
    window.addEventListener('focus', update)
    const timer = window.setInterval(update, 30000)
    return () => { window.removeEventListener('focus', update); window.clearInterval(timer) }
  }, [])

  const busy = (key) => Boolean(pending[key])
  const setBusy = (key, value) => setPending((current) => ({ ...current, [key]: value }))
  const notify = (text, type = 'info', action = null) => { setNotice({ text, type, action }); onNotice?.(text, type) }

  const createAssignment = async (event) => {
    event.preventDefault()
    setBusy('create', true)
    try {
      const data = await apiRequest(`/api/courses/${course.id}/assignments`, {
        method: 'POST',
        body: JSON.stringify({ ...form, title: form.title.trim(), points: Number(form.points), dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null }),
      })
      onAssignmentsChange([...course.assignments, data.assignment])
      setForm({ title: '', description: '', dueAt: '', points: 100 })
      notify('Đã tạo bài tập.', 'success')
    } catch (error) { notify(error.message, 'error') }
    finally { setBusy('create', false) }
  }

  const deleteAssignment = (assignment) => setConfirmation({
    title: 'Xóa bài tập?',
    message: `Xóa “${assignment.title}” cùng các bài nộp liên quan? Thao tác này không thể hoàn tác.`,
    confirmLabel: 'Xóa bài tập',
    danger: true,
    onConfirm: async () => {
      const key = `delete:${assignment.id}`
      setBusy(key, true)
      try {
        await apiRequest(`/api/courses/assignments/${assignment.id}`, { method: 'DELETE' })
        onAssignmentsChange(course.assignments.filter(({ id }) => id !== assignment.id))
        notify('Đã xóa bài tập.', 'success')
      } catch (error) { notify(error.message, 'error') }
      finally { setBusy(key, false) }
    },
  })

  const saveAssignment = async (event) => {
    event.preventDefault()
    if (!editing) return
    const key = `edit:${editing.id}`
    setBusy(key, true)
    try {
      const data = await apiRequest(`/api/courses/assignments/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: editing.title.trim(), description: editing.description, points: Number(editing.points), dueAt: editing.dueAt ? new Date(editing.dueAt).toISOString() : null }),
      })
      onAssignmentsChange(course.assignments.map((assignment) => assignment.id === editing.id ? { ...assignment, ...data.assignment } : assignment))
      setEditing(null)
      notify('Đã cập nhật bài tập.', 'success')
    } catch (error) { notify(error.status === 409 ? `${error.message} Điểm đã chấm không bị thay đổi; hãy tải lại trạng thái mới nhất.` : error.message, error.status === 409 ? 'warning' : 'error', error.status === 409 ? onRefresh : null) }
    finally { setBusy(key, false) }
  }

  const submitWork = async (assignment) => {
    const key = `submit:${assignment.id}`
    setBusy(key, true)
    try {
      const data = await apiRequest(`/api/courses/assignments/${assignment.id}/submission`, {
        method: 'PUT', body: JSON.stringify({ content: submissionDrafts[assignment.id] ?? assignment.submissions[0]?.content ?? '' }),
      })
      onAssignmentsChange(course.assignments.map((item) => item.id === assignment.id ? { ...item, submissions: [data.submission] } : item))
      setSubmissionDrafts((current) => { const next = { ...current }; delete next[assignment.id]; return next })
      notify('Đã nộp bài tập.', 'success')
    } catch (error) {
      notify(error.status === 409 ? `${error.message} Bản nháp của bạn vẫn được giữ; hãy tải lại dữ liệu trước khi thử tiếp.` : error.message, error.status === 409 ? 'warning' : 'error', error.status === 409 ? onRefresh : null)
    } finally { setBusy(key, false) }
  }

  const gradeWork = async (assignment, submission) => {
    const draft = gradeDrafts[submission.id] || {}
    const gradeValue = draft.grade ?? submission.grade
    if (gradeValue !== '' && gradeValue !== null && (!Number.isFinite(Number(gradeValue)) || Number(gradeValue) < 0 || Number(gradeValue) > assignment.points)) {
      notify(`Điểm phải nằm trong khoảng 0–${assignment.points}.`, 'error')
      return
    }
    const key = `grade:${submission.id}`
    setBusy(key, true)
    try {
      const data = await apiRequest(`/api/courses/assignments/${assignment.id}/submissions/${submission.studentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ grade: gradeValue === '' || gradeValue === null ? null : Number(gradeValue), feedback: draft.feedback ?? submission.feedback ?? '' }),
      })
      onAssignmentsChange(course.assignments.map((item) => item.id === assignment.id ? { ...item, submissions: item.submissions.map((current) => current.id === submission.id ? { ...current, ...data.submission } : current) } : item))
      setGradeDrafts((current) => { const next = { ...current }; delete next[submission.id]; return next })
      notify(data.submission.grade === null ? 'Đã lưu nhận xét.' : 'Đã lưu điểm và nhận xét.', 'success')
    } catch (error) { notify(error.status === 409 ? `${error.message} Hãy tải lại bài nộp trước khi ghi điểm.` : error.message, error.status === 409 ? 'warning' : 'error', error.status === 409 ? onRefresh : null) }
    finally { setBusy(key, false) }
  }

  const visibleAssignments = isInstructor
    ? course.assignments.filter((assignment) => filter === 'all' || assignment.submissions.some((submission) => filter === 'submitted' || (filter === 'ungraded' && submission.grade === null) || (filter === 'graded' && submission.grade !== null)))
    : course.assignments

  return <section className="lesson-section assignment-section">
    <div className="section-title"><div><span className="eyebrow">BÀI TẬP</span><h2>{isInstructor ? 'Bài tập và bài nộp' : 'Bài tập của khóa học'}</h2></div><span>{course.assignments.length} bài tập</span></div>
    {notice && <StatusMessage type={notice.type}>{notice.text}{notice.action && <button className="ui-button ui-button-secondary" type="button" onClick={notice.action}>Tải lại trạng thái mới nhất</button>}</StatusMessage>}
    {isInstructor && <label htmlFor="assignment-filter">Lọc bài nộp<select id="assignment-filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Tất cả</option><option value="submitted">Đã nộp</option><option value="ungraded">Chưa chấm</option><option value="graded">Đã chấm</option></select></label>}
    {isInstructor && <section className="management-card assignment-create"><h3>Giao bài tập mới</h3><form onSubmit={createAssignment}>
      <label htmlFor="assignment-title">Tiêu đề<input id="assignment-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} minLength="3" maxLength="160" required /></label>
      <label htmlFor="assignment-description">Yêu cầu<textarea id="assignment-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="4" maxLength="20000" required /></label>
      <div className="assignment-form-row"><label htmlFor="assignment-deadline">Hạn nộp (giờ địa phương)<input id="assignment-deadline" type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} /></label><label htmlFor="assignment-points">Điểm tối đa<input id="assignment-points" type="number" min="1" max="1000" value={form.points} onChange={(event) => setForm({ ...form, points: event.target.value })} required /></label></div>
      <button className="primary-button" disabled={busy('create')}>{busy('create') ? 'Đang tạo…' : 'Giao bài tập'}</button>
    </form></section>}
    {visibleAssignments.length === 0
      ? <EmptyState title={filter === 'all' ? 'Chưa có bài tập' : 'Không có bài nộp phù hợp'}>{isInstructor ? 'Tạo bài tập ở biểu mẫu phía trên.' : 'Giảng viên chưa giao bài tập cho khóa học này.'}</EmptyState>
      : <div className="assignment-list">{visibleAssignments.map((assignment) => {
        const submission = assignment.submissions[0]
        const overdue = Boolean(assignment.dueAt && new Date(assignment.dueAt).getTime() < now)
        const filteredSubmissions = assignment.submissions.filter((item) => filter === 'all' || filter === 'submitted' || (filter === 'ungraded' && item.grade === null) || (filter === 'graded' && item.grade !== null))
        return <article className="management-card assignment-card" key={assignment.id}>
          <div className="assignment-heading"><div><h3>{assignment.title}</h3><span>{assignment.points} điểm tối đa{assignment.dueAt ? ` · Hạn ${formatDate(assignment.dueAt)} (giờ địa phương)` : ' · Không giới hạn thời gian'}</span></div>{isInstructor && <div className="form-actions"><button type="button" onClick={() => setEditing({ ...assignment, dueAt: toLocalDateTime(assignment.dueAt) })}>Sửa</button><button className="danger-button" type="button" disabled={busy(`delete:${assignment.id}`)} onClick={() => deleteAssignment(assignment)}>Xóa</button></div>}</div>
          <p className="assignment-description">{assignment.description}</p>
          {editing?.id === assignment.id && <form className="assignment-edit-form" onSubmit={saveAssignment}>
            <label>Tiêu đề<input value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} minLength="3" maxLength="160" required /></label><label>Yêu cầu<textarea value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} rows="4" maxLength="20000" required /></label>
            <div className="assignment-form-row"><label>Hạn nộp (giờ địa phương)<input type="datetime-local" value={editing.dueAt} onChange={(event) => setEditing({ ...editing, dueAt: event.target.value })} /></label><label>Điểm tối đa<input type="number" min="1" max="1000" value={editing.points} onChange={(event) => setEditing({ ...editing, points: event.target.value })} required /></label></div>
            <div className="form-actions"><button className="primary-button" disabled={busy(`edit:${assignment.id}`)}>Lưu bài tập</button><button type="button" onClick={() => setEditing(null)}>Hủy</button></div>
          </form>}
          {isInstructor ? filteredSubmissions.length === 0 ? <p className="assignment-empty">Chưa có học viên nộp bài.</p> : <div className="submission-list">{filteredSubmissions.map((item) => <form className="submission-card" key={item.id} onSubmit={(event) => { event.preventDefault(); gradeWork(assignment, item) }}>
            <div><strong>{item.student.name}</strong><small>{item.student.email} · Nộp {formatDate(item.submittedAt)} (giờ địa phương)</small></div><p className="submitted-content">{item.content}</p>
            <div className="form-row"><label>Điểm<input aria-label="Điểm" type="number" min="0" max={assignment.points} value={gradeDrafts[item.id]?.grade ?? item.grade ?? ''} onChange={(event) => setGradeDrafts({ ...gradeDrafts, [item.id]: { ...gradeDrafts[item.id], grade: event.target.value } })} placeholder={`/ ${assignment.points}`} /></label><label>Nhận xét<textarea value={gradeDrafts[item.id]?.feedback ?? item.feedback ?? ''} onChange={(event) => setGradeDrafts({ ...gradeDrafts, [item.id]: { ...gradeDrafts[item.id], feedback: event.target.value } })} rows="2" maxLength="5000" /></label></div>
            <button className="primary-button" disabled={busy(`grade:${item.id}`)}>{busy(`grade:${item.id}`) ? 'Đang lưu…' : 'Lưu chấm bài'}</button>
          </form>)}</div>
            : <div className="student-submission">
              {submission && <div className="submission-result"><strong>Đã nộp · {formatDate(submission.submittedAt)} (giờ địa phương)</strong><h4>Bài đã nộp</h4><p className="submitted-content">{submission.content}</p>{submission.grade !== null ? <p>Kết quả: <b>{submission.grade}/{assignment.points}</b></p> : <p>Đang chờ giảng viên chấm bài.</p>}{submission.feedback && <p className="instructor-feedback"><strong>Nhận xét của giảng viên</strong>{submission.feedback}</p>}</div>}
              {submission?.grade === null && !overdue && <label htmlFor={`submission-draft-${assignment.id}`}>Bài làm cập nhật<textarea id={`submission-draft-${assignment.id}`} value={submissionDrafts[assignment.id] ?? submission.content} onChange={(event) => setSubmissionDrafts({ ...submissionDrafts, [assignment.id]: event.target.value })} rows="6" maxLength="20000" required /></label>}
              {!submission && !overdue && <label htmlFor={`submission-draft-${assignment.id}`}>Bài làm<textarea id={`submission-draft-${assignment.id}`} value={submissionDrafts[assignment.id] || ''} onChange={(event) => setSubmissionDrafts({ ...submissionDrafts, [assignment.id]: event.target.value })} rows="6" maxLength="20000" placeholder="Nhập câu trả lời hoặc nội dung bài làm…" required /></label>}
              {submission?.grade === null && !overdue && <button className="primary-button" type="button" disabled={busy(`submit:${assignment.id}`)} onClick={() => submitWork(assignment)}>Cập nhật bài nộp</button>}
              {!submission && !overdue && <button className="primary-button" type="button" disabled={busy(`submit:${assignment.id}`) || !submissionDrafts[assignment.id]?.trim()} onClick={() => submitWork(assignment)}>Nộp bài</button>}
              {overdue && !submission && <StatusMessage type="warning">Đã quá hạn nộp bài. Máy chủ là nơi quyết định thời hạn cuối cùng.</StatusMessage>}
            </div>}
        </article>
      })}</div>}
    {confirmation && <ConfirmDialog {...confirmation} onCancel={() => setConfirmation(null)} onConfirm={async () => { const action = confirmation.onConfirm; setConfirmation(null); await action() }} />}
  </section>
}

export default AssignmentsPanel
