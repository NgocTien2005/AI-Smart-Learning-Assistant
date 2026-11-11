import { useEffect, useRef } from 'react'
import Button from '../ui/Button.jsx'
import { FieldError } from '../ui/Feedback.jsx'

export default function StudentEditor({ assignment, submission, draft, error, pending, open, onOpenChange, onChange, onSubmit }) {
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

