import { useState } from 'react'
import { Link } from 'react-router-dom'
import { courseDetail } from '../data/courseDetail.js'
import './CourseDetailPage.css'

const Icon = ({ children, className = '' }) => <span className={`ui-icon ${className}`} aria-hidden="true">{children}</span>

const navItems = [
  ['⌂', 'Trang chủ'], ['▦', 'Khóa học'], ['▣', 'Bài tập'], ['✦', 'AI Lab'], ['○', 'Hồ sơ'],
]

function CourseDetailPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [notice, setNotice] = useState('')

  const selectTab = (tab, target) => {
    setActiveTab(tab)
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const requestEnrollment = () => {
    setNotice('Tính năng đăng ký đang chờ API khóa học từ backend. Chưa có thay đổi nào được thực hiện.')
  }

  const previewLesson = () => {
    setActiveTab('content')
    document.getElementById('curriculum')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setNotice('Bài học thử được đánh dấu trong Chương 1. Trình phát bài học đang chờ backend.')
  }

  return (
    <div className="course-app">
      <button className="mobile-scrim" aria-label="Đóng menu" onClick={() => setMenuOpen(false)} data-open={menuOpen} />
      <aside className={`course-sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="course-brand"><span className="brand-mark">L</span><div><strong>Lumina Academy</strong><small>AI-Powered Learning</small></div></div>
        <nav aria-label="Điều hướng chính">
          {navItems.map(([icon, label]) => (
            <a href={label === 'Khóa học' ? '#course-main' : '#'} className={label === 'Khóa học' ? 'active' : ''} key={label} onClick={() => setMenuOpen(false)}>
              <Icon>{icon}</Icon>{label}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card"><Icon>✦</Icon><strong>Nâng cấp Pro</strong><small>Mở khóa toàn bộ sức mạnh AI</small><button type="button">Khám phá ngay</button></div>
          <a href="#help"><Icon>?</Icon>Trung tâm trợ giúp</a>
          <Link to="/dashboard"><Icon>↪</Icon>Dashboard</Link>
        </div>
      </aside>

      <div className="course-shell">
        <header className="course-header">
          <button className="menu-button" type="button" aria-label="Mở menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>☰</button>
          <label className="course-search"><Icon>⌕</Icon><span className="sr-only">Tìm kiếm khóa học</span><input type="search" placeholder="Tìm kiếm khóa học, bài giảng..." /></label>
          <div className="header-actions">
            <button type="button" aria-label="Thông báo"><Icon>♢</Icon><span className="notification-dot" /></button>
            <button type="button" aria-label="Trợ giúp"><Icon>?</Icon></button>
            <Link className="header-user" to="/dashboard" aria-label="Mở dashboard"><span className="avatar">L</span><span><strong>Lumina</strong><small>Dashboard</small></span></Link>
          </div>
        </header>

        <main id="course-main" className="course-main">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <a href="#">Trang chủ</a><span>/</span><a href="#">Danh mục khóa học</a><span>/</span><a href="#">Trí tuệ nhân tạo</a><span>/</span><span aria-current="page">AI 101</span>
          </nav>

          <section className="course-hero" aria-labelledby="course-title">
            <div className="hero-copy">
              <span className="ai-badge"><Icon>✦</Icon>{courseDetail.badge}</span>
              <h1 id="course-title">{courseDetail.title}</h1>
              <p className="hero-description">{courseDetail.description}</p>
              <div className="instructor-row">
                <span className="avatar instructor-avatar">{courseDetail.instructor.initials}</span>
                <span><small>Giảng viên</small><strong>{courseDetail.instructor.name}</strong></span>
                <span className="meta-divider" />
                <span className="rating"><span className="stars" aria-label="4.8 trên 5 sao">★★★★★</span><strong>{courseDetail.rating}</strong><small>({courseDetail.reviews})</small></span>
              </div>
              <div className="course-stats">
                {courseDetail.stats.map((stat) => <div key={stat.label}><Icon>{stat.icon === 'signal' ? '▥' : stat.icon === 'calendar' ? '□' : stat.icon === 'book' ? '▤' : '◎'}</Icon><span><small>{stat.label}</small><strong>{stat.value}</strong></span></div>)}
              </div>
              <div className="hero-actions">
                <button className="primary-action" type="button" onClick={requestEnrollment}>Đăng ký khóa học <span>→</span></button>
                <button className="secondary-action" type="button" onClick={previewLesson}><Icon>▷</Icon>Xem bài học thử</button>
              </div>
              {notice && <p className="course-notice" role="status"><Icon>i</Icon>{notice}<button type="button" aria-label="Đóng thông báo" onClick={() => setNotice('')}>×</button></p>}
            </div>

            <div className="hero-preview" aria-label="Xem trước khóa học">
              <div className="cover-art">
                <span className="cover-chip">AI • 101</span><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="ai-core">AI</span>
                <button type="button" aria-label="Xem video giới thiệu" onClick={previewLesson}><Icon>▶</Icon></button>
              </div>
              <div className="preview-benefits">
                <div><Icon>✦</Icon><span><strong>Học thông minh hơn cùng Lumina AI</strong><small>Lộ trình tự điều chỉnh theo tiến độ của bạn</small></span></div>
                <ul><li>Trợ giảng AI giải đáp 24/7</li><li>Tóm tắt bài giảng tự động</li><li>AI Quiz thích ứng cá nhân</li><li>Chứng chỉ số có xác thực</li></ul>
              </div>
            </div>
          </section>

          <div className="course-tabs" role="tablist" aria-label="Nội dung khóa học">
            <button role="tab" aria-selected={activeTab === 'overview'} className={activeTab === 'overview' ? 'active' : ''} onClick={() => selectTab('overview', 'overview')}>Tổng quan</button>
            <button role="tab" aria-selected={activeTab === 'content'} className={activeTab === 'content' ? 'active' : ''} onClick={() => selectTab('content', 'curriculum')}>Nội dung khóa học <span>24 bài</span></button>
            <button role="tab" aria-selected={activeTab === 'reviews'} className={activeTab === 'reviews' ? 'active' : ''} onClick={() => selectTab('reviews', 'reviews')}>Đánh giá <span>1.248</span></button>
          </div>

          <div className="course-content-grid">
            <div className="course-content-column">
              <section id="overview" className="content-card outcomes-card">
                <div className="section-heading"><span className="section-icon">✓</span><div><h2>Bạn sẽ học được gì?</h2><p>Những kỹ năng thực tế sau khi hoàn thành khóa học</p></div></div>
                <ul>{courseDetail.outcomes.map((outcome) => <li key={outcome}><Icon>✓</Icon><span>{outcome}</span></li>)}</ul>
              </section>

              <section id="curriculum" className="curriculum-section">
                <div className="section-title-row"><div><h2>Chương trình đào tạo</h2><p>4 chương • 24 bài học • 18 giờ 30 phút</p></div><span>Cập nhật 09/2026</span></div>
                <div className="accordion-list">
                  {courseDetail.chapters.map((chapter, index) => (
                    <details className="chapter" open={index === 0} key={chapter.title}>
                      <summary><span className="chevron">⌄</span><span><strong>{chapter.title}</strong><small>{chapter.meta}</small></span>{!chapter.unlocked && <Icon className="lock">♙</Icon>}</summary>
                      {chapter.lessons && <div className="lesson-list">{chapter.lessons.map((lesson) => <div className="lesson" key={lesson.title}><Icon>{lesson.type === 'video' ? '▷' : lesson.type === 'document' ? '▤' : '?'}</Icon><span><strong>{lesson.title}</strong><small>{lesson.detail}</small></span>{lesson.preview ? <button type="button" onClick={previewLesson}>Học thử</button> : <Icon className="lock">♙</Icon>}</div>)}</div>}
                    </details>
                  ))}
                </div>
              </section>

              <section className="ai-features" aria-labelledby="ai-features-title">
                <div className="ai-features-heading"><span><Icon>✦</Icon></span><div><h2 id="ai-features-title">Đặc quyền với Lumina AI</h2><p>Hệ sinh thái thông minh giúp nâng cao hiệu suất học gấp 3 lần</p></div><em>PRO LEARNER</em></div>
                <div className="feature-grid"><article><Icon>◉</Icon><h3>Trợ giảng 24/7</h3><p>Giải thích khái niệm phức tạp ngay trong bài giảng.</p></article><article><Icon>⌘</Icon><h3>Mindmap & Flashcard</h3><p>Tự động cô đọng nội dung, giúp ghi nhớ dài hạn.</p></article><article><Icon>◎</Icon><h3>Quiz cá nhân hóa</h3><p>Nhận diện điểm yếu và tạo bài kiểm tra phù hợp.</p></article></div>
              </section>

              <section id="reviews" className="reviews-section">
                <div className="section-title-row"><div><h2>Đánh giá từ học viên</h2><p>Xác thực từ học viên đã hoàn thành khóa</p></div><strong className="review-score">★ 4.8</strong></div>
                <div className="review-grid"><article><div className="review-author"><span className="avatar">TL</span><span><strong>Trần Quốc Long</strong><small>Sinh viên Kỹ thuật Phần mềm</small></span><span className="stars">★★★★★</span></div><p>“Khóa học giải thích các khái niệm toán học trong AI rất dễ hiểu. Trợ giảng AI phản hồi bài tập code cực kỳ chi tiết.”</p></article><article><div className="review-author"><span className="avatar">HN</span><span><strong>Hoàng Yến Nhi</strong><small>Product Designer tại FinTech</small></span><span className="stars">★★★★☆</span></div><p>“Dù là người chuyển ngành, mình vẫn theo kịp các module thực hành Prompt và LLM. Slide rất trực quan và thực tế.”</p></article></div>
              </section>
            </div>

            <aside className="course-aside" aria-label="Thông tin hỗ trợ khóa học">
              <section className="aside-card schedule-card"><div className="aside-heading"><span className="section-icon purple">□</span><div><h2>Lịch học AI đề xuất</h2><p>Dựa trên thói quen của bạn</p></div></div><dl><div><dt>Tần suất học</dt><dd>3 buổi / tuần</dd></div><div><dt>Mỗi buổi</dt><dd>45 phút</dd></div><div><dt>Dự kiến hoàn thành</dt><dd>Sau 6 tuần</dd></div></dl><div className="skill-progress"><span><small>Năng lực AI dự kiến</small><strong>Beginner → Intermediate</strong></span><div><i /></div><p><span>Căn bản</span><span>Ứng dụng thực tế</span></p></div></section>
              <section className="aside-card requirements-card"><h2><Icon>✓</Icon>Yêu cầu đầu vào</h2><ul><li>Kiến thức toán phổ thông cơ bản.</li><li>Máy tính có kết nối Internet ổn định.</li><li>Tinh thần ham học hỏi công nghệ mới.</li></ul></section>
              <section className="aside-card certificate-card"><div className="certificate-top"><h2><Icon>◇</Icon>Chứng chỉ hoàn thành</h2><span>Được xác minh</span></div><div className="certificate-preview"><small>LUMINA ACADEMY</small><strong>Certificate of<br />AI Mastery</strong><span className="qr-pattern" aria-label="Mã QR minh họa" /></div><p>Chứng chỉ kỹ thuật số có mã xác thực, dễ dàng đính kèm CV và LinkedIn.</p></section>
              <section id="help" className="advisor-card"><Icon>◌</Icon><div><strong>Cần tư vấn thêm lộ trình?</strong><small>Lumina Advisor sẵn sàng hỗ trợ 24/7.</small><a href="mailto:advisor@lumina.example">Liên hệ tư vấn viên →</a></div></section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}

export default CourseDetailPage
