import { randomBytes, randomUUID, createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import bcrypt from 'bcryptjs'
import { buildDataset, DATASET_ID, VERSION } from './dataset.mjs'
import { createPracticeQuestions } from '../../src/utils/studyQuiz.js'
import { processDocument } from '../../src/services/documentProcessing.js'
import { resolveLessonSource } from '../../src/utils/lessonText.js'

export function validateManifest(value) {
  if (!value || value.datasetId !== DATASET_ID || value.version !== VERSION || !Array.isArray(value.users) || value.users.length !== 18 || !Array.isArray(value.courses) || value.courses.length !== 8 || !Array.isArray(value.files) || /password|token|secret|credential/i.test(JSON.stringify(value))) throw new Error('DEMO_OWNERSHIP_CHANGED')
  const expected = buildDataset()
  for (const u of value.users) if (!Number.isSafeInteger(u.id) || !expected.users.some(e => e.key === u.key && e.email === u.email && e.role === u.role)) throw new Error('DEMO_OWNERSHIP_CHANGED')
  if (new Set(value.users.map(u => u.id)).size !== 18 || new Set(value.users.map(u => u.key)).size !== 18) throw new Error('DEMO_OWNERSHIP_CHANGED')
  for (const c of value.courses) if (!Number.isSafeInteger(c.id) || !expected.courses.some(e => e.key === c.key && e.joinCode === c.joinCode && value.users.some(u => u.id === c.instructorId && u.key === e.instructorKey)) || !Array.isArray(c.lessons) || c.lessons.length !== 6 || !Array.isArray(c.assignments) || c.assignments.length !== 3) throw new Error('DEMO_OWNERSHIP_CHANGED')
  if (new Set(value.courses.map(c=>c.key)).size !== 8 || value.files.length !== 26) throw new Error('DEMO_OWNERSHIP_CHANGED')
  for (const f of value.files) if (!/^demo-v2-[a-f0-9-]+\.(txt|md|csv|pdf)$/.test(f.name) || !/^[a-f0-9]{64}$/.test(f.hash)) throw new Error('DEMO_OWNERSHIP_CHANGED')
  return value
}

async function inspect(tx, data) {
  const registry = await tx.demoSeedDataset.findUnique({where:{id:DATASET_ID}})
  if (registry) {
    if (registry.version !== VERSION) throw new Error('DEMO_OWNERSHIP_CHANGED')
    const m = validateManifest(registry.manifest)
    const users = await tx.user.findMany({where:{id:{in:m.users.map(u=>u.id)}},select:{id:true,email:true,role:true}})
    if (!m.users.every(u=>users.some(v=>v.id===u.id && v.email===u.email && v.role===u.role))) throw new Error('DEMO_OWNERSHIP_CHANGED')
    const courses = await tx.course.findMany({where:{id:{in:m.courses.map(c=>c.id)}},select:{id:true,joinCode:true,instructorId:true,lessons:{select:{id:true}},assignments:{select:{id:true}}}})
    if (!m.courses.every(c=>courses.some(v=>v.id===c.id && v.joinCode===c.joinCode && v.instructorId===c.instructorId && c.lessons.every(id=>v.lessons.some(l=>l.id===id)) && c.assignments.every(id=>v.assignments.some(a=>a.id===id))))) throw new Error('DEMO_OWNERSHIP_CHANGED')
    return m
  }
  if (await tx.user.count({where:{email:{in:data.users.map(u=>u.email)}}}) || await tx.course.count({where:{joinCode:{in:data.courses.map(c=>c.joinCode)}}})) throw new Error('DEMO_COLLISION')
  return null
}

export async function seedDemo({prisma,uploadDirectory,mode}) {
  const data = buildDataset()
  const prior = await inspect(prisma,data)
  const counts = {users:18,admin:1,instructors:4,activeStudents:12,disabledStudents:1,courses:8,lessons:48,assignments:24,documents:26}
  if (prior) {
    for (const file of prior.files) {
      let bytes
      try {bytes = await readFile(join(uploadDirectory,file.name))} catch {throw new Error('DEMO_OWNERSHIP_CHANGED')}
      if (createHash('sha256').update(bytes).digest('hex') !== file.hash) throw new Error('DEMO_OWNERSHIP_CHANGED')
    }
    return {status:'unchanged',counts,created:0}
  }
  if (mode === 'dry-run') return {status:'preview',counts,created:0}
  if (mode !== 'apply') throw new Error('DEMO_MODE')
  // Validate every document before any filesystem/database write.
  const material = new Map()
  for (const course of data.courses) for (const lesson of course.lessons) if (lesson.document) {
    const kind = lesson.document.kind
    const text = kind === 'csv' ? 'section,content\n'+lesson.content.split('\n').filter(Boolean).map((s,i)=>`${i+1},"${s.replaceAll('"','""')}"`).join('\n') : lesson.content
    const buffer = kind === 'pdf' ? await readFile(new URL('./documents/'+lesson.document.asset,import.meta.url)) : Buffer.from(text,'utf8')
    const result = await processDocument({name:`bai-hoc.${kind}`,mimetype:kind==='pdf'?'application/pdf':kind==='csv'?'text/csv':'text/plain',buffer})
    if (result.status !== 'SUCCESS') throw new Error('DEMO_DOCUMENT_INVALID')
    material.set(lesson,{buffer,result,name:`demo-v2-${randomUUID()}.${kind}`,documentName:`${course.key}-bai-${lesson.order}.${kind}`})
  }
  const access = []
  for (const u of data.users) {
    const password = randomBytes(18).toString('base64url')+'aA7!'
    access.push({key:u.key,email:u.email,role:u.role,password,hash:await bcrypt.hash(password,10)})
  }
  const manifest = {datasetId:DATASET_ID,version:VERSION,users:[],courses:[],files:[]}
  // Exclusive fresh filenames; on an unexpected transaction failure, report
  // possible orphan files for separately authorized cleanup. Never delete here.
  await mkdir(uploadDirectory,{recursive:true})
  let result
  try { result = await prisma.$transaction(async tx => {
    await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(771109)::text')
    if (await inspect(tx,data)) throw new Error('DEMO_COLLISION')
    for (const m of material.values()) {
      await writeFile(join(uploadDirectory,m.name),m.buffer,{flag:'wx'})
      manifest.files.push({name:m.name,hash:createHash('sha256').update(m.buffer).digest('hex')})
    }
    const users = new Map()
    for (const user of data.users) {
      const {key,...fields} = user
      const row = await tx.user.create({data:{...fields,password:access.find(u=>u.key===key).hash}})
      users.set(key,row)
      manifest.users.push({key,id:row.id,email:row.email,role:row.role})
    }
    for (const [ci,course] of data.courses.entries()) {
      const row = await tx.course.create({data:{title:course.title,description:course.description,joinCode:course.joinCode,instructorId:users.get(course.instructorKey).id}})
      const owned = {key:course.key,id:row.id,joinCode:row.joinCode,instructorId:row.instructorId,lessons:[],assignments:[]}
      manifest.courses.push(owned)
      const lessons = []
      for (const lesson of course.lessons) {
        const doc = material.get(lesson)
        const l = await tx.lesson.create({data:{courseId:row.id,title:lesson.title,content:lesson.content,order:lesson.order,...(doc ? {documentUrl:doc.name,documentName:doc.documentName,documentText:doc.result.text,documentHash:doc.result.hash,extractionStatus:doc.result.status,extractionTruncated:doc.result.truncated,sourceRevision:1} : {})}})
        lessons.push(l); owned.lessons.push(l.id)
      }
      const enrolled = []
      for (let si=0;si<12;si++) if (si===0 || (si+ci)%3===0) {
        const student = users.get(`student${si+1}`)
        await tx.enrollment.create({data:{userId:student.id,courseId:row.id}})
        enrolled.push(student)
        for (let li=0;li<(si%3===0?ci%7:si%6);li++) await tx.lessonProgress.create({data:{userId:student.id,lessonId:lessons[li].id}})
      }
      for (let ai=0;ai<3;ai++) {
        const a = await tx.assignment.create({data:{courseId:row.id,title:`${['Phân tích ví dụ','Bài thực hành','Tổng kết'][ai]}: ${course.lessons[ai*2].title}`,description:`Đọc bài ${ai*2+1} và ${ai*2+2}. ${course.lessons[ai*2].content.split('Ví dụ: ')[1]}\nTiêu chí: đúng khái niệm 40 điểm, giải thích từng bước 40 điểm, dẫn nguồn và trình bày 20 điểm.`,points:100,dueAt:new Date(Date.now()+(ai===0?-7:ai===1?7:21)*86400000)}})
        owned.assignments.push(a.id)
        for (const [index,student] of enrolled.entries()) if ((index+ai)%3!==0) await tx.assignmentSubmission.create({data:{assignmentId:a.id,studentId:student.id,content:`[Bài nộp demo] Em đối chiếu bốn định nghĩa của bài ${ai*2+1}, giải thích ví dụ và thêm trường hợp biên. ${course.lessons[ai*2].content.split('Ví dụ: ')[1].split('\n')[0]}`,...((index+ai)%3===1?{grade:85,feedback:'Định nghĩa và ví dụ rõ; cần giải thích thêm kết quả khi thay đổi giả định.'}:{})}})
      }
      for (const [index,student] of enrolled.entries()) {
        const source = resolveLessonSource(lessons[index%2])
        const quiz = createPracticeQuestions(source.text,4)
        if (quiz.error) throw new Error('DEMO_DOCUMENT_INVALID')
        const submitted = index%2===0
        const answers = quiz.questions.map((q,i)=>i===3?(q.correctIndex+1)%4:q.correctIndex)
        await tx.quizAttempt.create({data:{userId:student.id,lessonId:lessons[index%2].id,questions:quiz.questions,draftAnswers:submitted?answers:[answers[0],null,null,null],version:1,...(submitted?{selectedAnswers:answers,score:3,submittedAt:new Date()}:{})}})
        await tx.chatMessage.create({data:{userId:student.id,lessonId:lessons[0].id,question:'[Demo chuẩn bị sẵn] Bài này cần thực hành gì?',answer:'[Dữ liệu demo chuẩn bị sẵn, không phải kết quả model] '+course.lessons[0].content.split('Thực hành: ')[1]}})
      }
    }
    validateManifest(manifest)
    await tx.demoSeedDataset.create({data:{id:DATASET_ID,version:VERSION,manifest}})
    return {status:'created',counts,created:18,manifest}
  },{timeout:60000})
  } catch(error) {error.orphanFiles=manifest.files.map(f=>f.name);throw error}
  return {...result,access:access.map(({hash,...publicAccess})=>publicAccess)}
}
