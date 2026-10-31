export const assignmentId = (value) => {
  if (!/^\d+$/.test(String(value))) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export const hasGrade = (submission) => Number.isInteger(submission?.grade)
export const submissionsOf = (assignment) => Array.isArray(assignment?.submissions) ? assignment.submissions : []
export const overdueAssignment = (assignment, now) => Boolean(assignment.dueAt && new Date(assignment.dueAt).getTime() < now)
export const studentAssignmentState = (assignment, now) => {
  if (!Array.isArray(assignment.submissions)) return 'unknown'
  const submission = assignment.submissions[0]
  if (submission) return hasGrade(submission) ? 'graded' : submission.grade === null ? 'submitted' : 'unknown'
  return overdueAssignment(assignment, now) ? 'overdue' : 'todo'
}

export const assignmentStateLabel = (state) => ({ todo: 'Cần nộp', submitted: 'Đã nộp · Chờ chấm', graded: 'Đã chấm', overdue: 'Quá hạn · Chưa nộp', unknown: 'Chưa có dữ liệu bài nộp' })[state]
const deadline = (item) => item.dueAt ? new Date(item.dueAt).getTime() : Infinity
export const orderAssignments = (assignments, isInstructor, now) => [...assignments].sort((a, b) => {
  const priority = (item) => isInstructor
    ? (submissionsOf(item).some((submission) => submission.grade === null) ? 0 : 1)
    : ({ todo: 0, submitted: 1, graded: 2, overdue: 3, unknown: 4 })[studentAssignmentState(item, now)]
  const dateDifference = deadline(a) === deadline(b) ? 0 : deadline(a) - deadline(b)
  return priority(a) - priority(b) || dateDifference || (new Date(a.createdAt || 0) - new Date(b.createdAt || 0)) || a.id - b.id
})

export const filterAssignments = (assignments, { query, filter, isInstructor, now }) => {
  const search = query.trim().toLocaleLowerCase('vi')
  return assignments.filter((item) => {
    if (search && !`${item.title} ${item.description || ''}`.toLocaleLowerCase('vi').includes(search)) return false
    if (filter === 'all') return true
    if (!isInstructor) return filter === 'submitted' ? submissionsOf(item).length > 0 : studentAssignmentState(item, now) === filter
    const submissions = submissionsOf(item)
    return filter === 'submitted' ? submissions.length > 0 : submissions.some((submission) => filter === 'ungraded' ? submission.grade === null : hasGrade(submission))
  })
}

export const defaultSubmission = (assignment) => {
  const submissions = submissionsOf(assignment)
  return submissions.find((submission) => submission.grade === null)?.id ?? submissions[0]?.id ?? null
}

export const assignmentDate = (value) => value && Number.isFinite(new Date(value).getTime())
  ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

export const localAssignmentDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
