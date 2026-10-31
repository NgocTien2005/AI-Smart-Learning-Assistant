import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../app/SessionContext.jsx'
import { apiRequest } from '../services/api.js'
import CourseEntryDisclosure from '../components/CourseEntryDisclosure.jsx'
import { EmptyState, ErrorState, LoadingState, StatusMessage } from '../components/ui/Feedback.jsx'
import './LearningApp.css'
import './RoleDashboards.css'

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase() || 'L'
const numericOrNull = (value) => Number.isFinite(value) ? value : null
const count = (value) => Number.isFinite(value) ? value : '—'

function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useSession()
  const isInstructor = user?.role === 'INSTRUCTOR'
  const [courses, setCourses] = useState([])
  const [hasSnapshot, setHasSnapshot] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', joinCode: '' })
  const [formErrors, setFormErrors] = useState({})
  const [isEntryOpen, setEntryOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [opening, setOpening] = useState(null)
  const [copying, setCopying] = useState(null)
  const [message, setMessage] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [progressFilter, setProgressFilter] = useState('all')
  const [sort, setSort] = useState('recent')
  const mounted = useRef(false)
  const listRequest = useRef({ sequence: 0, controller: null })
  const openRequest = useRef({ sequence: 0, controller: null, id: null })
  const submitLock = useRef(false)
  const copyLock = useRef(false)
  const noticeRef = useRef(null)

  const invalidateList = useCallback(() => {
    listRequest.current.sequence += 1
    listRequest.current.controller?.abort()
  }, [])

  const loadCourses = useCallback(async () => {
    invalidateList()
    const sequence = listRequest.current.sequence
    const controller = new AbortController()
    listRequest.current.controller = controller
    setLoading(true)
    setLoadError('')
    try {
      const data = await apiRequest('/api/courses', { signal: controller.signal })
      if (!mounted.current || sequence !== listRequest.current.sequence) return
      setCourses(data.courses)
      setHasSnapshot(true)
    } catch (error) {
      if (mounted.current && sequence === listRequest.current.sequence && error.name !== 'AbortError') setLoadError(error.message)
    } finally {
      if (mounted.current && sequence === listRequest.current.sequence) setLoading(false)
    }
  }, [invalidateList])

  useEffect(() => {
    mounted.current = true
    const openingRequest = openRequest.current
    let active = true
    queueMicrotask(() => { if (active) loadCourses() })
    return () => {
      active = false
      mounted.current = false
      invalidateList()
      openingRequest.sequence += 1
      openingRequest.controller?.abort()
    }
  }, [loadCourses, invalidateList])

  useEffect(() => {
    if (message?.type === 'error') noticeRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [message])

  const visibleCourses = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('vi')
    return [...courses].filter((course) => {
      const text = (course.title + ' ' + (course.description || '') + ' ' + (course.instructor?.name || '')).toLocaleLowerCase('vi')
      const lessons = numericOrNull(course._count?.lessons)
      const completed = numericOrNull(course.completedLessons)
      return (!query || text.includes(query)) && (isInstructor || progressFilter === 'all'
        || (progressFilter === 'complete' && lessons !== null && completed !== null && lessons > 0 && completed >= lessons)
        || (progressFilter === 'progress' && completed !== null && lessons !== null && completed > 0 && completed < lessons)
        || (progressFilter === 'not-started' && completed === 0))
    }).sort((a, b) => sort === 'name' ? a.title.localeCompare(b.title, 'vi')
      : new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
  }, [courses, searchQuery, progressFilter, sort, isInstructor])

  const totals = useMemo(() => {
    const sum = (values) => values.every(Number.isFinite) ? values.reduce((total, value) => total + value, 0) : null
    return { lessons: sum(courses.map((course) => course._count?.lessons)), enrollments: sum(courses.map((course) => course._count?.enrollments)), completed: sum(courses.map((course) => course.completedLessons)) }
  }, [courses])

  const submit = async (event) => {
    event.preventDefault()
    if (submitLock.current) return
    const body = isInstructor ? { title: form.title.trim(), description: form.description.trim() } : { joinCode: form.joinCode.trim().toUpperCase() }
    const errors = {}
    if (isInstructor) {
      if (body.title.length < 3 || body.title.length > 120) errors.title = 'Tên khóa học cần từ 3 đến 120 ký tự.'
      if (body.description.length > 4000) errors.description = 'Mô tả tối đa 4.000 ký tự.'
    } else if (!/^[A-F0-9]{8}$/.test(body.joinCode)) errors.joinCode = 'Mã tham gia phải gồm 8 ký tự 0–9 hoặc A–F.'
    setFormErrors(errors)
    if (Object.keys(errors).length) {
      document.getElementById(errors.title ? 'course-title' : errors.description ? 'course-description' : 'join-code')?.focus()
      return
    }
    submitLock.current = true
    setSubmitting(true)
    setMessage(null)
    invalidateList()
    try {
      const data = await apiRequest(isInstructor ? '/api/courses' : '/api/courses/join', { method: 'POST', body: JSON.stringify(body) })
      if (!mounted.current) return
      setCourses((current) => [data.course, ...current.filter((course) => course.id !== data.course.id)])
      setForm({ title: '', description: '', joinCode: '' })
      setEntryOpen(false)
      setMessage({ type: 'success', text: isInstructor
        ? 'Đã tạo “' + data.course.title + '”. Mã tham gia: ' + data.course.joinCode
        : 'Đã tham gia “' + data.course.title + '”.' + (Number.isFinite(data.course.progressPercent) ? ' Tiến độ hiện tại ' + data.course.progressPercent + '%.' : '') })
    } catch (error) {
      if (mounted.current) setMessage({ type: 'error', text: error.message })
    } finally {
      submitLock.current = false
      if (mounted.current) {
        setSubmitting(false)
        // A canceled initial GET must recover even when the write fails.
        void loadCourses()
      }
    }
  }

  const continueLearning = async (courseId) => {
    if (openRequest.current.id === courseId) return
    openRequest.current.controller?.abort()
    const sequence = ++openRequest.current.sequence
    const controller = new AbortController()
    openRequest.current.controller = controller
    openRequest.current.id = courseId
    setOpening(courseId)
    setMessage(null)
    try {
      const { course } = await apiRequest('/api/courses/' + courseId, { signal: controller.signal })
      if (!mounted.current || sequence !== openRequest.current.sequence) return
      const next = course.lessons.find((lesson) => !lesson.isCompleted)
      navigate('/courses/' + courseId + '?section=lessons' + (next ? '&lessonId=' + next.id : ''))
    } catch (error) {
      if (mounted.current && sequence === openRequest.current.sequence && error.name !== 'AbortError') setMessage({ type: 'error', text: error.message, courseId })
    } finally {
      if (mounted.current && sequence === openRequest.current.sequence) {
        openRequest.current.id = null
        setOpening(null)
      }
    }
  }

  const copyJoinCode = async (code) => {
    if (copyLock.current) return
    copyLock.current = true
    setCopying(code)
    try {
      await navigator.clipboard.writeText(code)
      if (mounted.current) setMessage({ type: 'success', text: 'Đã sao chép mã ' + code + '.' })
    } catch {
      if (mounted.current) setMessage({ type: 'warning', text: 'Không thể sao chép tự động. Mã tham gia: ' + code })
    } finally {
      copyLock.current = false
      if (mounted.current) setCopying(null)
    }
  }

  return <main className={'dashboard-main role-dashboard role-dashboard--' + (isInstructor ? 'instructor' : 'student')}>
    <header className="role-dashboard-heading">
      <div><span className="eyebrow">{isInstructor ? 'KHÔNG GIAN GIẢNG DẠY' : 'KHÔNG GIAN HỌC TẬP'}</span>
        <h1>{isInstructor ? 'Khóa học đang giảng dạy' : 'Khóa học của tôi'}</h1>
        <p>{isInstructor ? 'Quản lý nội dung và học viên trong các khóa của bạn.' : 'Tìm khóa học và tiếp tục từ bài chưa hoàn thành.'}</p></div>
      <CourseEntryDisclosure open={isEntryOpen} onOpenChange={setEntryOpen} isInstructor={isInstructor} form={form}
        onChange={(name, value) => { setForm((current) => ({ ...current, [name]: value })); setFormErrors((current) => ({ ...current, [name]: '' })) }}
        errors={formErrors} submitting={submitting} onSubmit={submit} />
    </header>
    <div ref={noticeRef}>{message && <StatusMessage type={message.type}>{message.text}
      {message.courseId && <button type="button" className="ui-button ui-button-secondary" onClick={() => continueLearning(message.courseId)}>Thử lại</button>}
      {message.type === 'error' && !message.courseId && !isEntryOpen && <button type="button" className="ui-button ui-button-secondary" onClick={() => setEntryOpen(true)}>Mở lại biểu mẫu</button>}
    </StatusMessage>}</div>

    <section className="course-library" aria-label="Danh sách khóa học">
      <div className="section-title"><h2 className="sr-only">Danh sách khóa học</h2><span>{hasSnapshot ? visibleCourses.length + '/' + courses.length + ' khóa học' : ''}</span></div>
      <div className="course-controls">
        <label className="course-filter"><span>Tìm kiếm</span><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm khóa học…" /></label>
        {isInstructor ? <label>Sắp xếp<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Cập nhật gần đây</option><option value="name">Tên A–Z</option></select></label>
          : <label>Tiến độ<select value={progressFilter} onChange={(event) => setProgressFilter(event.target.value)}><option value="all">Tất cả</option><option value="not-started">Chưa bắt đầu</option><option value="progress">Đang học</option><option value="complete">Hoàn thành</option></select></label>}
      </div>
      {loadError && <ErrorState title={hasSnapshot ? 'Chưa làm mới được danh sách' : 'Không thể tải khóa học'} onRetry={loadCourses}>{loadError}{message?.type === 'success' ? ' Thao tác đã thành công; thử lại chỉ tải danh sách.' : ''}</ErrorState>}
      {loading && <LoadingState>{hasSnapshot ? 'Đang cập nhật danh sách…' : 'Đang tải khóa học…'}</LoadingState>}
      {hasSnapshot && <>{loadError && <p>Kết quả trước đó — chưa cập nhật.</p>}
        {courses.length === 0 ? <EmptyState title="Chưa có khóa học nào" action={<button type="button" className="ui-button ui-button-secondary" onClick={() => setEntryOpen(true)}>{isInstructor ? 'Tạo khóa học đầu tiên' : 'Nhập mã tham gia'}</button>}>{isInstructor ? 'Tạo khóa học đầu tiên để bắt đầu giảng dạy.' : 'Tham gia khóa học bằng mã giảng viên cung cấp.'}</EmptyState>
          : visibleCourses.length === 0 ? <EmptyState title="Không tìm thấy khóa học">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</EmptyState>
            : <div className="course-card-grid">{visibleCourses.map((course) => {
              const lessons = numericOrNull(course._count?.lessons)
              const completed = numericOrNull(course.completedLessons)
              const progress = numericOrNull(course.progressPercent)
              const safeProgress = progress === null ? null : Math.min(100, Math.max(0, progress))
              const hasProgress = lessons !== null && lessons > 0 && completed !== null && safeProgress !== null
              const hasNoLessons = lessons === 0
              const isComplete = lessons !== null && lessons > 0 && completed !== null && completed >= lessons
              const isInProgress = hasProgress && completed > 0 && !isComplete
              const description = typeof course.description === 'string' ? course.description.trim() : ''
              const actionPath = '/courses/' + course.id
              return <article className="course-card" key={course.id}>
                <div className="course-card-body">
                  <div className="course-card-identity"><span className="course-card-mark" aria-hidden="true">{initials(course.title)}</span><span className="course-card-instructor">{isInstructor ? 'Khóa học của bạn' : course.instructor?.name || 'Giảng viên'}</span></div>
                  <h3><Link className="course-card-title" title={course.title} to={actionPath}>{course.title}</Link></h3>
                  <p>{description && description !== '...' && description !== '…' ? description : 'Chưa có mô tả.'}</p>
                  <div className="course-card-meta"><span>{count(lessons)} bài học</span>{isInstructor && <span>{count(course._count?.enrollments)} học viên đang tham gia</span>}</div>
                  {!isInstructor && (hasNoLessons ? <div className="course-card-empty-progress"><strong>Chưa có bài học</strong><span>Giảng viên chưa đăng nội dung</span></div>
                    : hasProgress ? <div className="course-card-progress"><div className="course-card-progress-label"><span>{isComplete ? 'Đã hoàn thành' : isInProgress ? 'Đang học' : 'Chưa bắt đầu'}</span><strong>{safeProgress}%</strong></div>
                      <div className="course-card-progress-track" role="progressbar" aria-label={'Tiến độ ' + course.title} aria-valuemin="0" aria-valuemax="100" aria-valuenow={safeProgress}><span style={{ width: safeProgress + '%' }} /></div></div>
                      : <div className="course-card-progress-unavailable">Tiến độ chưa có dữ liệu</div>)}
                </div>
                <div className="course-card-actions">{isInstructor
                  ? <><Link className="ui-button ui-button-primary course-card-action" to={actionPath + '?section=overview'}>Quản lý khóa học</Link><button className="ui-button ui-button-secondary course-card-action-secondary" type="button" onClick={() => copyJoinCode(course.joinCode)} disabled={!course.joinCode || copying !== null}>{copying === course.joinCode ? 'Đang sao chép…' : 'Sao chép mã tham gia'}</button></>
                  : hasNoLessons || !hasProgress ? <Link className="ui-button ui-button-primary course-card-action" to={actionPath}>Xem khóa học</Link>
                    : isComplete ? <Link className="ui-button ui-button-primary course-card-action" to={actionPath + '?section=lessons'}>Ôn tập lại</Link>
                      : <button className="ui-button ui-button-primary course-card-action" type="button" disabled={opening === course.id} aria-busy={opening === course.id} onClick={() => continueLearning(course.id)}>{opening === course.id ? 'Đang mở…' : isInProgress ? 'Tiếp tục học' : 'Bắt đầu học'}</button>}
                </div>
              </article>
            })}</div>}
      </>}
    </section>
    {hasSnapshot && <section className="dashboard-totals" aria-label="Tổng quan khóa học">
      <article><strong>{courses.length}</strong><span>Khóa học</span></article>
      <article><strong>{totals.lessons === null ? 'Chưa có dữ liệu' : totals.lessons}</strong><span>Bài học</span></article>
      <article><strong>{(isInstructor ? totals.enrollments : totals.completed) === null ? 'Chưa có dữ liệu' : isInstructor ? totals.enrollments : totals.completed}</strong><span>{isInstructor ? 'Lượt ghi danh trên các khóa' : 'Bài học đã hoàn thành'}</span></article>
    </section>}
  </main>
}
export default DashboardPage
