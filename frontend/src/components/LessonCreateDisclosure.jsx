import { useEffect, useId, useRef } from 'react'
import Button from './ui/Button.jsx'
import { FieldError } from './ui/Feedback.jsx'
import { DocumentSelection } from './DocumentPreview.jsx'

export default function LessonCreateDisclosure({ open, onOpenChange, draft, errors, pending, onChange, onFile, onRemove, onSubmit, resetVersion }) {
  const id = useId()
  const trigger = useRef(null)
  const panel = useRef(null)
  const wasOpen = useRef(false)
  const focusWithin = useRef(false)
  useEffect(() => {
    const track = (event) => { focusWithin.current = Boolean(panel.current?.contains(event.target)) }
    document.addEventListener('focusin', track)
    return () => document.removeEventListener('focusin', track)
  }, [])
  useEffect(() => {
    if (open && !wasOpen.current) (panel.current?.querySelector('input:not([disabled])') || panel.current?.querySelector('button'))?.focus()
    if (!open && wasOpen.current && (panel.current?.contains(document.activeElement) || (focusWithin.current && document.activeElement === document.body))) trigger.current?.focus()
    wasOpen.current = open
  }, [open])
  useEffect(() => {
    if (!draft.file) { const input = panel.current?.querySelector('input[type=file]'); if (input) input.value = '' }
  }, [draft.file, resetVersion])
  const close = () => {
    if (panel.current?.contains(document.activeElement)) trigger.current?.focus()
    onOpenChange(false)
  }
  const field = (name, label, multiline = false) => <label htmlFor={'lesson-create-' + name}>{label}
    {multiline ? <textarea id={'lesson-create-' + name} rows="4" value={draft[name]} disabled={pending} onChange={(event) => onChange(name, event.target.value)} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? id + '-' + name + '-error' : undefined} />
      : <input id={'lesson-create-' + name} type={name === 'order' ? 'number' : 'text'} step={name === 'order' ? '1' : undefined} value={draft[name]} disabled={pending} onChange={(event) => onChange(name, event.target.value)} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? id + '-' + name + '-error' : undefined} />}
    <FieldError id={id + '-' + name + '-error'}>{errors[name]}</FieldError>
  </label>
  return <div className="lesson-create-disclosure">
    <Button ref={trigger} id={id + '-trigger'} aria-expanded={open} aria-controls={id + '-panel'} onClick={() => onOpenChange(!open)}>Thêm bài học</Button>
    <section ref={panel} id={id + '-panel'} className="management-card lesson-create-card" role="region" aria-labelledby={id + '-trigger'} hidden={!open} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); close() } }}>
      <div className="lesson-create-heading"><h3>Thêm nội dung mới</h3><Button variant="secondary" onClick={close}>Thu gọn biểu mẫu</Button></div>
      <form noValidate onSubmit={onSubmit} aria-busy={pending}>
        <div className="lesson-create-fields">{field('title', 'Tiêu đề')}{field('order', 'Thứ tự')}</div>
        {field('content', 'Nội dung', true)}
        <DocumentSelection file={draft.file} error={draft.fileError} onChange={onFile} onRemove={onRemove} disabled={pending} />
        <small>PDF có lớp văn bản được trích xuất cục bộ; không hỗ trợ OCR. TXT, Markdown và CSV cũng được hỗ trợ. Tối đa 10 MiB; PDF tối đa 250 trang, văn bản trích xuất tối đa 100.000 ký tự.</small>
        <Button type="submit" disabled={pending}>{pending ? 'Đang tải lên…' : 'Lưu bài học'}</Button>
      </form>
    </section>
  </div>
}
