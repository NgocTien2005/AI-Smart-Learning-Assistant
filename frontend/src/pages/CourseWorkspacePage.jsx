import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import AssignmentsPanel from '../components/AssignmentsPanel.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import DocumentAssistantPanel from '../components/DocumentAssistantPanel.jsx'
import DocumentPreview, { DocumentSelection, validateDocumentFile } from '../components/DocumentPreview.jsx'
import PracticeQuizPanel from '../components/PracticeQuizPanel.jsx'
import { EmptyState, ErrorState, LoadingState, StatusMessage } from '../components/ui/Feedback.jsx'
import { useSession } from '../app/SessionContext.jsx'
import { apiRequest, downloadDocument } from '../services/api.js'
import './LearningApp.css'

const sectionNames = { overview: 'Tổng quan', lessons: 'Bài học', assignments: 'Bài tập', students: 'Học viên', settings: 'Cài đặt' }
const sortLessons = (lessons) => [...lessons].sort((a, b) => a.order - b.order || new Date(a.createdAt) - new Date(b.createdAt))

function CourseWorkspacePage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useSession()
  const isInstructor = user?.role === 'INSTRUCTOR'
  const [params, setParams] = useSearchParams()
  const section = params.get('section') || 'overview'
  const selectedLessonId = Number(params.get('lessonId')) || null
  const activePanel = params.get('panel')
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState(null)
  const [operationPending, setOperationPending] = useState({})
  const [confirm, setConfirm] = useState(null)
  const [lessonSearch, setLessonSearch] = useState('')
  const [lessonFilter, setLessonFilter] = useState('all')
  const [courseDraft, setCourseDraft] = useState({ title: '', description: '' })
  const [lessonDraft, setLessonDraft] = useState({ title: '', content: '', order: '0', file: null, fileError: '' })
  const [editingLesson, setEditingLesson] = useState(null)
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState('')
  const [previewLesson, setPreviewLesson] = useState(null)
  const [uploadStates, setUploadStates] = useState({})
  const guard = useRef(0)
  const quizFlushRef = useRef(null)
  const [studentReload, setStudentReload] = useState(0)

  const loadCourse = useCallback(async () => {
    const request = ++guard.current
    setLoading(true)
    setLoadError('')
    try {
      const data = await apiRequest(`/api/courses/${courseId}`)
      if (guard.current !== request) return
      const nextCourse = { ...data.course, lessons: sortLessons(data.course.lessons) }
      setCourse(nextCourse)
      setCourseDraft({ title: nextCourse.title, description: nextCourse.description || '' })
    } catch (error) {
      if (guard.current === request) setLoadError(error.message)
    } finally {
      if (guard.current === request) setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    queueMicrotask(loadCourse)
    return () => { guard.current += 1 }
  }, [loadCourse])

  const safelyNavigateFromQuiz = async (action) => {
    if (params.get('panel') !== 'quiz' || !quizFlushRef.current) { action(); return }
    if (await quizFlushRef.current()) { action(); return }
    setConfirm({ title: 'Bản nháp chưa lưu', message: 'Không thể lưu câu trả lời mới nhất. Bạn có thể ở lại để thử lại hoặc rời trang và bỏ thay đổi chưa lưu.', confirmLabel: 'Rời trang và bỏ thay đổi', onConfirm: () => { quizFlushRef.current = null; action() } })
  }

  const changeSection = (nextSection) => safelyNavigateFromQuiz(() => setParams((current) => {
    const next = new URLSearchParams(current)
    next.set('section', nextSection)
    next.delete('panel')
    if (nextSection !== 'lessons') next.delete('lessonId')
    return next
  }))

  const selectLesson = (lessonId) => safelyNavigateFromQuiz(() => setParams((current) => {
    const next = new URLSearchParams(current)
    next.set('section', 'lessons')
    next.set('lessonId', String(lessonId))
    next.delete('panel')
    return next
  }))

  const openLessonPanel = (panel) => safelyNavigateFromQuiz(() => setParams((current) => {
    const next = new URLSearchParams(current)
    next.set('section', 'lessons')
    if (selectedLessonId) next.set('lessonId', String(selectedLessonId))
    next.set('panel', panel)
    return next
  }))

  const closeLessonPanel = () => setParams((current) => {
    const next = new URLSearchParams(current)
    next.delete('panel')
    return next
  })

  useEffect(() => {
    if (section !== 'students' || !isInstructor) return undefined
    const controller = new AbortController()
    let active = true
    queueMicrotask(async () => {
      if (!active) return
      setStudentsLoading(true)
      setStudentsError('')
      try {
        const data = await apiRequest(`/api/courses/${courseId}/students`, { signal: controller.signal })
        if (active) setStudents(data.students)
      } catch (error) {
        if (active && error.name !== 'AbortError') setStudentsError(error.message)
      } finally {
        if (active) setStudentsLoading(false)
      }
    })
    return () => { active = false; controller.abort() }
  }, [section, courseId, isInstructor, studentReload])

  const setPending = (key, value) => setOperationPending((current) => ({ ...current, [key]: value }))
  const updateCourseState = (updater) => setCourse((current) => current ? updater(current) : current)
  const selectedLesson = course?.lessons.find((lesson) => lesson.id === selectedLessonId) || null
  const visibleLessons = useMemo(() => {
    const query = lessonSearch.trim().toLocaleLowerCase('vi')
    return (course?.lessons || []).filter((lesson) => {
      const matchesSearch = !query || `${lesson.title} ${lesson.content || ''}`.toLocaleLowerCase('vi').includes(query)
      const matchesFilter = isInstructor || lessonFilter === 'all'
        || (lessonFilter === 'complete' && lesson.isCompleted)
        || (lessonFilter === 'incomplete' && !lesson.isCompleted)
      return matchesSearch && matchesFilter
    })
  }, [course, lessonSearch, lessonFilter, isInstructor])
  const completedLessons = course?.lessons.filter((lesson) => lesson.isCompleted).length || 0
  const progressPercent = course?.lessons.length ? Math.round(completedLessons / course.lessons.length * 100) : 0
  const currentLessonIndex = selectedLesson ? course.lessons.findIndex(({ id }) => id === selectedLesson.id) : -1
  const previousLesson = currentLessonIndex > 0 ? course.lessons[currentLessonIndex - 1] : null
  const nextLesson = currentLessonIndex >= 0 ? course.lessons[currentLessonIndex + 1] : null

  const updateCourse = async (event) => {
    event.preventDefault()
    const key = 'course:update'
    setPending(key, true)
    setNotice(null)
    try {
      const data = await apiRequest(`/api/courses/${courseId}`, { method: 'PATCH', body: JSON.stringify({ title: courseDraft.title.trim(), description: courseDraft.description.trim() }) })
      updateCourseState((current) => ({ ...current, ...data.course }))
      setNotice({ type: 'success', text: 'Đã cập nhật thông tin khóa học.' })
    } catch (error) { setNotice({ type: 'error', text: error.message }) }
    finally { setPending(key, false) }
  }

  const chooseDocument = (event) => {
    const file = event.target.files?.[0] || null
    const fileError = file ? validateDocumentFile(file) : ''
    setLessonDraft((current) => ({ ...current, file: fileError ? null : file, fileError }))
    if (fileError) event.target.value = ''
  }

  const createLesson = async (event) => {
    event.preventDefault()
    if (!lessonDraft.content.trim() && !lessonDraft.file) {
      setLessonDraft((current) => ({ ...current, fileError: 'Nhập nội dung hoặc chọn tài liệu.' }))
      return
    }
    const body = new FormData()
    body.set('title', lessonDraft.title.trim())
    body.set('content', lessonDraft.content)
    body.set('order', String(lessonDraft.order))
    if (lessonDraft.file) body.set('document', lessonDraft.file)
    setPending('lesson:create', true)
    setNotice(null)
    try {
      const data = await apiRequest(`/api/courses/${courseId}/lessons`, { method: 'POST', body })
      updateCourseState((current) => ({ ...current, lessons: sortLessons([...current.lessons, data.lesson]) }))
      setLessonDraft({ title: '', content: '', order: String(course.lessons.length + 1), file: null, fileError: '' })
      setNotice({ type: 'success', text: 'Đã thêm bài học.' })
    } catch (error) { setNotice({ type: 'error', text: error.message }) }
    finally { setPending('lesson:create', false) }
  }

  const saveLesson = async (event) => {
    event.preventDefault()
    if (!editingLesson) return
    setPending(`lesson:save:${editingLesson.id}`, true)
    setNotice(null)
    try {
      const data = await apiRequest(`/api/courses/lessons/${editingLesson.id}`, { method: 'PATCH', body: JSON.stringify({ title: editingLesson.title.trim(), content: editingLesson.content, order: Number(editingLesson.order) }) })
      updateCourseState((current) => ({ ...current, lessons: sortLessons(current.lessons.map((lesson) => lesson.id === data.lesson.id ? data.lesson : lesson)) }))
      setEditingLesson(null)
      setNotice({ type: 'success', text: 'Đã cập nhật bài học.' })
    } catch (error) { setNotice({ type: 'error', text: error.message }) }
    finally { setPending(`lesson:save:${editingLesson.id}`, false) }
  }

  const replaceDocument = async (lesson, event) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return
    const fileError = validateDocumentFile(file)
    if (fileError) {
      setUploadStates((current) => ({ ...current, [lesson.id]: { file: null, error: fileError, status: 'error' } }))
      input.value = ''
      return
    }
    setUploadStates((current) => ({ ...current, [lesson.id]: { file, error: '', status: 'ready' } }))
    const body = new FormData()
    body.set('document', file)
    setPending(`document:${lesson.id}`, true)
    setUploadStates((current) => ({ ...current, [lesson.id]: { file, error: '', status: 'uploading' } }))
    try {
      const data = await apiRequest(`/api/courses/lessons/${lesson.id}/document`, { method: 'PATCH', body })
      updateCourseState((current) => ({ ...current, lessons: current.lessons.map((item) => item.id === lesson.id ? data.lesson : item) }))
      setUploadStates((current) => ({ ...current, [lesson.id]: { file: null, error: '', status: 'complete' } }))
      setNotice({ type: 'success', text: `Đã tải lên ${file.name}.` })
    } catch (error) {
      setUploadStates((current) => ({ ...current, [lesson.id]: { file, error: error.message, status: 'error' } }))
      setNotice({ type: 'error', text: error.message })
    } finally { input.value = ''; setPending(`document:${lesson.id}`, false) }
  }

  const retryDocument = (lesson) => {
    const state = uploadStates[lesson.id]
    if (!state?.file) return
    const form = new FormData()
    form.set('document', state.file)
    setPending(`document:${lesson.id}`, true)
    setUploadStates((current) => ({ ...current, [lesson.id]: { ...state, status: 'uploading', error: '' } }))
    apiRequest(`/api/courses/lessons/${lesson.id}/document`, { method: 'PATCH', body: form }).then(({ lesson: updated }) => {
      updateCourseState((current) => ({ ...current, lessons: current.lessons.map((item) => item.id === lesson.id ? updated : item) }))
      setUploadStates((current) => ({ ...current, [lesson.id]: { file: null, status: 'complete', error: '' } }))
      setNotice({ type: 'success', text: `Đã tải lên ${state.file.name}.` })
    }).catch((error) => {
      setUploadStates((current) => ({ ...current, [lesson.id]: { ...state, status: 'error', error: error.message } }))
    }).finally(() => setPending(`document:${lesson.id}`, false))
  }

  const removeDocument = async (lesson) => {
    setPending(`document-remove:${lesson.id}`, true)
    try {
      const data = await apiRequest(`/api/courses/lessons/${lesson.id}/document`, { method: 'DELETE' })
      updateCourseState((current) => ({ ...current, lessons: current.lessons.map((item) => item.id === lesson.id ? data.lesson : item) }))
      setPreviewLesson(null)
      setNotice({ type: 'success', text: 'Đã gỡ tài liệu.' })
    } catch (error) { setNotice({ type: 'error', text: error.message }) }
    finally { setPending(`document-remove:${lesson.id}`, false) }
  }

  const toggleProgress = async (lesson) => {
    const key = `progress:${lesson.id}`
    setPending(key, true)
    try {
      const completed = !lesson.isCompleted
      const data = await apiRequest(`/api/courses/lessons/${lesson.id}/progress`, { method: completed ? 'PUT' : 'DELETE' })
      updateCourseState((current) => ({ ...current, lessons: current.lessons.map((item) => item.id === lesson.id ? { ...item, isCompleted: data.isCompleted, completedAt: data.completedAt } : item) }))
      setNotice({ type: 'success', text: completed ? 'Đã đánh dấu hoàn thành.' : 'Đã bỏ trạng thái hoàn thành.' })
    } catch (error) { setNotice({ type: 'error', text: error.message }) }
    finally { setPending(key, false) }
  }

  const deleteLesson = async (lesson) => {
    setPending(`lesson:delete:${lesson.id}`, true)
    try {
      await apiRequest(`/api/courses/lessons/${lesson.id}`, { method: 'DELETE' })
      updateCourseState((current) => ({ ...current, lessons: current.lessons.filter(({ id }) => id !== lesson.id) }))
      if (selectedLessonId === lesson.id || previewLesson?.id === lesson.id) setParams((current) => { const next = new URLSearchParams(current); next.delete('lessonId'); next.delete('panel'); return next })
      setPreviewLesson(null)
      setEditingLesson(null)
      setNotice({ type: 'success', text: 'Đã xóa bài học và  lịch sử liên quan.' })
    } catch (error) { setNotice({ type: 'error', text: error.message }) }
    finally { setPending(`lesson:delete:${lesson.id}`, false) }
  }

  const saveCourse = async (event) => updateCourse(event)
  const deleteCourse = async () => {
    setPending('course:delete', true)
    try { await apiRequest(`/api/courses/${courseId}`, { method: 'DELETE' }); navigate('/dashboard', { replace: true }) }
    catch (error) { setNotice({ type: 'error', text: error.message }) }
    finally { setPending('course:delete', false) }
  }

  const leaveCourse = async () => {
    setPending('course:leave', true)
    try { await apiRequest(`/api/courses/${courseId}/enrollment`, { method: 'DELETE' }); navigate('/dashboard', { replace: true }) }
    catch (error) { setNotice({ type: 'error', text: error.message }) }
    finally { setPending('course:leave', false) }
  }

  const download = async (lesson) => {
    setPending(`document-download:${lesson.id}`, true)
    try { await downloadDocument(lesson.id, lesson.documentName) }
    catch (error) { setNotice({ type: 'error', text: error.message }) }
    finally { setPending(`document-download:${lesson.id}`, false) }
  }

  const askToConfirm = (title, message, onConfirm, danger = false, confirmLabel = 'Xác nhận') => setConfirm({ title, message, onConfirm, danger, confirmLabel })

  const copyJoinCode = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API không khả dụng.')
      await navigator.clipboard.writeText(course.joinCode)
      setNotice({ type: 'success', text: 'Đã sao chép mã tham gia.' })
    } catch {
      setNotice({ type: 'warning', text: `Không thể sao chép tự động. Mã tham gia: ${course.joinCode}` })
    }
  }

  if (loading) return <main className="workspace-main"><LoadingState>Đang tải khóa học…</LoadingState></main>
  if (loadError || !course) return <main className="workspace-main"><ErrorState title="Không thể mở khóa học" onRetry={loadCourse}>{loadError}</ErrorState><Link to="/dashboard">Quay lại trang tổng quan</Link></main>

  const availableSections = isInstructor ? ['overview', 'lessons', 'assignments', 'students', 'settings'] : ['overview', 'lessons', 'assignments']
  const lessonList = course.lessons.length > 0 ? <div className="lesson-browser"><aside className="lesson-browser-list" aria-label="Danh sách bài học">
    <label htmlFor="lesson-search">Tìm bài học<input id="lesson-search" type="search" value={lessonSearch} onChange={(event) => setLessonSearch(event.target.value)} placeholder="Tìm theo tiêu đề hoặc nội dung…" /></label>
    {!isInstructor && <label htmlFor="lesson-filter">Trạng thái<select id="lesson-filter" value={lessonFilter} onChange={(event) => setLessonFilter(event.target.value)}><option value="all">Tất cả bài</option><option value="incomplete">Chưa hoàn thành</option><option value="complete">Đã hoàn thành</option></select></label>}
    {visibleLessons.length === 0 ? <EmptyState title="Không có bài học phù hợp">Thử từ khóa hoặc bộ lọc khác.</EmptyState> : visibleLessons.map((lesson, index) => <button className={`lesson-list-item ${selectedLesson?.id === lesson.id ? 'selected' : ''}`} type="button" key={lesson.id} onClick={() => selectLesson(lesson.id)}><span>{String(index + 1).padStart(2, '0')}</span><span><strong>{lesson.title}</strong><small>{!isInstructor && lesson.isCompleted ? 'Đã hoàn thành' : lesson.documentName ? 'Có tài liệu' : 'Bài học'}</small></span></button>)}
  </aside>
  <div className="lesson-reader-column">{!selectedLesson ? <EmptyState title="Chọn một bài học">Chọn bài học trong danh sách để đọc nội dung và  mở các công cụ học tập.</EmptyState> : <article className="lesson-reader"><header><div><span className="eyebrow">BÀI {currentLessonIndex + 1}/{course.lessons.length}</span><h2>{selectedLesson.title}</h2></div><div className="reader-navigation"><button type="button" disabled={!previousLesson} onClick={() => previousLesson && selectLesson(previousLesson.id)}>← Bài trước</button><button type="button" disabled={!nextLesson} onClick={() => nextLesson && selectLesson(nextLesson.id)}>Bài tiếp →</button></div></header>
    {selectedLesson.content ? <div className="lesson-reading-content">{selectedLesson.content}</div> : <EmptyState title="Chưa có nội dung nhập trực tiếp">Mở tài liệu đính kèm nếu có, hoặc hỏi giảng viên về nội dung bài học.</EmptyState>}
    {!isInstructor && <StatusMessage type={selectedLesson.isCompleted ? 'success' : 'info'}>{selectedLesson.isCompleted ? `Đã hoàn thành${selectedLesson.completedAt ? ` · ${new Date(selectedLesson.completedAt).toLocaleString('vi-VN')} (giờ địa phương)` : ''}` : 'Bài học chưa được đánh dấu hoàn thành.'}</StatusMessage>}
    <div className="lesson-reader-actions">{!isInstructor && <button className="ui-button ui-button-secondary" type="button" disabled={operationPending[`progress:${selectedLesson.id}`]} onClick={() => toggleProgress(selectedLesson)}>{selectedLesson.isCompleted ? 'Bỏ hoàn thành' : 'Đánh dấu hoàn thành'}</button>}{selectedLesson.documentName && <><button type="button" className="ui-button ui-button-secondary" onClick={() => setPreviewLesson(selectedLesson)}>Xem tài liệu</button><button type="button" className="ui-button ui-button-secondary" disabled={operationPending[`document-download:${selectedLesson.id}`]} onClick={() => download(selectedLesson)}>{operationPending[`document-download:${selectedLesson.id}`] ? 'Đang tải…' : 'Tải xuống'}</button></>}<button type="button" className="ui-button ui-button-primary" onClick={() => openLessonPanel('quiz')}>Ôn tập nhanh</button><button type="button" className="ui-button ui-button-secondary" onClick={() => openLessonPanel('assistant')}>Tra cứu tài liệu</button></div>
    {previewLesson?.id === selectedLesson.id && <DocumentPreview lesson={selectedLesson} onClose={() => setPreviewLesson(null)} />}
    {activePanel === 'quiz' && <PracticeQuizPanel key={`${courseId}-${selectedLesson.id}`} lesson={selectedLesson} onClose={closeLessonPanel} onRegisterBeforeLeave={(flush) => { quizFlushRef.current = flush }} />}
    {activePanel === 'assistant' && <DocumentAssistantPanel key={`${courseId}-${selectedLesson.id}`} lesson={selectedLesson} onClose={closeLessonPanel} />}
  </article>}</div></div> : <EmptyState title="Chưa có bài học">{isInstructor ? 'Thêm bài học ngay trong phần này để bắt đầu.' : 'Giảng viên chưa đăng bài học nào.'}</EmptyState>

  return <main className="workspace-main">
    <header className="course-header">
      <div className="course-header-copy"><span className="course-context">{isInstructor ? 'KHÓA HỌC ĐANG GIẢNG DẠY' : `GIẢNG VIÊN · ${course.instructor?.name || '—'}`}</span><h1>{course.title}</h1><p>{course.description || 'Khóa học chưa có mô tả.'}</p></div>
      <div className="course-header-actions">
        {isInstructor && section !== 'lessons' && <button className="ui-button ui-button-primary" type="button" onClick={() => changeSection('lessons')}>Thêm bài học</button>}
        {!isInstructor && course.lessons.length > 0 && <button className="ui-button ui-button-primary" type="button" onClick={() => { const next = course.lessons.find((lesson) => !lesson.isCompleted) || course.lessons[0]; selectLesson(next.id) }}>{completedLessons < course.lessons.length ? 'Tiếp tục học' : 'Xem lại bài học'}</button>}
        {!isInstructor && <button className="ui-button ui-button-secondary" type="button" disabled={operationPending['course:leave']} onClick={() => askToConfirm('Rời khóa học?', 'Bạn sẽ mất quyền mở bài học, tài liệu và bài ôn cho đến khi tham gia lại. Tiến độ và lịch sử hiện có được giữ theo dữ liệu khóa học.', leaveCourse, true, 'Rời khóa học')}>Rời khóa học</button>}
      </div>
      <div className="course-header-meta"><span><strong>{course.lessons.length}</strong> bài học</span>{isInstructor ? <span><strong>{course._count?.enrollments ?? '—'}</strong> học viên đang tham gia</span> : <span><strong>{course.assignments.length}</strong> bài tập</span>}{isInstructor && <div className="course-join-code"><span>Mã tham gia <strong>{course.joinCode}</strong></span><button className="ui-button ui-button-secondary" type="button" onClick={copyJoinCode}>Sao chép mã</button></div>}</div>
      {!isInstructor && <div className="course-progress"><div><span>Tiến độ học tập</span><strong>{completedLessons}/{course.lessons.length} bài · {progressPercent}%</strong></div><div className="course-progress-track" role="progressbar" aria-label="Tiến độ khóa học" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressPercent}><span style={{ width: `${progressPercent}%` }} /></div></div>}
    </header>
    {notice && <StatusMessage type={notice.type} onDismiss={() => setNotice(null)}>{notice.text}</StatusMessage>}
    <nav className="workspace-tabs" aria-label="Các phần trong khóa học">{availableSections.map((key) => <Link to={`?section=${key}`} key={key} className={section === key ? 'active' : ''} aria-current={section === key ? 'page' : undefined} onClick={(event) => { event.preventDefault(); changeSection(key) }}>{sectionNames[key]}</Link>)}</nav>
    {section === 'overview' && <section className="course-overview"><div className="course-overview-heading"><div><span className="eyebrow">TỔNG QUAN</span><h2>{isInstructor ? 'Tình hình khóa học' : 'Tiến độ khóa học'}</h2></div><p>{isInstructor ? 'Quản lý nội dung và người học trong một nơi.' : 'Theo dõi bài học và bài tập của bạn.'}</p></div><div className="overview-grid"><button className="course-stat-card" type="button" onClick={() => changeSection('lessons')}><span className="course-stat-label">Bài học</span><strong>{course.lessons.length}</strong><small>Mở nội dung và học liệu</small></button><button className="course-stat-card" type="button" onClick={() => changeSection('assignments')}><span className="course-stat-label">Bài tập</span><strong>{course.assignments.length}</strong><small>{isInstructor ? 'Quản lý bài tập và bài nộp' : 'Xem yêu cầu và bài đã nộp'}</small></button>{isInstructor ? <button className="course-stat-card" type="button" onClick={() => changeSection('students')}><span className="course-stat-label">Học viên đang tham gia</span><strong>{course._count?.enrollments ?? '—'}</strong><small>Mở danh sách học viên</small></button> : <article className="course-stat-card course-progress-card"><span className="course-stat-label">Bài học đã hoàn thành</span><strong>{progressPercent}%</strong><small>{completedLessons} trên {course.lessons.length} bài học</small><div className="course-progress-track" role="progressbar" aria-label="Tiến độ khóa học" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressPercent}><span style={{ width: `${progressPercent}%` }} /></div></article>}</div>{isInstructor && course.lessons.length === 0 && <EmptyState title="Bắt đầu xây dựng khóa học">Thêm bài học đầu tiên để học viên có thể bắt đầu học. Dùng nút “Thêm bài học” phía trên để tạo nội dung đầu tiên.</EmptyState>}</section>}
    {section === 'lessons' && <section className="course-section"><div className="section-title"><div><span className="eyebrow">NỘI DUNG KHÓA HỌC</span><h2>Bài học</h2></div><span>{course.lessons.length} bài</span></div>{isInstructor && <section className="management-card lesson-create-card"><h3>Thêm bài học</h3><p>Thêm nội dung hoặc tài liệu để học viên có thể học theo thứ tự.</p><form onSubmit={createLesson}><div className="lesson-create-fields"><label htmlFor="lesson-title">Tiêu đề<input id="lesson-title" value={lessonDraft.title} onChange={(event) => setLessonDraft({ ...lessonDraft, title: event.target.value })} minLength="2" maxLength="160" required /></label><label htmlFor="lesson-order">Thứ tự<input id="lesson-order" type="number" min="0" max="10000" value={lessonDraft.order} onChange={(event) => setLessonDraft({ ...lessonDraft, order: event.target.value })} /></label></div><label htmlFor="lesson-content">Nội dung<textarea id="lesson-content" value={lessonDraft.content} onChange={(event) => setLessonDraft({ ...lessonDraft, content: event.target.value })} maxLength="100000" rows="4" /></label><DocumentSelection file={lessonDraft.file} error={lessonDraft.fileError} onChange={chooseDocument} onRemove={() => setLessonDraft({ ...lessonDraft, file: null, fileError: '' })} disabled={operationPending['lesson:create']} /><small>PDF có thể xem và tải; Lumina không trích xuất văn bản PDF. TXT, Markdown và CSV được dùng nếu backend nhận diện được kiểu tệp. Giới hạn 10 MiB.</small><button className="ui-button ui-button-primary" disabled={operationPending['lesson:create']}>{operationPending['lesson:create'] ? 'Đang tải lên…' : 'Thêm bài học'}</button></form></section>}{lessonList}</section>}
    {section === 'assignments' && <AssignmentsPanel key={courseId} course={course} isInstructor={isInstructor} onAssignmentsChange={(assignments) => updateCourseState((current) => ({ ...current, assignments }))} onNotice={(text, type = 'info') => setNotice({ text, type })} onRefresh={loadCourse} />}
    {section === 'students' && isInstructor && <section className="management-card roster-card"><div className="section-title"><div><span className="eyebrow">HỌC VIÊN</span><h2>Danh sách tham gia</h2></div><span>{studentsLoading ? 'Đang tải…' : studentsError ? '' : `${students.length} học viên`}</span></div>{studentsError ? <ErrorState onRetry={() => setStudentReload((value) => value + 1)}>{studentsError}</ErrorState> : studentsLoading ? <LoadingState>Đang tải danh sách học viên…</LoadingState> : students.length === 0 ? <EmptyState title="Chưa có học viên">Chia sẻ mã tham gia {course.joinCode} để học viên tham gia khóa học.</EmptyState> : <ul>{students.map((student) => <li key={student.id}><span className="student-avatar">{student.name?.slice(0, 1).toUpperCase() || '?'}</span><span><strong>{student.name}</strong><small className="break-long">{student.email}</small><small>Hoàn thành {student.completedLessons}/{student.totalLessons} bài ({student.progressPercent}%)</small></span><time dateTime={student.enrolledAt}>{new Date(student.enrolledAt).toLocaleString('vi-VN', { dateStyle: 'medium' })} (giờ địa phương)</time></li>)}</ul>}</section>}
    {section === 'settings' && isInstructor && <section className="course-settings"><section className="management-card"><h2>Thông tin khóa học</h2><form onSubmit={saveCourse}><label htmlFor="course-edit-title">Tên khóa học<input id="course-edit-title" value={courseDraft.title} onChange={(event) => setCourseDraft({ ...courseDraft, title: event.target.value })} minLength="3" maxLength="120" required /></label><label htmlFor="course-edit-description">Mô tả<textarea id="course-edit-description" value={courseDraft.description} onChange={(event) => setCourseDraft({ ...courseDraft, description: event.target.value })} maxLength="4000" rows="4" /></label><button className="primary-button" disabled={operationPending['course:update']}>{operationPending['course:update'] ? 'Đang lưu…' : 'Lưu thay đổi'}</button></form></section>
      <section className="management-card"><h2>Quản lý bài học</h2>{course.lessons.length === 0 ? <EmptyState title="Chưa có bài học">Bài học đã tạo sẽ xuất hiện ở đây.</EmptyState> : <div className="lesson-management-list">{course.lessons.map((lesson) => editingLesson?.id === lesson.id ? <form key={lesson.id} className="lesson-edit-form" onSubmit={saveLesson}><label>Tiêu đề<input value={editingLesson.title} onChange={(event) => setEditingLesson({ ...editingLesson, title: event.target.value })} minLength="2" maxLength="160" required /></label><label>Nội dung<textarea value={editingLesson.content} onChange={(event) => setEditingLesson({ ...editingLesson, content: event.target.value })} maxLength="100000" rows="4" /></label><label>Thứ tự<input type="number" min="0" max="10000" value={editingLesson.order} onChange={(event) => setEditingLesson({ ...editingLesson, order: event.target.value })} /></label><button className="primary-button" disabled={operationPending[`lesson:save:${lesson.id}`]}>Lưu bài học</button><button type="button" onClick={() => setConfirm({ title: 'Bỏ chỉnh sửa?', message: 'Các thay đổi chưa lưu sẽ bị bỏ.', onConfirm: () => setEditingLesson(null) })}>Hủy chỉnh sửa</button></form> : <article key={lesson.id}><div><strong>{lesson.title}</strong><small>{lesson.order} · {lesson.documentName || 'Chưa có tài liệu'}</small>{uploadStates[lesson.id]?.status === 'uploading' && <small role="status">Đang tải lên {uploadStates[lesson.id].file?.name}…</small>}{uploadStates[lesson.id]?.status === 'error' && <StatusMessage type="error">{uploadStates[lesson.id].error}<button type="button" onClick={() => retryDocument(lesson)} disabled={!uploadStates[lesson.id].file}>Thử tải lại {uploadStates[lesson.id].file?.name}</button></StatusMessage>}{uploadStates[lesson.id]?.status === 'complete' && <StatusMessage type="success">Đã tải tài liệu thành công.</StatusMessage>}</div><div className="form-actions"><label className="document-replace">{lesson.documentName ? 'Thay tài liệu' : 'Thêm tài liệu'}<input type="file" accept=".pdf,.txt,.md,.markdown,.csv,application/pdf,text/plain,text/markdown,text/csv" onChange={(event) => replaceDocument(lesson, event)} disabled={operationPending[`document:${lesson.id}`]} /></label><button type="button" disabled={operationPending[`document-remove:${lesson.id}`] || !lesson.documentName} onClick={() => askToConfirm('Gỡ tài liệu?', `Gỡ “${lesson.documentName}” khỏi bài học. Nội dung text nhập trực tiếp vẫn được giữ.`, () => removeDocument(lesson), true, 'Gỡ tài liệu')}>Gỡ tài liệu</button><button type="button" onClick={() => setEditingLesson({ id: lesson.id, title: lesson.title, content: lesson.content || '', order: String(lesson.order) })}>Sửa</button><button className="danger-button" type="button" disabled={operationPending[`lesson:delete:${lesson.id}`]} onClick={() => askToConfirm('Xóa bài học?', `Xóa “${lesson.title}”, tài liệu, tiến độ, bài ôn và  lịch sử hỏi đáp liên quan? Thao tác không thể hoàn tác.`, () => deleteLesson(lesson), true, 'Xóa bài học')}>Xóa</button></div></article>)}</div>}</section>
      <section className="management-card danger-zone"><h2>Xóa khóa học</h2><p>Thao tác này xóa bài học, bài nộp và lượt ghi danh theo quy tắc cascade của backend.</p><button className="danger-button" disabled={operationPending['course:delete']} onClick={() => askToConfirm('Xóa khóa học?', `Xóa “${course.title}”, toàn bộ bài học, tài liệu, bài tập, bài nộp và lượt ghi danh? Không thể khôi phục.`, deleteCourse, true, 'Xóa khóa học')}>Xóa khóa học</button></section>
    </section>}
    {confirm && <ConfirmDialog title={confirm.title} message={confirm.message} confirmLabel={confirm.confirmLabel} danger={confirm.danger} onCancel={() => setConfirm(null)} onConfirm={async () => { const action = confirm.onConfirm; setConfirm(null); await action() }} />}
  </main>
}

export default CourseWorkspacePage
