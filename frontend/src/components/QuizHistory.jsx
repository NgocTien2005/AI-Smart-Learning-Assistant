import { useId } from 'react'
import Button from './ui/Button.jsx'
import { EmptyState, ErrorState, LoadingState, StatusMessage } from './ui/Feedback.jsx'

const dateLabel = (date) => date && Number.isFinite(new Date(date).getTime()) ? new Date(date).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Chưa có ngày'

export default function QuizHistory({ attempts, loading, error, filter, onFilter, selectedId, onSelect, onRetry, disabled, headingRef }) {
  const id = useId()
  const items = attempts || []
  const visible = items.filter((item) => filter === 'all' || (filter === 'draft' ? !item.submittedAt : Boolean(item.submittedAt)))
  return <aside className="qw-history" role="region" aria-label="Lịch sử ôn tập">
    <div className="qw-history-heading"><h4 tabIndex="-1" ref={headingRef}>Lịch sử ôn tập</h4><Button variant="secondary" disabled={disabled} onClick={onRetry} aria-label="Tải lại lịch sử">↻</Button></div>
    <label htmlFor={id}>Trạng thái bài ôn<select id={id} value={filter} onChange={(event) => onFilter(event.target.value)}><option value="all">Tất cả</option><option value="draft">Chưa nộp</option><option value="submitted">Đã nộp</option></select></label>
    {attempts !== null && <p className="qw-muted" role="status">{visible.length}/{items.length} bài ôn</p>}
    {selectedId !== null && items.some((item) => item.id === selectedId) && !visible.some((item) => item.id === selectedId) && <StatusMessage>Bài đang xem nằm ngoài bộ lọc. Nội dung vẫn được giữ.<Button variant="secondary" onClick={() => onFilter('all')}>Bỏ bộ lọc</Button></StatusMessage>}
    {error && <ErrorState title="Không tải được lịch sử ôn tập" onRetry={onRetry}>{error}</ErrorState>}
    {loading && <LoadingState>Đang tải lịch sử…</LoadingState>}
    {!loading && !error && items.length === 0 && <EmptyState title="Chưa có bài ôn tập">Mở Tạo bài ôn mới khi bạn muốn luyện tập.</EmptyState>}
    {!loading && !error && items.length > 0 && visible.length === 0 && <EmptyState title="Không có bài ôn phù hợp" action={<Button variant="secondary" onClick={() => onFilter('all')}>Bỏ bộ lọc</Button>}>Thử trạng thái khác.</EmptyState>}
    <div className="qw-history-items">{visible.map((item) => <button type="button" key={item.id} className={'qw-history-item' + (item.id === selectedId ? ' is-selected' : '')} aria-current={item.id === selectedId ? 'true' : undefined} aria-label={(item.submittedAt ? 'Xem kết quả bài ôn #' : 'Tiếp tục bài ôn #') + item.id} disabled={disabled} onClick={() => onSelect(item.id)}>
      <strong>{item.submittedAt ? 'Xem kết quả' : 'Tiếp tục'} · #{item.id}</strong><span>{item.submittedAt ? 'Đã nộp' : 'Chưa nộp'}</span><small>{dateLabel(item.createdAt)} (giờ địa phương)</small><small>{Number.isInteger(item.questionCount) ? item.questionCount + ' câu' : 'Chưa có số câu'}</small>
      {item.submittedAt && <span>{Number.isInteger(item.score) && Number.isInteger(item.questionCount) ? item.score + '/' + item.questionCount + ' điểm' : 'Chưa có dữ liệu điểm'}</span>}
    </button>)}</div>
  </aside>
}
