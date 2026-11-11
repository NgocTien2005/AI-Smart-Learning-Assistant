import { localAssignmentDate } from './assignmentView.js'

export const blankAssignment = () => ({ title: '', description: '', dueAt: '', points: 100 })
export const editorDraft = (assignment) => ({ title: assignment.title, description: assignment.description || '', points: assignment.points, dueAt: localAssignmentDate(assignment.dueAt) })
export const validateAssignment = (draft) => {
  const errors = {}
  if (draft.title.trim().length < 3 || draft.title.trim().length > 160) errors.title = 'Tiêu đề phải từ 3 đến 160 ký tự.'
  if (!draft.description.trim() || draft.description.trim().length > 20000) errors.description = 'Yêu cầu là bắt buộc và tối đa 20.000 ký tự.'
  if (!Number.isInteger(Number(draft.points)) || Number(draft.points) < 1 || Number(draft.points) > 1000) errors.points = 'Điểm tối đa phải là số nguyên từ 1 đến 1000.'
  if (draft.dueAt && !Number.isFinite(new Date(draft.dueAt).getTime())) errors.dueAt = 'Hạn nộp không hợp lệ.'
  return errors
}
export const assignmentPayload = (draft) => ({ title: draft.title.trim(), description: draft.description.trim(), points: Number(draft.points), dueAt: draft.dueAt ? new Date(draft.dueAt).toISOString() : null })

