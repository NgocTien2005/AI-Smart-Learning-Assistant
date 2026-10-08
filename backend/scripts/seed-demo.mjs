import bcrypt from 'bcryptjs'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { uploadDirectory, isProduction } from '../src/config/env.js'
import { prisma } from '../src/lib/prisma.js'

if (isProduction) {
  throw new Error('Demo seed is disabled in production.')
}

const demoPassword = 'LuminaDemo123!'
const users = [
  { name: 'Nguyễn Minh Anh', email: 'giangvien@lumina.local', role: 'INSTRUCTOR' },
  { name: 'Trần Gia Bảo', email: 'hocvien@lumina.local', role: 'STUDENT' },
]
const lessonContent = [
  {
    title: 'Bắt đầu với tư duy lập trình',
    content: 'Lập trình là cách diễn đạt các bước giải quyết vấn đề để máy tính thực hiện. Một chương trình thường nhận dữ liệu đầu vào, xử lý theo quy tắc và tạo kết quả đầu ra. Hãy chia bài toán lớn thành các bước nhỏ, đặt tên biến rõ nghĩa và kiểm tra từng bước bằng ví dụ.',
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
    update: { name: user.name, role: user.role, password },
    create: { ...user, password },
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
  for (let index = 0; index < lessonContent.length; index += 1) {
    const lesson = await upsertLesson(courses[0].id, lessonContent[index], index + 1)
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
    content: 'Chia mục tiêu lớn thành các phiên học ngắn. Sau mỗi phiên, tự nhớ lại kiến thức mà không nhìn tài liệu, rồi ghi lại điều còn chưa rõ.',
  }, 1)

  console.log('Demo data is ready. Sign in with either demo account; password: LuminaDemo123!')
  console.log(`Instructor: ${users[0].email} | Student: ${users[1].email}`)
} finally {
  await prisma.$disconnect()
}
