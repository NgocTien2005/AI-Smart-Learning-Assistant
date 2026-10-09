import bcrypt from 'bcryptjs'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { uploadDirectory, isProduction } from '../src/config/env.js'
import { prisma } from '../src/lib/prisma.js'
import { createPracticeQuestions } from '../src/utils/studyQuiz.js'

if (isProduction) {
  throw new Error('Demo seed is disabled in production.')
}

const demoPassword = '123456789'
const users = [
  { name: 'Nguyễn Minh Anh', email: 'giangvien@lumina.local', role: 'INSTRUCTOR' },
  { name: 'Trần Gia Bảo', email: 'hocvien@lumina.local', role: 'STUDENT' },
  { name: 'Quản trị Lumina', email: 'quantri@lumina.local', role: 'ADMIN' },
]
const lessonContent = [
  {
    title: 'Bắt đầu với tư duy lập trình',
    content: 'Lập trình là cách diễn đạt các bước giải quyết vấn đề để máy tính thực hiện. Một chương trình thường nhận dữ liệu đầu vào, xử lý theo quy tắc và tạo kết quả đầu ra. Hãy chia bài toán lớn thành các bước nhỏ, đặt tên biến rõ nghĩa và kiểm tra từng bước bằng ví dụ. Mỗi bước nhỏ giúp tìm lỗi và xác nhận kết quả dễ dàng hơn. Ví dụ nhỏ giúp người học hiểu rõ từng bước.',
  },
  {
    title: 'Biến, kiểu dữ liệu và điều kiện',
    content: 'Biến lưu trữ giá trị để chương trình có thể sử dụng lại. Các kiểu dữ liệu phổ biến gồm số, chuỗi, boolean và danh sách. Câu lệnh điều kiện if/else chọn nhánh thực thi dựa trên một biểu thức đúng hoặc sai. Ví dụ: nếu điểm lớn hơn hoặc bằng 5 thì kết quả là đạt.',
  },
  {
    title: 'Vòng lặp và bài tập thực hành',
    documentName: 'ghi-chu-vong-lap.txt',
    document: `VÒNG LẶP

Vòng lặp giúp thực hiện lại một nhóm lệnh.

- for: phù hợp khi biết trước số lần lặp.
- while: tiếp tục khi điều kiện còn đúng.
- Cập nhật biến điều khiển để vòng lặp kết thúc.

Ví dụ: cộng các số từ 1 đến 5 bằng biến tổng và vòng lặp for. Kết quả là 15.

Câu hỏi ôn tập: Vì sao vòng lặp while có thể chạy vô hạn? Vì điều kiện kết thúc không bao giờ trở thành sai.`,
  },
]

async function upsertUser(user) {
  const password = await bcrypt.hash(demoPassword, 10)
  return prisma.user.upsert({
    where: { email: user.email },
    update: { name: user.name, role: user.role, password, isActive: true },
    create: { ...user, password, isActive: true },
  })
}

async function upsertLesson(courseId, lesson, order) {
  let documentUrl = null
  if (lesson.document) {
    documentUrl = `lumina-demo-${courseId}-${order}.txt`
    await mkdir(uploadDirectory, { recursive: true })
    await writeFile(resolve(uploadDirectory, documentUrl), lesson.document, 'utf8')
  }
  const existing = await prisma.lesson.findFirst({ where: { courseId, title: lesson.title } })
  const data = {
    title: lesson.title,
    content: lesson.content || null,
    documentUrl,
    documentName: lesson.documentName || null,
    extractedText: lesson.document || lesson.content,
    order,
  }
  return existing
    ? prisma.lesson.update({ where: { id: existing.id }, data })
    : prisma.lesson.create({ data: { ...data, courseId } })
}

try {
  const [instructor, student] = await Promise.all(users.map(upsertUser))
  const courseData = [
    {
      joinCode: 'D3A0B001',
      title: 'Nhập môn lập trình',
      description: 'Khóa học mẫu để trải nghiệm quản lý lớp, bài học, tài liệu và trợ lý học tập.',
    },
    {
      joinCode: 'D3A0B002',
      title: 'Kỹ năng học tập số',
      description: 'Không gian mẫu để thử tạo khóa học và tham gia lớp bằng mã.',
    },
  ]
  const courses = []
  for (const data of courseData) {
    courses.push(await prisma.course.upsert({
      where: { joinCode: data.joinCode },
      update: { ...data, instructorId: instructor.id },
      create: { ...data, instructorId: instructor.id },
    }))
  }
  for (const course of courses) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student.id, courseId: course.id } },
      update: {},
      create: { userId: student.id, courseId: course.id },
    })
  }
  let firstLesson = null
  for (let index = 0; index < lessonContent.length; index += 1) {
    const lesson = await upsertLesson(courses[0].id, lessonContent[index], index + 1)
    if (index === 0) firstLesson = lesson
    if (index === 2) {
      const question = 'Vòng lặp for dùng khi nào?'
      const existingMessage = await prisma.chatMessage.findFirst({
        where: { userId: student.id, lessonId: lesson.id, question },
      })
      const messageData = {
        question,
        answer: 'Theo tài liệu, vòng lặp for phù hợp khi đã biết trước số lần cần lặp.',
      }
      if (existingMessage) {
        await prisma.chatMessage.update({ where: { id: existingMessage.id }, data: messageData })
      } else {
        await prisma.chatMessage.create({ data: { ...messageData, userId: student.id, lessonId: lesson.id } })
      }
    }
  }
  await upsertLesson(courses[1].id, {
    title: 'Tổ chức thời gian học',
    content: 'Chia mục tiêu lớn thành các phiên học ngắn. Sau mỗi phiên, tự nhớ lại kiến thức mà không nhìn tài liệu. Ghi lại điều còn chưa rõ để tìm câu trả lời sau đó. Nghỉ ngắn giữa các phiên giúp duy trì sự tập trung.',
  }, 1)

  const practiceQuiz = createPracticeQuestions(firstLesson.extractedText, 5)
  if (!practiceQuiz.error) {
    const demoAttempt = await prisma.quizAttempt.findFirst({
      where: { userId: student.id, lessonId: firstLesson.id },
      orderBy: { createdAt: 'asc' },
    })
    const quizData = { questions: practiceQuiz.questions, score: practiceQuiz.questions.length - 1, submittedAt: new Date() }
    if (demoAttempt) {
      await prisma.quizAttempt.update({ where: { id: demoAttempt.id }, data: quizData })
    } else {
      await prisma.quizAttempt.create({ data: { ...quizData, userId: student.id, lessonId: firstLesson.id } })
    }
  }

  const existingAssignment = await prisma.assignment.findFirst({
    where: { courseId: courses[0].id, title: 'Bài tập: tính tổng bằng vòng lặp' },
  })
  const assignmentData = {
    title: 'Bài tập: tính tổng bằng vòng lặp',
    description: 'Viết các bước tính tổng các số chẵn từ 2 đến 20. Nêu biến tích lũy và điều kiện dừng của vòng lặp.',
    dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    points: 20,
    courseId: courses[0].id,
  }
  const demoAssignment = existingAssignment
    ? await prisma.assignment.update({ where: { id: existingAssignment.id }, data: assignmentData })
    : await prisma.assignment.create({ data: assignmentData })
  await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId: demoAssignment.id, studentId: student.id } },
    update: {
      content: 'Em khởi tạo biến tổng bằng 0, lặp số chẵn từ 2 đến 20 và cộng từng số vào biến tổng. Dừng sau số 20; kết quả là 110.',
      grade: null,
      feedback: null,
    },
    create: {
      assignmentId: demoAssignment.id,
      studentId: student.id,
      content: 'Em khởi tạo biến tổng bằng 0, lặp số chẵn từ 2 đến 20 và cộng từng số vào biến tổng. Dừng sau số 20; kết quả là 110.',
    },
  })

  console.log('Demo data is ready. Sign in with either demo account; password: 123456789')
  console.log(`Instructor: ${users[0].email} | Student: ${users[1].email} | Admin: ${users[2].email}`)
} finally {
  await prisma.$disconnect()
}
