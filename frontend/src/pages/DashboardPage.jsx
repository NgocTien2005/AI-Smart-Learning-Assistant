import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest, clearSession, getStoredUser } from '../services/api.js'
import './LearningApp.css'

const initials = (name = '') => name.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase() || 'L'

function DashboardPage() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const isInstructor = user?.role === 'INSTRUCTOR'
  const [courses, setCourses] = useState([])
  const [form, setForm] = useState({ title: '', description: '', joinCode: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('vi')
  const visibleCourses = normalizedSearch
    ? courses.filter((course) => `${course.title} ${course.description} ${course.instructor?.name || ''}`.toLocaleLowerCase('vi').includes(normalizedSearch))
    : courses

  useEffect(() => {
    let active = true
    apiRequest('/api/courses')
      .then((data) => {
        if (!active) return
        setCourses(data.courses)
        setMessage('')
      })
      .catch((error) => {
        if (!active) return
        setMessage(error.message)
        if (!getStoredUser()) navigate('/auth', { replace: true })
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [navigate])

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      if (isInstructor) {
        const data = await apiRequest('/api/courses', {
          method: 'POST',
          body: JSON.stringify({ title: form.title, description: form.description }),
        })
        setCourses((current) => [data.course, ...current])
        setForm({ ...form, title: '', description: '' })
        setMessage(`Đã tạo khóa học. Mã tham gia: ${data.course.joinCode}`)
      } else {
        const data = await apiRequest('/api/courses/join', {
          method: 'POST',
          body: JSON.stringify({ joinCode: form.joinCode }),
        })
        setCourses((current) => current.some(({ id }) => id === data.course.id) ? current : [data.course, ...current])
        setForm({ ...form, joinCode: '' })
        setMessage(`Đã tham gia “${data.course.title}”.`)
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const logout = () => {
    clearSession()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="learning-page">
      <header className="learning-header">
        <Link className="learning-brand" to="/dashboard"><span>L</span><strong>Lumina LMS</strong></Link>
        <nav><Link to="/demo">Khám phá giao diện mẫu</Link><button type="button" onClick={logout}>Đăng xuất</button></nav>
      </header>
      <main className="dashboard-main">
        <section className="dashboard-welcome">
          <div><span className="eyebrow">{isInstructor ? 'KHÔNG GIAN GIẢNG DẠY' : 'KHÔNG GIAN HỌC TẬP'}</span><h1>Xin chào, {user?.name || 'bạn'}.</h1><p>{isInstructor ? 'Tạo khóa học, thêm tài liệu và quản lý nội dung của bạn.' : 'Nhập mã mời từ giảng viên để bắt đầu học.'}</p></div>
          <span className="large-avatar">{initials(user?.name)}</span>
        </section>

        <section className="dashboard-form-card">
          <div><h2>{isInstructor ? 'Tạo khóa học mới' : 'Tham gia khóa học'}</h2><p>{isInstructor ? 'Mã tham gia sẽ được tạo tự động.' : 'Mã gồm 8 ký tự do giảng viên cung cấp.'}</p></div>
          <form onSubmit={submit}>
            {isInstructor ? <><label>Tên khóa học<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} minLength="3" maxLength="120" required /></label><label>Mô tả<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength="4000" rows="3" /></label></> : <label>Mã tham gia<input className="code-input" value={form.joinCode} onChange={(event) => setForm({ ...form, joinCode: event.target.value.toUpperCase() })} minLength="8" maxLength="8" required /></label>}
            <button className="primary-button" disabled={submitting}>{submitting ? 'Đang xử lý…' : isInstructor ? 'Tạo khóa học' : 'Tham gia'}</button>
          </form>
          {message && <p className="inline-message" role="status">{message}</p>}
        </section>

        <section className="course-library">
          <div className="section-title"><div><span className="eyebrow">THƯ VIỆN</span><h2>{isInstructor ? 'Khóa học đang giảng dạy' : 'Khóa học của tôi'}</h2></div><span>{courses.length} khóa học</span></div>
          {courses.length > 0 && <label className="course-filter"><span className="sr-only">Tìm khóa học</span><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm theo tên, mô tả hoặc giảng viên…" /></label>}
          {loading ? <p className="empty-state">Đang tải khóa học…</p> : courses.length === 0 ? <div className="empty-state"><strong>Chưa có khóa học nào</strong><span>{isInstructor ? 'Hãy tạo khóa học đầu tiên ở biểu mẫu phía trên.' : 'Nhập mã tham gia để khóa học xuất hiện tại đây.'}</span></div> : visibleCourses.length === 0 ? <div className="empty-state"><strong>Không tìm thấy khóa học</strong><span>Thử một từ khóa khác.</span></div> : <div className="course-card-grid">{visibleCourses.map((course) => <Link className="course-card" to={`/courses/${course.id}`} key={course.id}><div className="course-card-cover"><span>{initials(course.title)}</span></div><div className="course-card-body"><small>{isInstructor ? `Mã: ${course.joinCode}` : course.instructor.name}</small><h3>{course.title}</h3><p>{course.description || 'Khóa học chưa có mô tả.'}</p><div><span>{course._count.lessons} bài học</span><span>{course._count.enrollments} học viên</span></div></div></Link>)}</div>}
        </section>
      </main>
    </div>
  )
}

export default DashboardPage
