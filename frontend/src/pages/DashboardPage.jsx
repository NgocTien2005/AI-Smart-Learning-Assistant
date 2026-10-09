import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../app/SessionContext.jsx'
import { apiRequest } from '../services/api.js'
import { EmptyState, ErrorState, LoadingState, StatusMessage } from '../components/ui/Feedback.jsx'
import './LearningApp.css'

const initials = (name = '') => name.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase() || 'L'
const numericOrNull = (value) => Number.isFinite(value) ? value : null
const count = (value) => Number.isFinite(value) ? value : '—'

function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useSession()
  const isInstructor = user?.role === 'INSTRUCTOR'
  const [courses, setCourses] = useState([])
  const [form, setForm] = useState({ title: '', description: '', joinCode: '' })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [progressFilter, setProgressFilter] = useState('all')
  const [sort, setSort] = useState('recent')

  const loadCourses = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await apiRequest('/api/courses')
      setCourses(data.courses)
    } catch (error) {
      setLoadError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => loadCourses())
  }, [loadCourses])

  const visibleCourses = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase('vi')
    return [...courses].filter((course) => {
      const matchesText = !normalizedSearch || `${course.title} ${course.description || ''} ${course.instructor?.name || ''}`.toLocaleLowerCase('vi').includes(normalizedSearch)
      const lessons = numericOrNull(course._count?.lessons)
      const completed = numericOrNull(course.completedLessons)
      const matchesProgress = isInstructor || progressFilter === 'all'
        || (progressFilter === 'complete' && lessons !== null && completed !== null && lessons > 0 && completed >= lessons)
        || (progressFilter === 'progress' && completed !== null && lessons !== null && completed > 0 && completed < lessons)
        || (progressFilter === 'not-started' && completed === 0)
      return matchesText && matchesProgress
    }).sort((a, b) => sort === 'name'
      ? a.title.localeCompare(b.title, 'vi')
      : new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
  }, [courses, searchQuery, progressFilter, sort, isInstructor])

  const totals = useMemo(() => {
    const sum = (values) => values.every((value) => Number.isFinite(value)) ? values.reduce((total, value) => total + value, 0) : null
    return { lessons: sum(courses.map((course) => course._count?.lessons)), enrollments: sum(courses.map((course) => course._count?.enrollments)), completed: sum(courses.map((course) => course.completedLessons)) }
  }, [courses])

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      if (isInstructor) {
        const data = await apiRequest('/api/courses', { method: 'POST', body: JSON.stringify({ title: form.title.trim(), description: form.description.trim() }) })
        setCourses((current) => [data.course, ...current])
        setForm((current) => ({ ...current, title: '', description: '' }))
        setMessage({ type: 'success', text: `Đã tạo “${data.course.title}”. Mã tham gia: ${data.course.joinCode}` })
      } else {
        const data = await apiRequest('/api/courses/join', { method: 'POST', body: JSON.stringify({ joinCode: form.joinCode.trim().toUpperCase() }) })
        setCourses((current) => current.some(({ id }) => id === data.course.id) ? current.map((item) => item.id === data.course.id ? data.course : item) : [data.course, ...current])
        setForm((current) => ({ ...current, joinCode: '' }))
        setMessage({ type: 'success', text: `Đã tham gia “${data.course.title}”. Tiến độ hiện tại ${count(data.course.progressPercent)}%.` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  const continueLearning = async (courseId) => {
    try {
      const { course } = await apiRequest(`/api/courses/${courseId}`)
      const next = course.lessons.find((lesson) => !lesson.isCompleted)
      navigate(`/courses/${courseId}?section=lessons${next ? `&lessonId=${next.id}` : ''}`)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const copyJoinCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setMessage({ type: 'success', text: `Đã sao chép mã ${code}.` })
    } catch {
      setMessage({ type: 'warning', text: `Không thể sao chép tự động. Mã tham gia: ${code}` })
    }
  }

  return <main className="dashboard-main">
    <section className="dashboard-welcome"><div><span className="eyebrow">{isInstructor ? 'KHÔNG GIAN GIẢNG DẠY' : 'KHÔNG GIAN HỌC TẬP'}</span><h1>Xin chào, {user?.name || 'bạn'}.</h1><p>{isInstructor ? 'Quản lý khóa học, nội dung bài học và học viên.' : 'Tiếp tục bài học đang dang dở hoặc tham gia khóa học bằng mã mời.'}</p></div><span className="large-avatar">{initials(user?.name)}</span></section>

    <section className="dashboard-form-card"><div><h2>{isInstructor ? 'Tạo khóa học mới' : 'Tham gia khóa học'}</h2><p>{isInstructor ? 'Mã tham gia sẽ được tạo tự động.' : 'Mã gồm 8 ký tự do giảng viên cung cấp.'}</p></div><form onSubmit={submit}>
      {isInstructor ? <><label htmlFor="course-title">Tên khóa học<input id="course-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} minLength="3" maxLength="120" required /></label><label htmlFor="course-description">Mô tả<textarea id="course-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength="4000" rows="3" /></label></> : <label htmlFor="join-code">Mã tham gia<input id="join-code" className="code-input" value={form.joinCode} onChange={(event) => setForm({ ...form, joinCode: event.target.value.toUpperCase() })} minLength="8" maxLength="8" required /></label>}
      <button className="primary-button" disabled={submitting}>{submitting ? 'Đang xử lý…' : isInstructor ? 'Tạo khóa học' : 'Tham gia'}</button>
    </form>{message && <StatusMessage type={message.type}>{message.text}</StatusMessage>}</section>

    {!loading && !loadError && <section className="dashboard-totals" aria-label="Tổng quan khóa học"><article><strong>{courses.length}</strong><span>Khóa học</span></article><article><strong>{totals.lessons}</strong><span>Bài học</span></article><article><strong>{isInstructor ? totals.enrollments : totals.completed}</strong><span>{isInstructor ? 'Lượt ghi danh trên các khóa' : 'Bài học đã hoàn thành'}</span></article></section>}

    <section className="course-library"><div className="section-title"><div><span className="eyebrow">THƯ VIỆN</span><h2>{isInstructor ? 'Khóa học đang giảng dạy' : 'Khóa học của tôi'}</h2></div><span>{loading || loadError ? '' : `${visibleCourses.length}/${courses.length} khóa học`}</span></div>
      <div className="course-controls"><label className="course-filter"><span className="sr-only">Tìm khóa học</span><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm theo tên, mô tả hoặc giảng viên…" /></label>{isInstructor ? <label>Sắp xếp<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Cập nhật gần đây</option><option value="name">Tên A–Z</option></select></label> : <label>Tiến độ<select value={progressFilter} onChange={(event) => setProgressFilter(event.target.value)}><option value="all">Tất cả</option><option value="not-started">Chưa bắt đầu</option><option value="progress">Đang học</option><option value="complete">Hoàn thành</option></select></label>}</div>
      {loading ? <LoadingState>Đang tải khóa học…</LoadingState> : loadError ? <ErrorState>{loadError}<button type="button" className="ui-button ui-button-secondary" onClick={loadCourses}>Thử lại</button></ErrorState> : courses.length === 0 ? <EmptyState title="Chưa có khóa học nào">{isInstructor ? 'Tạo khóa học đầu tiên ở biểu mẫu phía trên.' : 'Nhập mã tham gia để khóa học xuất hiện tại đây.'}</EmptyState> : visibleCourses.length === 0 ? <EmptyState title="Không tìm thấy khóa học">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</EmptyState> : <div className="course-card-grid">{visibleCourses.map((course) => {
        const lessons = numericOrNull(course._count?.lessons)
        const enrollments = numericOrNull(course._count?.enrollments)
        const completed = numericOrNull(course.completedLessons)
        const progress = Number.isFinite(course.progressPercent) ? course.progressPercent : null
        return <article className="course-card" key={course.id}><Link className="course-card-main" to={`/courses/${course.id}`}><div className="course-card-cover"><span>{initials(course.title)}</span></div><div className="course-card-body"><small>{isInstructor ? 'KHÓA HỌC CỦA BẠN' : course.instructor?.name || 'Giảng viên'}</small><h3>{course.title}</h3><p>{course.description || 'Khóa học chưa có mô tả.'}</p><div className="course-card-meta"><span>{count(lessons)} bài học</span>{isInstructor && <span>{count(enrollments)} lượt tham gia</span>}</div>{!isInstructor && <div className="course-card-progress"><span>{completed}/{lessons} bài hoàn thành</span><span>{count(progress)}%</span><span className="course-card-progress-track"><span style={{ width: `${progress ?? 0}%` }} /></span></div>}</div></Link><div className="course-card-actions">{isInstructor ? <button type="button" onClick={() => copyJoinCode(course.joinCode)} disabled={!course.joinCode}>Sao chép mã tham gia</button> : <button type="button" onClick={() => continueLearning(course.id)}>Tiếp tục học</button>}</div></article>
      })}</div>}
    </section>
  </main>
}

export default DashboardPage
