import { useEffect, useId, useRef } from 'react'
import Button from './ui/Button.jsx'
import { FieldError } from './ui/Feedback.jsx'

export default function CourseEntryDisclosure({ open, onOpenChange, isInstructor, form, onChange, errors, submitting, onSubmit }) {
  const id = useId()
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const wasOpen = useRef(false)
  const focusWithin = useRef(false)
  const label = isInstructor ? 'Tạo khóa học' : 'Tham gia khóa học'

  useEffect(() => {
    // Disabling a focused submit button blurs it to body in native browsers.
    // Keep ownership until the user explicitly focuses somewhere else.
    const trackFocus = (event) => { focusWithin.current = Boolean(panelRef.current?.contains(event.target)) }
    document.addEventListener('focusin', trackFocus)
    return () => document.removeEventListener('focusin', trackFocus)
  }, [])

  useEffect(() => {
    if (open && !wasOpen.current) panelRef.current?.querySelector('input')?.focus()
    if (!open && wasOpen.current && (panelRef.current?.contains(document.activeElement) || (focusWithin.current && document.activeElement === document.body))) triggerRef.current?.focus()
    wasOpen.current = open
  }, [open])

  const close = () => {
    if (panelRef.current?.contains(document.activeElement)) triggerRef.current?.focus()
    onOpenChange(false)
  }
  const field = (name, inputId, title, multiline = false) => <label htmlFor={inputId}>{title}
    {multiline
      ? <textarea id={inputId} rows="3" value={form[name]} onChange={(event) => onChange(name, event.target.value)} disabled={submitting} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? inputId + '-error' : undefined} />
      : <input id={inputId} value={form[name]} onChange={(event) => onChange(name, event.target.value)} disabled={submitting} autoComplete="off" aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? inputId + '-error' : undefined} />}
    <FieldError id={inputId + '-error'}>{errors[name]}</FieldError>
  </label>

  return <>
    <Button ref={triggerRef} id={id + '-trigger'} aria-expanded={open} aria-controls={id + '-panel'} onClick={() => onOpenChange(!open)}>{label}</Button>
    <section ref={panelRef} className="dashboard-form-card course-entry-panel" id={id + '-panel'} role="region" aria-labelledby={id + '-trigger'} hidden={!open} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); close() } }}>
      <div className="course-entry-intro"><h2>{isInstructor ? 'Tạo khóa học mới' : 'Tham gia bằng mã'}</h2><p>{isInstructor ? 'Mã tham gia được tạo tự động sau khi lưu.' : 'Nhập mã 8 ký tự do giảng viên cung cấp.'}</p><Button variant="secondary" onClick={close}>Thu gọn biểu mẫu</Button></div>
      <form onSubmit={onSubmit} noValidate aria-busy={submitting}>
        {isInstructor ? <>{field('title', 'course-title', 'Tên khóa học')}{field('description', 'course-description', 'Mô tả', true)}</> : field('joinCode', 'join-code', 'Mã tham gia')}
        <Button type="submit" disabled={submitting}>{submitting ? 'Đang xử lý…' : isInstructor ? 'Tạo khóa học' : 'Tham gia'}</Button>
      </form>
    </section>
  </>
}
