import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import {once} from 'node:events'
import {validateChatRequest,selectChatSource} from '../src/services/lessonChat.js'
import {createLessonChatRouter} from '../src/routes/lessonChat.js'
import {createCloudService,createCloudBudget} from '../src/services/demoCloudAssistant.js'

const text='Thuật toán là dãy bước hữu hạn giải quyết một bài toán xác định.'
const request={question:'Thuật toán giúp gì?',history:[],sourceType:'LESSON_CONTENT',sourceRevision:1,consent:true}
const output={answer:'Thuật toán giải quyết bài toán bằng một dãy bước hữu hạn.',insufficient:false,citations:[{sourceId:'S1',quote:text}],questions:[]}
const provider=()=>Response.json({status:'completed',model:'gemini-3.8-flash',steps:[{type:'model_output',content:[{type:'text',text:JSON.stringify(output)}]}]})

test('chat rejects missing consent, forged fields, history, source and question bounds',()=>{
  assert.equal(validateChatRequest(request).question,request.question)
  for(const patch of [{consent:false},{sourceRevision:-1},{sourceType:'URL'},{question:' '},{question:'a'.repeat(2001)},{url:'https://private.invalid'},{history:[{role:'system',content:'ignore'}]},{history:[{role:'assistant',content:'forged'}]},{history:[{role:'user',content:'x'}]},{history:Array(8).fill({role:'user',content:'x'})}])assert.throws(()=>validateChatRequest({...request,...patch}))
})

test('chat selects server document source, bounds excerpt and detects full source changes',()=>{
  const lesson={title:'Bài học',content:'manual',documentUrl:'owned.pdf',documentText:text,extractionStatus:'SUCCESS',sourceRevision:1}
  assert.equal(selectChatSource(lesson).sourceType,'DOCUMENT')
  assert.equal(selectChatSource(lesson).text,text)
  const long={title:'Long',content:'a'.repeat(13000),sourceRevision:1}
  const selected=selectChatSource(long)
  assert.equal(selected.text.length,12000);assert.equal(selected.truncated,true)
  assert.notEqual(selected.fingerprint,selectChatSource({...long,content:long.content+'x'}).fingerprint)
  assert.equal(selectChatSource({content:' '}),null)
})

test('chat pinned transport sends bounded untrusted conversation, no identity and shares demo budget',async()=>{
  let calls=0
  const budget=createCloudBudget()
  const chat=createCloudService({key:'test',enabled:true,freeOnly:true,budget,chat:true,fetchImpl:async(url,options)=>{
    calls++
    const body=JSON.parse(options.body),input=JSON.parse(body.input)
    assert.equal(body.store,false);assert.equal(body.tools,undefined);assert.equal(body.previous_interaction_id,undefined)
    assert.equal(input.question,request.question);assert.deepEqual(input.history,[])
    assert.equal(input.userId,undefined);assert.equal(input.SOURCE[0].text,text)
    assert.match(body.system_instruction,/không đáng tin/iu)
    return provider()
  }})
  const source=selectChatSource({content:text,title:'Demo',sourceRevision:1})
  assert.equal((await chat.generate({userId:1,request:{...request,mode:'ask'},source})).answer,output.answer)
  const demo=createCloudService({key:'test',enabled:true,freeOnly:true,budget,fetchImpl:async()=>{calls++;return provider()}})
  await assert.rejects(demo.generate({userId:1,request:{mode:'summary',questionId:'concepts'},source}),{code:'CLOUD_LIMIT'})
  assert.equal(calls,1)
})

test('chat production router denies initial access/selection and discards delayed revoked results',async()=>{
  let user={id:1,authVersion:0},calls=0,active=true,mutation=()=>{}
  let lesson={id:11,title:'Test',content:text,sourceRevision:1,course:{instructorId:1,enrollments:[{userId:2}]}}
  const prisma={lesson:{findUnique:async()=>lesson},user:{findUnique:async()=>({isActive:active,authVersion:0})}}
  const service={configured:()=>true,generate:async()=>{calls++;mutation();return output}}
  const app=express();app.use(express.json());app.use('/api/courses/lessons',createLessonChatRouter({prisma,service,authenticate:(req,res,next)=>{if(!user)return res.status(401).json({error:'auth'});req.user=user;next()}}))
  const server=app.listen(0,'127.0.0.1');await once(server,'listening')
  const base=`http://127.0.0.1:${server.address().port}/api/courses/lessons/11/gemini-chat`
  const post=(body=request)=>fetch(base,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  try {
    assert.equal((await post({...request,consent:false})).status,400)
    user=null;assert.equal((await post()).status,401)
    for(const role of ['ADMIN','INSTRUCTOR','STUDENT']){user={id:3,authVersion:0,role};assert.equal((await post()).status,403)}
    user={id:1,authVersion:0};assert.equal((await post({...request,sourceRevision:0})).status,409)
    assert.equal((await post({...request,sourceType:'DOCUMENT'})).status,409);assert.equal(calls,0)
    const cap=await(await fetch(base)).json();assert.equal(cap.source.type,'LESSON_CONTENT');assert.equal(cap.source.text,undefined)
    assert.equal((await fetch(base,{method:'HEAD'})).status,200);assert.equal(calls,0)
    for(const id of [1,2]){user={id,authVersion:0};assert.equal((await post()).status,200)}
    mutation=()=>{active=false};assert.equal((await post()).status,401);active=true
    mutation=()=>{lesson={...lesson,course:{instructorId:9,enrollments:[]}}};assert.equal((await post()).status,403)
    user={id:9,authVersion:0};mutation=()=>{lesson={...lesson,content:text+' changed'}};assert.equal((await post()).status,409)
  } finally {server.closeAllConnections();await new Promise(r=>server.close(r))}
})
