import { useEffect, useId, useRef } from 'react'
import Button from './ui/Button.jsx'
import { FieldError } from './ui/Feedback.jsx'

export default function AssignmentEditor({ label, heading, open, onOpenChange, draft, errors = {}, pending, onChange, onSubmit, submitLabel }) {
  const id = useId()
  const trigger = useRef(null)
  const panel = useRef(null)
  const wasOpen = useRef(false)
  const hadFocus = useRef(false)
  useEffect(() => {
    const track = (event) => { hadFocus.current = Boolean(panel.current?.contains(event.target)) }
    document.addEventListener('focusin', track)
    return () => document.removeEventListener('focusin', track)
  }, [])
  useEffect(() => {
    if (open && !wasOpen.current) panel.current?.querySelector('input:not([disabled])')?.focus()
    if (!open && wasOpen.current && hadFocus.current && document.activeElement === document.body) trigger.current?.focus()
    wasOpen.current = open
  }, [open])
  const close = () => { trigger.current?.focus(); onOpenChange(false) }
  const field = (name, text, type = 'text', multiline = false) => <div className="aw-field"><label htmlFor={`${id}-${name}`}>{text}
    {multiline ? <textarea id={`${id}-${name}`} value={draft[name]} rows="4" maxLength="20000" disabled={pending} onChange={(event) => onChange(name, event.target.value)} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${id}-${name}-error` : undefined} />
      : <input id={`${id}-${name}`} type={type} value={draft[name]} disabled={pending} maxLength={name === 'title' ? 160 : undefined} min={name === 'points' ? 1 : undefined} max={name === 'points' ? 1000 : undefined} step={name === 'points' ? 1 : undefined} onChange={(event) => onChange(name, event.target.value)} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${id}-${name}-error` : undefined} />}
    </label><FieldError id={`${id}-${name}-error`}>{errors[name]}</FieldError>
  </div>
  return <div className="aw-editor">
    <Button ref={trigger} variant="secondary" aria-expanded={open} aria-controls={`${id}-panel`} disabled={pending} onClick={() => onOpenChange(!open)}>{label}</Button>
    {open && <section id={`${id}-panel`} ref={panel} className="aw-editor-panel" aria-label={heading} onKeyDown={(event) => { if (event.key === 'Escape' && !pending) { event.preventDefault(); close() } }}>
      <div className="aw-editor-heading"><h4>{heading}</h4><Button variant="secondary" disabled={pending} onClick={close}>Thu gọn biểu mẫu</Button></div>
      <form noValidate onSubmit={onSubmit} aria-busy={pending}>
        {field('title', 'Tiêu đề')}{field('description', 'Yêu cầu', 'text', true)}
        <div className="aw-form-row">{field('dueAt', 'Hạn nộp (giờ địa phương)', 'datetime-local')}{field('points', 'Điểm tối đa', 'number')}</div>
        <Button type="submit" disabled={pending}>{pending ? 'Đang lưu…' : submitLabel}</Button>
      </form>
    </section>}
  </div>
}
