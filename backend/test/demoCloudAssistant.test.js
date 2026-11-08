import test from 'node:test'
import assert from 'node:assert/strict'
import {validateCloudRequest,proveDemoSource,createCloudService,validateCloudOutput} from '../src/services/demoCloudAssistant.js'
import {buildDataset} from '../scripts/demo-seed/dataset.mjs'
import {createDemoCloudRouter} from '../src/routes/demoCloudAssistant.js'
import express from 'express'
import {once} from 'node:events'

test('cloud rejects arbitrary text, URLs and invalid finite choices before any egress',()=>{
  for(const body of [{},{mode:'ask',questionId:'private'},{mode:'summary',questionId:'concepts',text:'private'},{mode:'summary',questionId:'concepts',url:'http://localhost'},null])assert.throws(()=>validateCloudRequest(body))
  assert.equal(validateCloudRequest({mode:'summary',questionId:'concepts'}).mode,'summary')
})

test('cloud source proof accepts exact original owned source and denies real/modified content',async()=>{
  const original=buildDataset().courses[0].lessons[0]
  const registry={version:2,manifest:{datasetId:'lumina-demo-v2',version:2,courses:[{key:'course1',id:10,lessons:[101,102,103,104,105,106]}]}}
  const prisma={demoSeedDataset:{findUnique:async()=>registry}}
  const lesson={...original,id:101,courseId:10,documentUrl:null,sourceRevision:0}
  assert.ok((await proveDemoSource(prisma,lesson)).text.includes('Thuật toán'))
  for(const changed of [{...lesson,content:lesson.content+' private'},{...lesson,title:'Private title'},{...lesson,id:500},{...lesson,documentUrl:'unowned.pdf'}])assert.equal(await proveDemoSource(prisma,changed),null)
})

test('cloud output rejects fabricated citations, invalid answer keys and non-grounded success',()=>{
  const sources=[{id:'S1',text:'Thuật toán là dãy bước hữu hạn giải quyết một bài toán xác định.'}]
  const good={answer:'Giải bài toán bằng các bước hữu hạn.',insufficient:false,citations:[{sourceId:'S1',quote:sources[0].text}],questions:[]}
  assert.equal(validateCloudOutput(good,'summary',sources).insufficient,false)
  for(const bad of [{...good,citations:[]},{...good,citations:[{sourceId:'S2',quote:sources[0].text}]},{...good,citations:[{sourceId:'S1',quote:'Một nội dung hoàn toàn không có trong nguồn.'}]},{...good,password:'not allowed'}])assert.throws(()=>validateCloudOutput(bad,'summary',sources))
})

const passage='Thuật toán là dãy bước hữu hạn giải quyết một bài toán xác định.'
const source={title:'Demo',text:passage,sources:[{id:'S1',text:passage}],revision:0}
const answer={answer:'Chia bài toán thành các bước hữu hạn để kiểm chứng kết quả.',insufficient:false,citations:[{sourceId:'S1',quote:passage}],questions:[]}
function providerResponse(value=answer,patch={}) {return Response.json({status:'completed',model:'gemini-3.8-flash',steps:[{type:'thought',summary:'never expose'},{type:'model_output',content:[{type:'text',text:JSON.stringify(value)}]}],...patch})}

test('cloud bounded pinned transport supports all four modes and emits only finite approved data',async()=>{
  let calls=0,time=0
  const service=createCloudService({key:'unit-only',enabled:true,freeOnly:true,now:()=>time,fetchImpl:async(url,options)=>{
    calls++
    assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/interactions')
    assert.equal(options.redirect,'error')
    const body=JSON.parse(options.body),input=JSON.parse(body.input)
    assert.equal(body.store,false);assert.equal(body.model,'gemini-3.8-flash');assert.equal(body.generation_config.max_output_tokens,3072)
    assert.equal(body.tools,undefined);assert.equal(body.previous_interaction_id,undefined)
    assert.deepEqual(Object.keys(input),['action','question','lesson','SOURCE'])
    const output=input.action==='quiz'?{...answer,questions:Array.from({length:3},(_,i)=>({question:`Câu hỏi demo số ${i+1}: chọn định nghĩa phù hợp?`,options:['Đáp án đúng','Phương án sai A','Phương án sai B','Phương án sai C'],correctIndex:0,explanation:'Căn cứ định nghĩa nguyên văn trong bài học.',sourceId:'S1',quote:passage}))}:answer
    return providerResponse(output)
  }})
  for(const mode of ['ask','explain','summary','quiz']) {
    const result=await service.generate({userId:1,request:{mode,questionId:'concepts'},source})
    assert.equal(result.mode,mode);assert.equal(result.model,'gemini-3.8-flash');assert.equal(JSON.stringify(result).includes('never expose'),false)
    time+=21000
  }
  assert.equal(calls,4)
})

test('cloud never retries configuration/provider/output/limit failures',async()=>{
  let calls=0,time=0
  const disabled=createCloudService({key:'unit-only',freeOnly:false,enabled:true,fetchImpl:async()=>{calls++;return providerResponse()}})
  await assert.rejects(disabled.generate({userId:1,request:{mode:'summary',questionId:'concepts'},source}),{code:'CLOUD_NOT_CONFIGURED'})
  assert.equal(calls,0)
  for(const response of [()=>new Response('private provider error',{status:403}),()=>providerResponse(answer,{status:'incomplete'}),()=>providerResponse(answer,{model:'other-model'}),()=>providerResponse(answer,{steps:[{type:'function_call'}]}),()=>new Response('x'.repeat(131073)),()=>providerResponse({...answer,citations:[]})]) {
    const service=createCloudService({key:'unit-only',freeOnly:true,enabled:true,fetchImpl:async()=>{calls++;return response()}})
    const before=calls
    await assert.rejects(service.generate({userId:1,request:{mode:'summary',questionId:'concepts'},source}))
    assert.equal(calls,before+1)
  }
  const limited=createCloudService({key:'unit-only',freeOnly:true,enabled:true,now:()=>time,fetchImpl:async()=>providerResponse()})
  for(let i=0;i<20;i++){await limited.generate({userId:1,request:{mode:'summary',questionId:'concepts'},source});time+=21000}
  await assert.rejects(limited.generate({userId:2,request:{mode:'summary',questionId:'concepts'},source}),{code:'CLOUD_LIMIT'})
})

test('cloud router denies unauthorized/non-demo/modified input before provider and discards revoked session results',async()=>{
  const original=buildDataset().courses[0].lessons[0]
  let user={id:1,authVersion:0},calls=0,queries=0,active=true,lesson={...original,id:101,courseId:10,documentUrl:null,sourceRevision:0,course:{instructorId:1,enrollments:[]}}
  const prisma={lesson:{findUnique:async()=>{queries++;return lesson}},user:{findUnique:async()=>({isActive:active,authVersion:0})},demoSeedDataset:{findUnique:async()=>({version:2,manifest:{datasetId:'lumina-demo-v2',version:2,courses:[{key:'course1',id:10,lessons:[101,102,103,104,105,106]}]}})}}
  const service={configured:()=>true,generate:async()=>{calls++;return {provider:'Gemini',model:'gemini-3.8-flash',...answer}}}
  const app=express();app.use(express.json());app.use('/api/courses/lessons',createDemoCloudRouter({prisma,service,authenticate:(req,res,next)=>{if(!user)return res.status(401).json({error:'auth'});req.user=user;next()}}))
  const server=app.listen(0,'127.0.0.1');await once(server,'listening')
  const base=`http://127.0.0.1:${server.address().port}/api/courses/lessons/101/cloud-assistant`
  const post=body=>fetch(base,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  try {
    assert.equal((await post({mode:'summary',questionId:'concepts',text:'private'})).status,400);assert.equal(queries,0)
    user=null;assert.equal((await post({mode:'summary',questionId:'concepts'})).status,401)
    user={id:2,authVersion:0};assert.equal((await post({mode:'summary',questionId:'concepts'})).status,403)
    user={id:1,authVersion:0};lesson={...lesson,content:'Modified private content'};assert.equal((await post({mode:'summary',questionId:'concepts'})).status,403);assert.equal(calls,0)
    lesson={...lesson,content:original.content};const capability=await(await fetch(base)).json();assert.equal(capability.eligible,true);assert.equal(calls,0)
    assert.equal((await fetch(base,{method:'HEAD'})).status,200);assert.equal(calls,0)
    assert.equal((await post({mode:'summary',questionId:'concepts'})).status,200);assert.equal(calls,1)
    active=false;assert.equal((await post({mode:'summary',questionId:'concepts'})).status,401);assert.equal(calls,2)
  } finally {server.closeAllConnections();await new Promise(r=>server.close(r))}
})

test('cloud timeout, busy and provider429 fail without automatic continuation or retry',async()=>{
  let finish,calls=0
  const busy=createCloudService({key:'unit-only',enabled:true,freeOnly:true,fetchImpl:async()=>{calls++;return new Promise(r=>{finish=r})}})
  const first=busy.generate({userId:1,request:{mode:'summary',questionId:'concepts'},source})
  await assert.rejects(busy.generate({userId:2,request:{mode:'summary',questionId:'concepts'},source}),{code:'CLOUD_LIMIT'})
  finish(providerResponse());await first;assert.equal(calls,1)
  const limited=createCloudService({key:'unit-only',enabled:true,freeOnly:true,fetchImpl:async()=>{calls++;return new Response('not logged',{status:429})}})
  await assert.rejects(limited.generate({userId:1,request:{mode:'summary',questionId:'concepts'},source}),{code:'CLOUD_PROVIDER_LIMIT',status:429})
  assert.equal(calls,2)
  const timeout=createCloudService({key:'unit-only',enabled:true,freeOnly:true,timeoutMs:5,fetchImpl:async()=>{calls++;throw new DOMException('Timeout','TimeoutError')}})
  await assert.rejects(timeout.generate({userId:1,request:{mode:'summary',questionId:'concepts'},source}),{code:'CLOUD_TIMEOUT',status:504})
  assert.equal(calls,3)
})
