import { useEffect, useRef } from 'react'

export default function ConfirmDialog({ title, message, confirmLabel = 'Xác nhận', danger = false, onConfirm, onCancel }) {
  const dialogRef = useRef(null)
  const previousFocus = useRef(null)
  const onCancelRef = useRef(onCancel)

  useEffect(() => { onCancelRef.current = onCancel }, [onCancel])

  useEffect(() => {
    previousFocus.current = document.activeElement
    const dialog = dialogRef.current
    dialog?.showModal()
    dialog?.querySelector('button')?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancelRef.current()
      if (event.key !== 'Tab' || !dialog) return
      const focusable = [...dialog.querySelectorAll('button:not([disabled])')]
      if (focusable.length < 2) return
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault()
        focusable.at(-1).focus()
      } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
        event.preventDefault()
        focusable[0].focus()
      }
    }
    dialog?.addEventListener('keydown', handleKeyDown)
    return () => {
      dialog?.removeEventListener('keydown', handleKeyDown)
      if (dialog?.open) dialog.close()
      previousFocus.current?.focus?.()
    }
  }, [])

  return <dialog className="confirm-dialog" ref={dialogRef} aria-labelledby="confirm-title" aria-describedby="confirm-message" onCancel={(event) => { event.preventDefault(); onCancel() }}>
    <h2 id="confirm-title">{title}</h2><p id="confirm-message">{message}</p>
    <div className="confirm-actions"><button type="button" className="ui-button ui-button-secondary" onClick={onCancel}>Hủy</button><button type="button" className={`ui-button ${danger ? 'ui-button-danger' : 'ui-button-primary'}`} onClick={onConfirm}>{confirmLabel}</button></div>
  </dialog>
}
