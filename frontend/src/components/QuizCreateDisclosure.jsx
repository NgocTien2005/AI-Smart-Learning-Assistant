import { useEffect, useId, useRef, useState } from 'react'
import Button from './ui/Button.jsx'
import { StatusMessage } from './ui/Feedback.jsx'

export default function QuizCreateDisclosure({ pending, disabled, error, successVersion, onCreate }) {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(5)
  const id = useId()
  const trigger = useRef(null)
  const field = useRef(null)
  const previousSuccess = useRef(successVersion)
  useEffect(() => { if (open) field.current?.focus() }, [open])
  useEffect(() => {
    let active = true
    if (successVersion !== previousSuccess.current) {
      previousSuccess.current = successVersion
      queueMicrotask(() => { if (active) { setOpen(false); trigger.current?.focus() } })
    }
    return () => { active = false }
  }, [successVersion])
  const close = () => { setOpen(false); trigger.current?.focus() }
  return <div className="qw-create">
    <Button ref={trigger} variant="secondary" disabled={disabled} aria-expanded={open} aria-controls={id + '-form'} onClick={() => open ? close() : setOpen(true)}>Tạo bài ôn mới</Button>
    {open && <div id={id + '-form'} className="qw-create-body" onKeyDown={(event) => { if (event.key === 'Escape' && !disabled) { event.preventDefault(); close() } }}>
      <p className="qw-muted">Câu hỏi được tạo cục bộ theo mẫu định nghĩa giới hạn; số câu thực tế có thể ít hơn yêu cầu. Không dùng AI bên ngoài.</p>
      {error && <StatusMessage type="error">{error}</StatusMessage>}
      <form className="practice-create" onSubmit={(event) => { event.preventDefault(); onCreate(Number(count)) }} aria-busy={pending}>
        <label htmlFor={id + '-count'}>Số câu hỏi<select id={id + '-count'} ref={field} value={count} disabled={disabled} onChange={(event) => setCount(event.target.value)}>{Array.from({ length: 8 }, (_, index) => index + 3).map((value) => <option key={value} value={value}>{value} câu</option>)}</select></label>
        <Button type="submit" disabled={disabled}>{pending ? 'Đang tạo…' : 'Tạo bài ôn nhanh'}</Button><Button variant="secondary" disabled={disabled} onClick={close}>Thu gọn biểu mẫu</Button>
      </form>
    </div>}
  </div>
}
