export const parseId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export const canAccessCourse = (course, user) => course && (
  course.instructorId === user.id
  || course.enrollments?.some((enrollment) => enrollment.userId === user.id)
)
