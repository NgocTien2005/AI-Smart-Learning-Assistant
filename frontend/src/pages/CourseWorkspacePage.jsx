import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest, downloadDocument, getStoredUser } from '../services/api.js'
import './LearningApp.css'

function CourseWorkspacePage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const user = getStoredUser()
  const isInstructor = user?.role === 'INSTRUCTOR'
  const completedLessonsCount = course?.lessons.filter((lesson) => lesson.isCompleted).length || 0
  const courseProgressPercent = course?.lessons.length ? Math.round(completedLessonsCount / course.lessons.length * 100) : 0
  const [course, setCourse] = useState(null)
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', order: 0, document: null })
  const [editForm, setEditForm] = useState({ title: '', description: '' })
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [editingLesson, setEditingLesson] = useState(null)
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [students, setStudents] = useState([])

  useEffect(() => {
    let active = true
    apiRequest(`/api/courses/${courseId}`)
      .then((data) => {
        if (!active) return
        setCourse(data.course)
        setEditForm({ title: data.course.title, description: data.course.description })
      })
      .catch((error) => { if (active) setNotice(error.message) })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [courseId])

  useEffect(() => {
    if (!isInstructor) return
    let active = true
    apiRequest(`/api/courses/${courseId}/students`)
      .then((data) => { if (active) setStudents(data.students) })
      .catch((error) => { if (active) setNotice(error.message) })
    return () => { active = false }
  }, [courseId, isInstructor])

  const updateCourse = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const data = await apiRequest(`/api/courses/${courseId}`, { method: 'PATCH', body: JSON.stringify(editForm) })
      setCourse((current) => ({ ...current, ...data.course }))
      setNotice('Đã cập nhật thông tin khóa học.')
    } catch (error) {
      setNotice(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const createLesson = async (event) => {
    event.preventDefault()
    if (!lessonForm.content.trim() && !lessonForm.document) {
      setNotice('Vui lòng nhập nội dung bài học hoặc chọn một tài liệu trước khi tạo.')
      return
    }
    const formElement = event.currentTarget
    const formData = new FormData()
    formData.set('title', lessonForm.title)
    formData.set('content', lessonForm.content)
    formData.set('order', String(lessonForm.order))
    if (lessonForm.document) formData.set('document', lessonForm.document)
    setSubmitting(true)
    try {
      const data = await apiRequest(`/api/courses/${courseId}/lessons`, { method: 'POST', body: formData })
      setCourse((current) => ({ ...current, lessons: [...current.lessons, data.lesson].sort((a, b) => a.order - b.order) }))
      setLessonForm({ title: '', content: '', order: course.lessons.length + 1, document: null })
      formElement.reset()
      setNotice('Đã thêm bài học mới.')
    } catch (error) {
      setNotice(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteLesson = async (lessonId) => {
    if (!window.confirm('Xóa bài học và toàn bộ lịch sử hỏi đáp liên quan?')) return
    try {
      await apiRequest(`/api/courses/lessons/${lessonId}`, { method: 'DELETE' })
      setCourse((current) => ({ ...current, lessons: current.lessons.filter(({ id }) => id !== lessonId) }))
      if (selectedLesson?.id === lessonId) setSelectedLesson(null)
      setNotice('Đã xóa bài học.')
    } catch (error) {
      setNotice(error.message)
    }
  }

  const saveLesson = async (event) => {
    event.preventDefault()
    if (!editingLesson) return
    setSubmitting(true)
    try {
      const data = await apiRequest(`/api/courses/lessons/${editingLesson.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editingLesson.title,
          content: editingLesson.content || '',
          order: Number(editingLesson.order),
        }),
      })
      setCourse((current) => ({
        ...current,
        lessons: current.lessons.map((lesson) => lesson.id === data.lesson.id ? data.lesson : lesson).sort((a, b) => a.order - b.order),
      }))
      if (selectedLesson?.id === data.lesson.id) setSelectedLesson(data.lesson)
      setEditingLesson(null)
      setNotice('Đã cập nhật bài học.')
    } catch (error) {
      setNotice(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleLessonProgress = async (lesson) => {
    setSubmitting(true)
    try {
      const completed = !lesson.isCompleted
      const data = await apiRequest(`/api/courses/lessons/${lesson.id}/progress`, {
        method: completed ? 'PUT' : 'DELETE',
      })
      setCourse((current) => ({
        ...current,
        lessons: current.lessons.map((item) => item.id === lesson.id
          ? { ...item, isCompleted: data.isCompleted, completedAt: data.completedAt }
          : item),
      }))
      setNotice(completed ? 'Đã đánh dấu bài học hoàn thành.' : 'Đã bỏ trạng thái hoàn thành.')
    } catch (error) {
      setNotice(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteCourse = async () => {
    if (!window.confirm('Xóa khóa học, bài học, lượt tham gia và lịch sử hỏi đáp? Thao tác này không thể hoàn tác.')) return
    try {
      await apiRequest(`/api/courses/${courseId}`, { method: 'DELETE' })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setNotice(error.message)
    }
  }

  const leaveCourse = async () => {
    if (!window.confirm('Rời khóa học này? Lịch sử hỏi đáp của bạn vẫn được giữ nếu tham gia lại.')) return
    try {
      await apiRequest(`/api/courses/${courseId}/enrollment`, { method: 'DELETE' })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setNotice(error.message)
    }
  }

  const openAssistant = async (lesson) => {
    setSelectedLesson(lesson)
    setQuestion('')
    try {
      const data = await apiRequest(`/api/courses/lessons/${lesson.id}/chat`)
      setMessages(data.messages)
    } catch (error) {
      setMessages([])
      setNotice(error.message)
    }
  }

  const askQuestion = async (event) => {
    event.preventDefault()
    if (!selectedLesson) return
    setSubmitting(true)
    try {
      const data = await apiRequest(`/api/courses/lessons/${selectedLesson.id}/chat`, {
        method: 'POST',
        body: JSON.stringify({ question }),
      })
      setMessages((current) => [...current, data.message])
      setQuestion('')
    } catch (error) {
      setNotice(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const download = async (lesson) => {
    try {
      await downloadDocument(lesson.id, lesson.documentName)
    } catch (error) {
      setNotice(error.message)
    }
  }

  const replaceDocument = async (lesson, event) => {
    const input = event.target
    const document = input.files?.[0]
    if (!document) return
    const formData = new FormData()
    formData.set('document', document)
    setSubmitting(true)
    try {
      const data = await apiRequest(`/api/courses/lessons/${lesson.id}/document`, { method: 'PATCH', body: formData })
      setCourse((current) => ({ ...current, lessons: current.lessons.map((item) => item.id === lesson.id ? data.lesson : item) }))
      setNotice(lesson.documentName ? 'Đã thay tài liệu.' : 'Đã thêm tài liệu.')
    } catch (error) {
      setNotice(error.message)
    } finally {
      input.value = ''
      setSubmitting(false)
    }
  }

  const removeDocument = async (lesson) => {
    if (!window.confirm(`Gỡ tài liệu “${lesson.documentName}” khỏi bài học?`)) return
    try {
      const data = await apiRequest(`/api/courses/lessons/${lesson.id}/document`, { method: 'DELETE' })
      setCourse((current) => ({ ...current, lessons: current.lessons.map((item) => item.id === lesson.id ? data.lesson : item) }))
      setNotice('Đã gỡ tài liệu khỏi bài học.')
    } catch (error) {
      setNotice(error.message)
    }
  }

  if (loading) return <div className="page-feedback">Đang tải khóa học…</div>
  if (!course) return <div className="page-feedback"><strong>Không thể mở khóa học</strong><span>{notice}</span><Link to="/dashboard">Quay lại dashboard</Link></div>

  return (
    <div className="learning-page">
      <header className="learning-header"><Link className="learning-brand" to="/dashboard"><span>L</span><strong>Lumina LMS</strong></Link><nav><Link to="/dashboard">← Dashboard</Link></nav></header>
      <main className="workspace-main">
        <section className="workspace-hero"><div><span className="eyebrow">{isInstructor ? 'KHÓA HỌC ĐANG GIẢNG DẠY' : `GIẢNG VIÊN: ${course.instructor.name}`}</span><h1>{course.title}</h1><p>{course.description || 'Khóa học chưa có mô tả.'}</p><div className="workspace-meta"><span>{course.lessons.length} bài học</span><span>{course._count.enrollments} học viên</span>{isInstructor && <strong>Mã tham gia: {course.joinCode}</strong>}</div>{!isInstructor && <><div className="workspace-progress"><span>Tiến độ của bạn: {completedLessonsCount}/{course.lessons.length} bài ({courseProgressPercent}%)</span><div role="progressbar" aria-label="Tiến độ khóa học" aria-valuemin="0" aria-valuemax="100" aria-valuenow={courseProgressPercent}><span style={{ width: `${courseProgressPercent}%` }} /></div></div><button className="leave-course-button" type="button" onClick={leaveCourse}>Rời khóa học</button></>}</div></section>
        {notice && <p className="workspace-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')}>×</button></p>}

        {isInstructor && <div className="instructor-grid"><section className="management-card"><h2>Thông tin khóa học</h2><form onSubmit={updateCourse}><label>Tên khóa học<input value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} minLength="3" maxLength="120" required /></label><label>Mô tả<textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} rows="4" maxLength="4000" /></label><div className="form-actions"><button className="primary-button" disabled={submitting}>Lưu thay đổi</button><button className="danger-button" type="button" onClick={deleteCourse}>Xóa khóa học</button></div></form></section><section className="management-card"><h2>Thêm bài học</h2><form onSubmit={createLesson}><label>Tiêu đề<input value={lessonForm.title} onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })} minLength="2" maxLength="160" required /></label><label>Nội dung text<textarea value={lessonForm.content} onChange={(event) => setLessonForm({ ...lessonForm, content: event.target.value })} rows="5" maxLength="100000" placeholder="Nội dung này dùng cho học viên và trợ lý tài liệu…" /></label><div className="form-row"><label>Thứ tự<input type="number" min="0" max="10000" value={lessonForm.order} onChange={(event) => setLessonForm({ ...lessonForm, order: event.target.value })} /></label><label>Tài liệu<input type="file" accept=".pdf,.txt,.md,.csv,application/pdf,text/plain,text/markdown,text/csv" onChange={(event) => setLessonForm({ ...lessonForm, document: event.target.files[0] || null })} /></label></div><small id="lesson-requirement">Cần nhập nội dung hoặc chọn tài liệu. PDF dùng để tải xuống; TXT, Markdown và CSV cũng được dùng cho trợ lý tài liệu. Tối đa 10 MB.</small><button className="primary-button" disabled={submitting}>{submitting ? 'Đang thêm…' : 'Thêm bài học'}</button></form></section></div>}

        {isInstructor && <section className="management-card roster-card"><div className="section-title"><div><span className="eyebrow">HỌC VIÊN</span><h2>Danh sách tham gia</h2></div><span>{students.length} học viên</span></div>{students.length === 0 ? <div className="empty-state"><strong>Chưa có học viên</strong><span>Chia sẻ mã tham gia để học viên vào khóa học.</span></div> : <ul>{students.map((student) => <li key={student.id}><span className="student-avatar">{student.name.slice(0, 1).toUpperCase()}</span><span><strong>{student.name}</strong><small>{student.email}</small><small>Hoàn thành {student.completedLessons}/{student.totalLessons} bài ({student.progressPercent}%)</small></span><time dateTime={student.enrolledAt}>{new Date(student.enrolledAt).toLocaleDateString('vi-VN')}</time></li>)}</ul>}</section>}

        <section className="lesson-section"><div className="section-title"><div><span className="eyebrow">NỘI DUNG</span><h2>Danh sách bài học</h2></div></div>{course.lessons.length === 0 ? <div className="empty-state"><strong>Chưa có bài học</strong><span>{isInstructor ? 'Thêm nội dung bằng biểu mẫu phía trên.' : 'Giảng viên chưa đăng bài học nào.'}</span></div> : <div className="lesson-card-list">{course.lessons.map((lesson, index) => editingLesson?.id === lesson.id ? <form className="lesson-edit-form" key={lesson.id} onSubmit={saveLesson}><label>Tiêu đề<input value={editingLesson.title} onChange={(event) => setEditingLesson({ ...editingLesson, title: event.target.value })} minLength="2" maxLength="160" required /></label><label>Nội dung<textarea value={editingLesson.content || ''} onChange={(event) => setEditingLesson({ ...editingLesson, content: event.target.value })} rows="5" maxLength="100000" /></label><label>Thứ tự<input type="number" value={editingLesson.order} onChange={(event) => setEditingLesson({ ...editingLesson, order: event.target.value })} min="0" max="10000" required /></label><div className="form-actions"><button className="primary-button" disabled={submitting}>{submitting ? 'Đang lưu…' : 'Lưu bài học'}</button><button type="button" onClick={() => setEditingLesson(null)}>Hủy</button></div></form> : <article className={`lesson-card${!isInstructor && lesson.isCompleted ? ' lesson-card-complete' : ''}`} key={lesson.id}><span className="lesson-number">{!isInstructor && lesson.isCompleted ? '✓' : String(index + 1).padStart(2, '0')}</span><div className="lesson-copy"><small>Bài học {lesson.order || index + 1}</small><h3>{lesson.title}</h3>{lesson.content && <p>{lesson.content}</p>}<div className="lesson-actions">{!isInstructor && <button type="button" onClick={() => toggleLessonProgress(lesson)} disabled={submitting}>{lesson.isCompleted ? 'Bỏ hoàn thành' : 'Đánh dấu hoàn thành'}</button>}{lesson.documentName && <button type="button" onClick={() => download(lesson)}>↓ {lesson.documentName}</button>}<button type="button" onClick={() => openAssistant(lesson)}>✦ Trợ lý tài liệu</button>{isInstructor && <label className="document-replace">{lesson.documentName ? 'Thay tài liệu' : 'Thêm tài liệu'}<input type="file" accept=".pdf,.txt,.md,.csv,application/pdf,text/plain,text/markdown,text/csv" onChange={(event) => replaceDocument(lesson, event)} disabled={submitting} /></label>}{isInstructor && lesson.documentName && <button type="button" onClick={() => removeDocument(lesson)}>Gỡ tài liệu</button>}{isInstructor && <button type="button" onClick={() => setEditingLesson({ id: lesson.id, title: lesson.title, content: lesson.content || '', order: lesson.order })}>Sửa</button>}{isInstructor && <button className="delete-link" type="button" onClick={() => deleteLesson(lesson.id)}>Xóa</button>}</div></div></article>)}</div>}</section>

        {selectedLesson && <section className="assistant-panel"><header><div><span>✦</span><div><small>TRỢ LÝ TÀI LIỆU CỤC BỘ</small><h2>{selectedLesson.title}</h2></div></div><button type="button" aria-label="Đóng" onClick={() => setSelectedLesson(null)}>×</button></header><p className="assistant-note">Câu trả lời chỉ trích xuất từ nội dung bài học và không gửi dữ liệu tới dịch vụ bên ngoài.</p><div className="chat-history">{messages.length === 0 ? <p>Chưa có câu hỏi nào. Hãy hỏi bằng một từ khóa cụ thể trong bài.</p> : messages.map((message) => <div className="chat-pair" key={message.id}><p className="question"><strong>Bạn</strong>{message.question}</p><p className="answer"><strong>Lumina</strong>{message.answer}</p></div>)}</div><form className="chat-form" onSubmit={askQuestion}><label className="sr-only" htmlFor="lesson-question">Câu hỏi</label><input id="lesson-question" value={question} onChange={(event) => setQuestion(event.target.value)} minLength="3" maxLength="1000" placeholder="Ví dụ: Mạng nơ-ron được dùng để làm gì?" required /><button className="primary-button" disabled={submitting}>Gửi</button></form></section>}
      </main>
    </div>
  )
}

export default CourseWorkspacePage
