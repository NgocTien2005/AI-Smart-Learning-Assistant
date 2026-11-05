import '../pages/AuthEntry.css'
import { FieldError } from './ui/Feedback.jsx'

export function EntryField({ id, label, error, children }) {
  return <div className="entry-field"><label htmlFor={id}>{label}</label><div className="input-wrap">{children}</div><FieldError id={`${id}-error`}>{error}</FieldError></div>
}

function LearningIllustration() {
  return <svg className="entry-illustration" viewBox="0 0 420 240" fill="none" aria-hidden="true" focusable="false">
    <ellipse cx="208" cy="209" rx="154" ry="18" fill="#c9ddf7" opacity=".55" />
    <circle cx="217" cy="111" r="96" fill="#e2edfc" />
    <circle cx="217" cy="111" r="77" stroke="#c8daf3" strokeDasharray="4 7" />
    <path d="M83 79c43-20 86-13 127 13v116c-42-26-83-32-127-13V79Z" fill="#b4d1f7" stroke="#4d86ce" strokeWidth="2" strokeLinejoin="round" />
    <path d="M337 79c-43-20-86-13-127 13v116c42-26 83-32 127-13V79Z" fill="#7faeea" stroke="#4d86ce" strokeWidth="2" strokeLinejoin="round" />
    <path d="M91 63c39-15 80-8 119 17v114c-39-25-80-32-119-17V63Z" fill="white" stroke="#9ebce6" strokeWidth="2" strokeLinejoin="round" />
    <path d="M329 63c-39-15-80-8-119 17v114c39-25 80-32 119-17V63Z" fill="#f8fbff" stroke="#9ebce6" strokeWidth="2" strokeLinejoin="round" />
    <path d="M109 87c27-5 52 1 78 15M109 106c27-5 52 1 78 15M109 125c19-3 37 0 56 8M234 101c26-14 51-20 77-15M234 120c26-14 51-20 77-15M234 139c18-9 36-14 54-15" stroke="#c0d2ec" strokeWidth="4" strokeLinecap="round" />
    <path d="M283 66v51l12-10 12 2V61" fill="#1769e0" />
    <rect x="46" y="119" width="65" height="65" rx="18" fill="white" stroke="#d0dff3" transform="rotate(-9 46 119)" />
    <path d="m65 143 14-10 17 6-14 10-17-6Zm4 8 2 9c8 3 15 2 21-4l-2-9" stroke="#1769e0" strokeWidth="2.5" strokeLinejoin="round" />
    <circle cx="345" cy="58" r="25" fill="#1769e0" />
    <path d="m334 58 7 7 14-15" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M72 53v12m-6-6h12M355 155v12m-6-6h12" stroke="#7ca8df" strokeWidth="2" strokeLinecap="round" />
    <circle cx="136" cy="33" r="4" fill="#98bdea" />
    <circle cx="373" cy="108" r="3" fill="#98bdea" />
  </svg>
}

export default function AuthEntryShell({ title, description, headingRef, children }) {
  return <main className="auth-page auth-entry">
    <div className="entry-layout">
      <aside className="entry-story" aria-label="Giới thiệu Lumina">
        <header className="entry-brand"><span aria-hidden="true" className="entry-brand-mark">L</span><span>Lumina <small>LEARNING MANAGEMENT SYSTEM</small></span></header>
        <div className="entry-story-copy">
          <p className="entry-eyebrow">KHÔNG GIAN HỌC TẬP CỦA BẠN</p>
          <h2>Mỗi ngày học,<br /><span>một bước tiến.</span></h2>
          <p>Kết nối bài học, thực hành và ôn tập.<br />Tập trung vào hành trình của bạn.</p>
        </div>
        <LearningIllustration />
        <p className="entry-story-caption"><span aria-hidden="true" />Khóa học <b aria-hidden="true">·</b> Bài tập <b aria-hidden="true">·</b> Ôn tập</p>
      </aside>
      <div className="entry-form-panel">
        <section className="entry-card" aria-labelledby="entry-title">
          <header className="entry-heading"><p className="entry-kicker">TÀI KHOẢN LUMINA</p><h1 id="entry-title" tabIndex={-1} ref={headingRef}>{title}</h1><p>{description}</p></header>
          {children}
        </section>
        <p className="entry-footnote">Học tập, giảng dạy và quản lý trong cùng một không gian.</p>
      </div>
    </div>
  </main>
}
