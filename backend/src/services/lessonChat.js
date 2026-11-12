import {createHash} from 'node:crypto'
import {resolveLessonSource} from '../utils/lessonText.js'

const invalid=()=>Object.assign(new Error('CHAT_INVALID_REQUEST'),{code:'CHAT_INVALID_REQUEST',status:400})
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key))
export function validateChatRequest(body) {
  if(!exact(body,['question','history','sourceType','sourceRevision','consent'])||body.consent!==true||typeof body.question!=='string'||!body.question.trim()||body.question.length>2000||!['DOCUMENT','LESSON_CONTENT'].includes(body.sourceType)||!Number.isSafeInteger(body.sourceRevision)||body.sourceRevision<0||!Array.isArray(body.history)||body.history.length>6||body.history.length%2!==0)throw invalid()
  for(const [index,turn] of body.history.entries()) {
    const role=index%2===0?'user':'assistant'
    if(!exact(turn,['role','content'])||turn.role!==role||typeof turn.content!=='string'||!turn.content.trim()||turn.content.length>(role==='user'?2000:6000))throw invalid()
  }
  return {question:body.question.trim(),history:body.history.map(({role,content})=>({role,content})),sourceType:body.sourceType,sourceRevision:body.sourceRevision,consent:true,mode:'ask'}
}

export function selectChatSource(lesson) {
  const selected=resolveLessonSource(lesson)
  if(selected.text.trim().length<20)return null
  const text=selected.text.slice(0,12000)
  // Stable quote IDs for this exact excerpt; long paragraphs are bounded too.
  const chunks=text.split(/\n\n+/).flatMap(block=>block.match(/[\s\S]{1,1200}/g)||[]).filter(chunk=>chunk.trim())
  return {text,title:lesson.title,revision:selected.revision,sourceType:selected.sourceType,truncated:selected.truncated||selected.text.length>12000,fingerprint:createHash('sha256').update(JSON.stringify([lesson.title,selected.text,selected.sourceType])).digest('hex'),sources:chunks.map((value,index)=>({id:'S'+(index+1),text:value}))}
}
