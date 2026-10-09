export function FieldError({ id, children }) {
  if (!children) return null
  return <span id={id} className="field-error" role="alert">{children}</span>
}

export function StatusMessage({ type = 'info', children, onDismiss }) {
  if (!children) return null
  return <div className={`status-message status-${type}`} role={type === 'error' ? 'alert' : 'status'}>
    <span>{children}</span>
    {onDismiss && <button type="button" aria-label="Đóng thông báo" onClick={onDismiss}>×</button>}
  </div>
}

export function LoadingState({ children = 'Đang tải…' }) {
  return <div className="state-card" role="status"><span className="state-spinner" aria-hidden="true" />{children}</div>
}

export function EmptyState({ title, children, action }) {
  return <div className="state-card state-empty"><strong>{title}</strong>{children && <span>{children}</span>}{action}</div>
}

export function ErrorState({ title = 'Không thể tải dữ liệu', children, onRetry, action }) {
  return <div className="state-card state-error" role="alert"><strong>{title}</strong>{children && <span>{children}</span>}{onRetry && <button className="ui-button ui-button-secondary" type="button" onClick={onRetry}>Thử lại</button>}{action}</div>
}
