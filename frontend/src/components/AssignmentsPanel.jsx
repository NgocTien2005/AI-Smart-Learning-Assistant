import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '../services/api.js'
import { assignmentDate, assignmentId, assignmentStateLabel, defaultSubmission, filterAssignments, hasGrade, localAssignmentDate, orderAssignments, overdueAssignment, studentAssignmentState, submissionsOf } from '../services/assignmentView.js'
import AssignmentEditor from './AssignmentEditor.jsx'
import ConfirmDialog from './ui/ConfirmDialog.jsx'
import Button from './ui/Button.jsx'
import { EmptyState, ErrorState, FieldError, LoadingState, StatusMessage } from './ui/Feedback.jsx'
import './AssignmentsPanel.css'

const blankAssignment = () => ({ title: '', description: '', dueAt: '', points: 100 })
const editorDraft = (assignment) => ({ title: assignment.title, description: assignment.description || '', points: assignment.points, dueAt: localAssignmentDate(assignment.dueAt) })
const validateAssignment = (draft) => {
  const errors = {}
  if (draft.title.trim().length < 3 || draft.title.trim().length > 160) errors.title = 'Tiêu đề phải từ 3 đến 160 ký tự.'
  if (!draft.description.trim() || draft.description.trim().length > 20000) errors.description = 'Yêu cầu là bắt buộc và tối đa 20.000 ký tự.'
  if (!Number.isInteger(Number(draft.points)) || Number(draft.points) < 1 || Number(draft.points) > 1000) errors.points = 'Điểm tối đa phải là số nguyên từ 1 đến 1000.'
  if (draft.dueAt && !Number.isFinite(new Date(draft.dueAt).getTime())) errors.dueAt = 'Hạn nộp không hợp lệ.'
  return errors
}
const assignmentPayload = (draft) => ({ title: draft.title.trim(), description: draft.description.trim(), points: Number(draft.points), dueAt: draft.dueAt ? new Date(draft.dueAt).toISOString() : null })

function StudentEditor({ assignment, submission, draft, error, pending, open, onOpenChange, onChange, onSubmit }) {
  const trigger = useRef(null)
  const field = useRef(null)
  const form = useRef(null)
  const hadFocus = useRef(false)
  const wasOpen = useRef(false)
  useEffect(() => {
    const track = (event) => { hadFocus.current = Boolean(form.current?.contains(event.target)) }
    document.addEventListener('focusin', track)
    return () => document.removeEventListener('focusin', track)
  }, [])
  useEffect(() => {
    if (open && !wasOpen.current) field.current?.focus()
    if (!open && wasOpen.current && hadFocus.current && document.activeElement === document.body) trigger.current?.focus()
    wasOpen.current = open
  }, [open])
  const close = () => { trigger.current?.focus(); onOpenChange(false) }
  return <div className="aw-student-editor">
    <Button ref={trigger} variant="secondary" aria-expanded={open} aria-controls={'aw-answer-' + assignment.id} disabled={pending} onClick={() => onOpenChange(!open)}>{submission ? 'Sửa bài làm' : 'Viết bài làm'}</Button>
    {open && <form ref={form} id={'aw-answer-' + assignment.id} aria-label="Bài làm của bạn" aria-busy={pending} noValidate onSubmit={(event) => { event.preventDefault(); onSubmit() }} onKeyDown={(event) => { if (event.key === 'Escape' && !pending) { event.preventDefault(); close() } }}>
      <label htmlFor={'aw-answer-field-' + assignment.id}>{submission ? 'Bài làm cập nhật' : 'Bài làm'}<textarea id={'aw-answer-field-' + assignment.id} ref={field} value={draft ?? submission?.content ?? ''} rows="6" maxLength="20000" disabled={pending} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'aw-answer-error-' + assignment.id : undefined} /></label>
      <FieldError id={'aw-answer-error-' + assignment.id}>{error}</FieldError>
      <p className="aw-muted">Bản nháp được giữ khi đổi bài trong phần này; rời phần bài tập hoặc tải lại trang sẽ kết thúc bản nháp chưa nộp.</p>
      <div className="aw-actions"><Button type="submit" disabled={pending}>{pending ? 'Đang nộp…' : submission ? 'Cập nhật bài nộp' : 'Nộp bài'}</Button><Button variant="secondary" disabled={pending} onClick={close}>Thu gọn bài làm</Button></div>
    </form>}
  </div>
}

function AssignmentWorkspace({ course, isInstructor, onAssignmentsChange, selectedAssignmentId = null, selectedSubmissionId = null, onSelectAssignment, onSelectSubmission }) {
  const assignments = Array.isArray(course.assignments) ? course.assignments : []
  const [now, setNow] = useState(() => Date.now())
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [localAssignment, setLocalAssignment] = useState(() => orderAssignments(assignments, isInstructor, Date.now())[0]?.id ?? null)
  const [localSubmissions, setLocalSubmissions] = useState(() => Object.fromEntries(assignments.map((item) => [item.id, defaultSubmission(item)])))
  const [createDraft, setCreateDraft] = useState(blankAssignment)
  const [editDrafts, setEditDrafts] = useState({})
  const [answerDrafts, setAnswerDrafts] = useState({})
  const [gradeDrafts, setGradeDrafts] = useState({})
  const [openForms, setOpenForms] = useState({})
  const [errors, setErrors] = useState({})
  const [pending, setPending] = useState({})
  const [notice, setNotice] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')
  const mounted = useRef(false)
  const lifecycle = useRef(0)
  const locks = useRef(new Set())
  const readSequence = useRef(0)
  const readController = useRef(null)
  const mutationRevision = useRef(0)

  useEffect(() => {
    mounted.current = true
    lifecycle.current += 1
    const updateClock = () => setNow(Date.now())
    window.addEventListener('focus', updateClock)
    const timer = window.setInterval(updateClock, 30000)
    return () => {
      mounted.current = false
      lifecycle.current += 1
      readSequence.current += 1
      readController.current?.abort()
      window.removeEventListener('focus', updateClock)
      window.clearInterval(timer)
    }
  }, [])

  const ordered = orderAssignments(assignments, isInstructor, now)
  const visible = filterAssignments(ordered, { query, filter, isInstructor, now })
  const selectedId = selectedAssignmentId !== null ? assignmentId(selectedAssignmentId) : localAssignment ?? ordered[0]?.id
  const assignment = assignments.find((item) => item.id === selectedId)
  const submissions = submissionsOf(assignment)
  const submissionId = selectedSubmissionId !== null ? assignmentId(selectedSubmissionId) : localSubmissions[assignment?.id] ?? defaultSubmission(assignment)
  const selectedSubmission = submissions.find((item) => item.id === submissionId)
  const visibleSubmissions = submissions.filter((entry) => filter !== 'ungraded' && filter !== 'graded' || (filter === 'ungraded' ? entry.grade === null : hasGrade(entry)))
  const studentSubmission = submissions[0]
  const canSubmit = assignment && Array.isArray(assignment.submissions) && !overdueAssignment(assignment, now) && (!studentSubmission || studentSubmission.grade === null)
  const busy = (key) => Boolean(pending[key])
  const setOpen = (key, value) => setOpenForms((current) => ({ ...current, [key]: value }))
  const clearError = (key) => setErrors((current) => ({ ...current, [key]: null }))
  const chooseAssignment = (id) => { setLocalAssignment(id); onSelectAssignment?.(id) }
  const chooseSubmission = (id) => { setLocalSubmissions((current) => ({ ...current, [assignment.id]: id })); onSelectSubmission?.(assignment.id, id) }
  const mergeAssignments = (updater) => onAssignmentsChange?.(updater)
  const invalidateRead = () => {
    readSequence.current += 1
    readController.current?.abort()
    setRefreshing(false)
  }

  const refreshAssignments = async () => {
    if (locks.current.size) return
    readController.current?.abort()
    const controller = new AbortController()
    readController.current = controller
    const sequence = ++readSequence.current
    const revision = mutationRevision.current
    const epoch = lifecycle.current
    setRefreshing(true)
    setRefreshError('')
    try {
      const data = await apiRequest('/api/courses/' + course.id, { signal: controller.signal })
      if (!mounted.current || lifecycle.current !== epoch || readSequence.current !== sequence || mutationRevision.current !== revision || locks.current.size) return
      if (!Array.isArray(data.course?.assignments)) throw new Error('Máy chủ chưa trả dữ liệu bài tập.')
      mergeAssignments(() => data.course.assignments)
      setNow(Date.now())
      setNotice({ type: 'success', text: 'Đã tải lại bài tập.' })
    } catch (error) {
      if (mounted.current && lifecycle.current === epoch && readSequence.current === sequence && error.name !== 'AbortError') setRefreshError(error.message)
    } finally {
      if (mounted.current && lifecycle.current === epoch && readSequence.current === sequence) setRefreshing(false)
    }
  }

  const mutate = async (key, request, apply, message, context) => {
    if (locks.current.has(key)) return
    locks.current.add(key)
    mutationRevision.current += 1
    invalidateRead()
    const epoch = lifecycle.current
    setPending((current) => ({ ...current, [key]: true }))
    setNotice(null)
    try {
      const data = await request()
      if (!mounted.current || lifecycle.current !== epoch) return
      mutationRevision.current += 1
      invalidateRead()
      apply(data)
      setNotice({ type: 'success', text: typeof message === 'function' ? message(data) : message })
    } catch (error) {
      if (mounted.current && lifecycle.current === epoch) setNotice({ type: error.status === 409 ? 'warning' : 'error', text: 'Không hoàn tất thao tác với ' + context + ': ' + error.message + ' Bản nháp vẫn được giữ. Có thể tải lại bài tập rồi thử lại.' })
    } finally {
      locks.current.delete(key)
      if (mounted.current && lifecycle.current === epoch) setPending((current) => ({ ...current, [key]: false }))
    }
  }

  const saveAssignment = (event, target = null) => {
    event.preventDefault()
    const key = target ? 'edit:' + target.id : 'create'
    const draft = target ? editDrafts[target.id] || editorDraft(target) : createDraft
    const validation = validateAssignment(draft)
    setErrors((current) => ({ ...current, [key]: validation }))
    if (Object.keys(validation).length) { event.currentTarget.querySelector('input, textarea')?.focus(); return }
    const payload = assignmentPayload(draft)
    mutate(key, () => apiRequest(target ? '/api/courses/assignments/' + target.id : '/api/courses/' + course.id + '/assignments', { method: target ? 'PATCH' : 'POST', body: JSON.stringify(payload) }), (data) => {
      mergeAssignments((current) => target ? current.map((item) => item.id === target.id ? { ...item, ...data.assignment } : item) : [...current.filter((item) => item.id !== data.assignment.id), data.assignment])
      if (target) setEditDrafts((current) => { const next = { ...current }; delete next[target.id]; return next })
      else setCreateDraft(blankAssignment())
      setOpen(key, false)
      clearError(key)
    }, (data) => (target ? 'Đã cập nhật ' : 'Đã tạo ') + '“' + data.assignment.title + '”.', '“' + draft.title.trim() + '”')
  }

  const submitWork = (target) => {
    const submission = submissionsOf(target)[0]
    const content = (answerDrafts[target.id] ?? submission?.content ?? '').trim()
    if (!content || content.length > 20000) { setErrors((current) => ({ ...current, ['answer:' + target.id]: 'Bài làm là bắt buộc và tối đa 20.000 ký tự.' })); return }
    mutate('submit:' + target.id, () => apiRequest('/api/courses/assignments/' + target.id + '/submission', { method: 'PUT', body: JSON.stringify({ content }) }), (data) => {
      mergeAssignments((current) => current.map((item) => item.id === target.id ? { ...item, submissions: [data.submission] } : item))
      setAnswerDrafts((current) => { const next = { ...current }; delete next[target.id]; return next })
      setOpen('answer:' + target.id, false)
      clearError('answer:' + target.id)
    }, 'Đã nộp bài cho “' + target.title + '”.', '“' + target.title + '”')
  }

  const gradeWork = (event, target, submission) => {
    event.preventDefault()
    const draft = gradeDrafts[submission.id] || {}
    const rawGrade = draft.grade ?? submission.grade ?? ''
    const grade = rawGrade === '' || rawGrade === null ? null : Number(rawGrade)
    const feedback = draft.feedback ?? submission.feedback ?? ''
    const key = 'grade:' + submission.id
    if (grade !== null && (!Number.isInteger(grade) || grade < 0 || grade > target.points)) { setErrors((current) => ({ ...current, [key]: 'Điểm phải là số nguyên từ 0 đến ' + target.points + '.' })); return }
    if (feedback.length > 5000) { setErrors((current) => ({ ...current, [key]: 'Nhận xét tối đa 5.000 ký tự.' })); return }
    clearError(key)
    setLocalSubmissions((current) => ({ ...current, [target.id]: submission.id }))
    mutate(key, () => apiRequest('/api/courses/assignments/' + target.id + '/submissions/' + submission.studentId, { method: 'PATCH', body: JSON.stringify({ grade, feedback }) }), (data) => {
      mergeAssignments((current) => current.map((item) => item.id === target.id ? { ...item, submissions: submissionsOf(item).map((entry) => entry.id === submission.id ? { ...entry, ...data.submission, student: entry.student } : entry) } : item))
      setGradeDrafts((current) => { const next = { ...current }; delete next[submission.id]; return next })
    }, (data) => (data.submission.grade === null ? 'Đã lưu nhận xét cho ' : 'Đã lưu điểm và nhận xét cho ') + (submission.student?.name || 'học viên') + ' · ' + target.title + '.', (submission.student?.name || 'học viên') + ' · ' + target.title)
  }

  const askDelete = (target) => setConfirmation({
    title: 'Xóa bài tập?', message: 'Xóa “' + target.title + '” cùng các bài nộp liên quan? Thao tác này không thể hoàn tác.', confirmLabel: 'Xóa bài tập', danger: true,
    onConfirm: () => mutate('delete:' + target.id, () => apiRequest('/api/courses/assignments/' + target.id, { method: 'DELETE' }), () => { mergeAssignments((current) => current.filter((item) => item.id !== target.id)) }, 'Đã xóa “' + target.title + '”.', '“' + target.title + '”'),
  })
  const deadlineText = (item) => item.dueAt ? 'Hạn ' + assignmentDate(item.dueAt) + ' (giờ địa phương)' : item.dueAt === null ? 'Không giới hạn thời gian' : 'Chưa có dữ liệu hạn nộp'
  const statusText = (item) => isInstructor
    ? Array.isArray(item.submissions) ? submissionsOf(item).filter((entry) => entry.grade === null).length + ' chưa chấm · ' + item.submissions.length + ' bài nộp' : 'Chưa có dữ liệu bài nộp'
    : assignmentStateLabel(studentAssignmentState(item, now))
  const resetFilters = () => { setQuery(''); setFilter('all') }

  return <section className="assignment-workspace" aria-label="Bài tập và chấm bài">
    <header className="aw-heading"><div><span className="eyebrow">BÀI TẬP</span><h2>{isInstructor ? 'Bài tập và bài nộp' : 'Bài tập của khóa học'}</h2><p>{isInstructor ? 'Ưu tiên bài nộp cần xem, chọn một bài để chấm.' : 'Tìm việc cần làm, đọc yêu cầu và theo dõi kết quả.'}</p></div><Button variant="secondary" disabled={Object.values(pending).some(Boolean)} onClick={refreshAssignments}>{refreshing ? 'Đang tải lại…' : 'Tải lại bài tập'}</Button></header>
    {notice && <StatusMessage type={notice.type} onDismiss={() => setNotice(null)}>{notice.text}</StatusMessage>}
    {refreshError && <ErrorState title="Không tải lại được bài tập" onRetry={refreshAssignments}>{refreshError} Nội dung và bản nháp hiện tại vẫn được giữ.</ErrorState>}
    {refreshing && <LoadingState>Đang tải lại bài tập; bản nháp vẫn được giữ…</LoadingState>}
    {!Array.isArray(course.assignments) ? <ErrorState title="Chưa có dữ liệu bài tập" onRetry={refreshAssignments} /> : <div className="aw-layout">
      <section className="aw-list" role="region" aria-label="Danh sách bài tập">
        <label htmlFor="aw-search">Tìm bài tập<input id="aw-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tiêu đề hoặc yêu cầu…" /></label>
        <label htmlFor="aw-filter">Trạng thái bài tập<select id="aw-filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Tất cả</option>{isInstructor ? <><option value="ungraded">Có bài chưa chấm</option><option value="submitted">Đã có bài nộp</option><option value="graded">Có bài đã chấm</option></> : <><option value="todo">Cần nộp</option><option value="submitted">Đã nộp</option><option value="graded">Đã chấm</option><option value="overdue">Quá hạn chưa nộp</option></>}</select></label>
        <p className="aw-list-count" role="status">{visible.length}/{assignments.length} bài tập</p>
        {assignment && !visible.some((item) => item.id === assignment.id) && <StatusMessage>Bài đang xem nằm ngoài bộ lọc. Nội dung vẫn được giữ.<Button variant="secondary" onClick={resetFilters}>Bỏ tìm kiếm và bộ lọc</Button></StatusMessage>}
        {assignments.length === 0 ? <EmptyState title="Chưa có bài tập">{isInstructor ? 'Mở Giao bài tập mới để tạo khi cần.' : 'Giảng viên chưa giao bài tập cho khóa học này.'}</EmptyState> : visible.length === 0 ? <EmptyState title="Không có bài tập phù hợp" action={!assignment ? <Button variant="secondary" onClick={resetFilters}>Bỏ tìm kiếm và bộ lọc</Button> : undefined}>Thử từ khóa hoặc trạng thái khác.</EmptyState> : <div className="aw-list-items">{visible.map((item) => <button className={'aw-list-item' + (assignment?.id === item.id ? ' is-selected' : '')} key={item.id} type="button" title={item.title} aria-label={'Mở bài tập ' + item.title} aria-current={assignment?.id === item.id ? 'true' : undefined} onClick={() => chooseAssignment(item.id)}><strong>{item.title}</strong><span className="aw-status">{statusText(item)}</span><small>{deadlineText(item)}</small><small>{Number.isInteger(item.points) ? item.points + ' điểm tối đa' : 'Điểm tối đa chưa có dữ liệu'}</small></button>)}</div>}
      </section>
      <div className="aw-detail-column">
        {isInstructor && <AssignmentEditor label="Giao bài tập mới" heading="Giao bài tập mới" open={Boolean(openForms.create)} onOpenChange={(open) => setOpen('create', open)} draft={createDraft} errors={errors.create || {}} pending={busy('create')} onChange={(name, value) => { setCreateDraft((current) => ({ ...current, [name]: value })); clearError('create') }} onSubmit={saveAssignment} submitLabel="Giao bài tập" />}
        {!assignment ? selectedAssignmentId !== null || selectedId ? <ErrorState title="Không tìm thấy bài tập đã chọn">Địa chỉ không hợp lệ hoặc bài đã bị xóa. Chọn bài trong danh sách.</ErrorState> : <EmptyState title="Chọn một bài tập">Nội dung và bài nộp sẽ xuất hiện tại đây.</EmptyState> : <article className="aw-detail" aria-label={'Chi tiết ' + assignment.title}>
          <header className="aw-detail-heading"><div><span className="aw-status">{statusText(assignment)}</span><h3>{assignment.title}</h3><p>{deadlineText(assignment)}</p><strong>{Number.isInteger(assignment.points) ? assignment.points + ' điểm tối đa' : 'Điểm tối đa chưa có dữ liệu'}</strong></div>{isInstructor && <Button variant="danger" disabled={busy('delete:' + assignment.id) || busy('edit:' + assignment.id)} onClick={() => askDelete(assignment)}>Xóa bài tập</Button>}</header>
          <section className="aw-requirements"><h4>Yêu cầu bài tập</h4><div className="aw-long-text" role="region" aria-label="Yêu cầu đầy đủ" tabIndex="0">{assignment.description || 'Chưa có nội dung yêu cầu.'}</div></section>
          {isInstructor && <AssignmentEditor key={'edit-' + assignment.id} label="Sửa bài tập" heading={'Sửa ' + assignment.title} open={Boolean(openForms['edit:' + assignment.id])} onOpenChange={(open) => setOpen('edit:' + assignment.id, open)} draft={editDrafts[assignment.id] || editorDraft(assignment)} errors={errors['edit:' + assignment.id] || {}} pending={busy('edit:' + assignment.id)} onChange={(name, value) => { setEditDrafts((current) => ({ ...current, [assignment.id]: { ...(current[assignment.id] || editorDraft(assignment)), [name]: value } })); clearError('edit:' + assignment.id) }} onSubmit={(event) => saveAssignment(event, assignment)} submitLabel="Lưu bài tập" />}
          {isInstructor ? <section className="aw-review"><h4>Bài nộp của học viên</h4>{!Array.isArray(assignment.submissions) ? <ErrorState title="Chưa có dữ liệu bài nộp" onRetry={refreshAssignments} /> : submissions.length === 0 ? <EmptyState title="Chưa có học viên nộp bài">Bài nộp sẽ xuất hiện khi học viên gửi.</EmptyState> : <div className="aw-submission-layout">
            <div className="aw-submission-list" role="region" aria-label="Danh sách bài nộp">{selectedSubmission && !visibleSubmissions.some((entry) => entry.id === selectedSubmission.id) && <StatusMessage>Bài nộp đang xem nằm ngoài bộ lọc. Nội dung vẫn được giữ.<Button variant="secondary" onClick={() => setFilter('all')}>Hiện tất cả bài nộp</Button></StatusMessage>}{visibleSubmissions.map((entry) => <button type="button" className={'aw-submission-choice' + (entry.id === selectedSubmission?.id ? ' is-selected' : '')} key={entry.id} aria-label={'Xem bài nộp của ' + (entry.student?.name || 'học viên')} aria-current={entry.id === selectedSubmission?.id ? 'true' : undefined} onClick={() => chooseSubmission(entry.id)}><strong>{entry.student?.name || 'Học viên'}</strong><small>{hasGrade(entry) ? 'Đã chấm · ' + entry.grade + '/' + assignment.points : 'Chưa chấm'}</small><small>{assignmentDate(entry.submittedAt)}</small></button>)}</div>
            {!selectedSubmission ? <ErrorState title="Không tìm thấy bài nộp đã chọn">Chọn một bài nộp thuộc bài tập này.</ErrorState> : <div className="aw-submission-detail" key={selectedSubmission.id}>
              <header><h5>{selectedSubmission.student?.name || 'Học viên'}</h5><p className="aw-muted">{selectedSubmission.student?.email}</p><p>Nộp {assignmentDate(selectedSubmission.submittedAt)} (giờ địa phương)</p></header>
              <div className="aw-long-text" role="region" aria-label="Nội dung bài nộp" tabIndex="0">{selectedSubmission.content}</div>
              <form noValidate aria-label="Chấm bài nộp" aria-busy={busy('grade:' + selectedSubmission.id)} onSubmit={(event) => gradeWork(event, assignment, selectedSubmission)}>
                <div className="aw-grade-fields"><label htmlFor={'aw-grade-' + selectedSubmission.id}>Điểm<input id={'aw-grade-' + selectedSubmission.id} type="number" min="0" step="1" max={assignment.points} value={gradeDrafts[selectedSubmission.id]?.grade ?? selectedSubmission.grade ?? ''} disabled={busy('grade:' + selectedSubmission.id)} onChange={(event) => { setGradeDrafts((current) => ({ ...current, [selectedSubmission.id]: { ...current[selectedSubmission.id], grade: event.target.value } })); clearError('grade:' + selectedSubmission.id) }} aria-invalid={Boolean(errors['grade:' + selectedSubmission.id])} aria-describedby={'aw-grade-help-' + selectedSubmission.id + (errors['grade:' + selectedSubmission.id] ? ' aw-grade-error-' + selectedSubmission.id : '')} /></label>
                <label htmlFor={'aw-feedback-' + selectedSubmission.id}>Nhận xét<textarea id={'aw-feedback-' + selectedSubmission.id} rows="3" maxLength="5000" value={gradeDrafts[selectedSubmission.id]?.feedback ?? selectedSubmission.feedback ?? ''} disabled={busy('grade:' + selectedSubmission.id)} onChange={(event) => { setGradeDrafts((current) => ({ ...current, [selectedSubmission.id]: { ...current[selectedSubmission.id], feedback: event.target.value } })); clearError('grade:' + selectedSubmission.id) }} /></label></div>
                <p className="aw-muted" id={'aw-grade-help-' + selectedSubmission.id}>{hasGrade(selectedSubmission) ? 'Điểm đã lưu: ' + selectedSubmission.grade + '/' + assignment.points + '. ' : 'Chưa có điểm đã lưu. '}Để trống điểm để chỉ lưu nhận xét.</p>
                <FieldError id={'aw-grade-error-' + selectedSubmission.id}>{errors['grade:' + selectedSubmission.id]}</FieldError><Button type="submit" disabled={busy('grade:' + selectedSubmission.id)}>{busy('grade:' + selectedSubmission.id) ? 'Đang lưu…' : 'Lưu chấm bài'}</Button>
              </form>
            </div>}
          </div>}</section> : <section className="aw-student-result"><h4>Bài làm và kết quả của bạn</h4>
            {studentSubmission ? <div className="submission-result"><strong>Đã nộp · {assignmentDate(studentSubmission.submittedAt)} (giờ địa phương)</strong><h5>Bài đã nộp</h5><div className="aw-long-text" role="region" aria-label="Bài đã nộp" tabIndex="0">{studentSubmission.content}</div>{hasGrade(studentSubmission) ? <p>Kết quả: <b>{studentSubmission.grade}/{assignment.points}</b></p> : <p>{studentSubmission.grade === null ? 'Đang chờ giảng viên chấm bài.' : 'Chưa có dữ liệu điểm.'}</p>}{studentSubmission.feedback && <div className="aw-feedback"><strong>Nhận xét của giảng viên</strong><p>{studentSubmission.feedback}</p></div>}</div> : <p className="aw-muted">{Array.isArray(assignment.submissions) ? 'Bạn chưa nộp bài tập này.' : 'Chưa có dữ liệu bài nộp.'}</p>}
            {canSubmit && <StudentEditor key={assignment.id} assignment={assignment} submission={studentSubmission} draft={answerDrafts[assignment.id]} error={errors['answer:' + assignment.id]} pending={busy('submit:' + assignment.id)} open={Boolean(openForms['answer:' + assignment.id])} onOpenChange={(open) => setOpen('answer:' + assignment.id, open)} onChange={(value) => { setAnswerDrafts((current) => ({ ...current, [assignment.id]: value })); clearError('answer:' + assignment.id) }} onSubmit={() => submitWork(assignment)} />}
            {overdueAssignment(assignment, now) && <StatusMessage type="warning">Đã quá hạn nộp bài. Nội dung và phản hồi đã có vẫn được giữ; máy chủ quyết định thời hạn cuối cùng.</StatusMessage>}
            {hasGrade(studentSubmission) && <p className="aw-muted">Bài đã được chấm và không thể cập nhật nội dung.</p>}
          </section>}
        </article>}
      </div>
    </div>}
    {confirmation && <ConfirmDialog {...confirmation} onCancel={() => setConfirmation(null)} onConfirm={() => { const action = confirmation.onConfirm; setConfirmation(null); action() }} />}
  </section>
}

export default function AssignmentsPanel(props) {
  return <AssignmentWorkspace key={props.course.id} {...props} />
}
