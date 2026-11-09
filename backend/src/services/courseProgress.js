export const addStudentProgress = async (prisma, courses, userId) => {
  if (!courses.length) return courses
  const lessonProgress = await prisma.lessonProgress.findMany({
    where: { userId, lesson: { courseId: { in: courses.map(({ id }) => id) } } },
    select: { lesson: { select: { courseId: true } } },
  })
  const completedByCourse = new Map()
  for (const { lesson } of lessonProgress) {
    completedByCourse.set(lesson.courseId, (completedByCourse.get(lesson.courseId) || 0) + 1)
  }
  return courses.map((course) => {
    const completedLessons = completedByCourse.get(course.id) || 0
    const totalLessons = course._count.lessons
    return { ...course, completedLessons, progressPercent: totalLessons ? Math.round(completedLessons / totalLessons * 100) : 0 }
  })
}
