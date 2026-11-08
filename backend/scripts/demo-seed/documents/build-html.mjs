// Maintainer-only PDF authoring source. No runtime browser dependency.
import {writeFile} from 'node:fs/promises'
import {buildDataset} from '../dataset.mjs'
const escape = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
for (const [i,course] of buildDataset().courses.slice(0,2).entries()) {
  const lesson = course.lessons[5]
  const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><title>${escape(lesson.title)}</title><style>@page{size:A4;margin:22mm}body{font:12pt/1.6 Arial,sans-serif;color:#182b43;max-width:700px;margin:32px auto}h1{font-size:24pt;color:#194c75}header{border-bottom:2px solid #194c75;padding-bottom:12px}p{margin:14px 0;break-inside:avoid}small{color:#46566c}</style><header><small>LUMINA LMS · TÀI LIỆU DEMO TỔNG HỢP</small><h1>${escape(lesson.title.slice(3))}</h1><p>${escape(course.title)}</p></header>${lesson.content.split('\n').filter(Boolean).map(s=>`<p>${escape(s)}</p>`).join('')}<hr><small>Nguồn: nội dung tự soạn trong dataset lumina-demo-v2. PDF có lớp văn bản; không sử dụng OCR hoặc dịch vụ AI.</small></html>`
  await writeFile(new URL(`handout-${i+1}.html`,import.meta.url),html)
}
