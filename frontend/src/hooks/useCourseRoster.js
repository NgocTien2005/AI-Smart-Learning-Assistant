import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api.js'

export function useCourseRoster(courseId, enabled, reload) {
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState('')
  useEffect(() => {
    if (!enabled) return undefined
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
  }, [enabled, courseId, reload])

  return { students, studentsLoading, studentsError }
}
