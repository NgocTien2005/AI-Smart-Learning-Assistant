// Access and tokens live only in this process. Evidence records method/path/status.
export async function verifyDemo(target, seeded) {
  if (!seeded.access || !seeded.manifest) throw new Error('DEMO_INITIAL_ACCESS_REQUIRED')
  const requests = []
  const tokens = new Map()
  async function request(key,path,{method='GET',body,expect=200,binary=false}={}) {
    const response = await fetch(target.api+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(tokens.has(key)?{Authorization:`Bearer ${tokens.get(key)}`}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)})
    requests.push({method,path:'/api'+path,status:response.status})
    if (response.status!==expect) throw new Error(`DEMO_HTTP_EXPECTATION_${response.status}`)
    return binary ? new Uint8Array(await response.arrayBuffer()) : response.status===204 ? null : response.json()
  }
  for (const u of seeded.access) {
    const disabled = u.key==='student-disabled'
    const login = await request(u.key,'/auth/login',{method:'POST',body:{email:u.email,password:u.password},expect:disabled?401:200})
    if (disabled) continue
    tokens.set(u.key,login.token)
    const me = await request(u.key,'/auth/me')
    if (me.user.role!==u.role || 'password' in me.user || 'googleSubject' in me.user) throw new Error('DEMO_PUBLIC_USER')
  }
  const admin = await request('admin','/admin/users')
  if (!Array.isArray(admin.users)) throw new Error('DEMO_ADMIN')
  await request('student1','/admin/users',{expect:403})
  const first = seeded.manifest.courses[0], secondOwner = seeded.manifest.courses[2]
  const cloudPath=`/courses/lessons/${first.lessons[0]}/cloud-assistant`
  await request('student1',cloudPath,{method:'HEAD',binary:true})
  await request('anonymous',cloudPath,{expect:401})
  await request('student2',cloudPath,{expect:403})
  await request('student2',cloudPath,{method:'POST',body:{mode:'summary',questionId:'concepts'},expect:403})
  await request('student1',cloudPath,{method:'POST',body:{mode:'summary',questionId:'concepts',text:'not accepted'},expect:400})
  await request('student1',cloudPath,{method:'POST',body:{mode:'summary',questionId:'concepts'},expect:503})
  await request('instructor1',`/courses/${first.id}/students`)
  await request('instructor1',`/courses/${secondOwner.id}/students`,{expect:403})
  await request('instructor2',`/courses/${first.id}`,{expect:403})
  await request('student2',`/courses/${first.id}`,{expect:403})
  await request('student2',`/courses/lessons/${first.lessons[1]}/document`,{expect:403,binary:true})
  let submitted=0,draft=0,unstarted=0,graded=0,pending=0,notSubmitted=0,docs=0
  for (const course of seeded.manifest.courses) {
    const detail = (await request('student1',`/courses/${course.id}`)).course
    if (detail.lessons.length!==6 || detail.assignments.length!==3) throw new Error('DEMO_COUNTS')
    for (const a of detail.assignments) for (const s of a.submissions) { if(s.grade===null) pending++; else graded++ }
    notSubmitted+=detail.assignments.filter(a=>a.submissions.length===0).length
    for (const lesson of detail.lessons) {
      const cloud=await request('student1',`/courses/lessons/${lesson.id}/cloud-assistant`)
      if(cloud.enabled!==false||cloud.eligible!==true)throw new Error('DEMO_CLOUD_SCOPE')
      if(lesson.documentName) {
        const bytes = await request('student1',`/courses/lessons/${lesson.id}/document`,{binary:true})
        if(bytes.length===0 || lesson.extractionStatus!=='SUCCESS') throw new Error('DEMO_DOCUMENT')
        docs++
      }
      await request('student1',`/courses/lessons/${lesson.id}/summary`)
      const list = await request('student1',`/courses/lessons/${lesson.id}/quizzes`)
      if(list.attempts.length===0) unstarted++
      for(const attempt of list.attempts) {
        const detail = await request('student1',`/courses/quiz-attempts/${attempt.id}`)
        if(attempt.submittedAt) {submitted++;if(attempt.score!==3 || detail.version!==1) throw new Error('DEMO_QUIZ_SUBMITTED')}
        else draft++
        await request('student2',`/courses/quiz-attempts/${attempt.id}`,{expect:404})
      }
    }
  }
  // A different enrolled learner has a resumable draft with no answer key.
  const draftList = await request('student4',`/courses/lessons/${first.lessons[1]}/quizzes`)
  for(const attempt of draftList.attempts) {
    const detail = await request('student4',`/courses/quiz-attempts/${attempt.id}`)
    if(!attempt.submittedAt) {
      if(detail.answers?.length!==4 || detail.answers[0]===null || JSON.stringify(detail.questions).includes('correctIndex')) throw new Error('DEMO_QUIZ_DRAFT')
      draft++
    }
  }
  if(!submitted || !draft || !unstarted || !graded || !pending || !notSubmitted || docs!==26) throw new Error('DEMO_STATE_COVERAGE')
  return {requests,coverage:{submitted,draft,unstarted,graded,pending,notSubmitted,documents:docs},realEmailsSent:0,providerRequests:0}
}

export async function verifyChangedDemoSource(target,seeded,query) {
  if(!target.isolated||!/^lumina-acceptance-ci-demo-/.test(target.project))throw new Error('DEMO_CHANGED_SOURCE_TARGET')
  const course=seeded.manifest.courses[0],id=course.lessons[0]
  if(!Number.isSafeInteger(id)||!Number.isSafeInteger(course.id))throw new Error('DEMO_CHANGED_SOURCE_ID')
  const user=seeded.access.find(u=>u.key==='student1')
  const login=await fetch(target.api+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:user.email,password:user.password})})
  if(login.status!==200)throw new Error('DEMO_CHANGED_SOURCE_LOGIN')
  const {token}=await login.json(),path=`/courses/lessons/${id}/cloud-assistant`,requests=[]
  async function probe(method) {
    const response=await fetch(target.api+path,{method,headers:{Authorization:`Bearer ${token}`,...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify({mode:'summary',questionId:'concepts'})}:{})})
    requests.push({method,path:'/api'+path,status:response.status})
    return {status:response.status,body:await response.json()}
  }
  const changed=query(`UPDATE "Lesson" SET content=content || ' modified' WHERE id=${id} AND "courseId"=${course.id} RETURNING id;`)
  if(changed!==String(id))throw new Error('DEMO_CHANGED_SOURCE_UPDATE')
  try {
    const cap=await probe('GET'),denied=await probe('POST')
    if(cap.status!==200||cap.body.eligible!==false||denied.status!==403||denied.body.code!=='CLOUD_SOURCE_NOT_ALLOWED')throw new Error('DEMO_CHANGED_SOURCE_GUARD')
  } finally {
    const restored=query(`UPDATE "Lesson" SET content=left(content,length(content)-9) WHERE id=${id} AND "courseId"=${course.id} AND right(content,9)=' modified' RETURNING id;`)
    if(restored!==String(id))throw new Error('DEMO_CHANGED_SOURCE_RESTORE')
  }
  const restored=await probe('GET')
  if(restored.status!==200||restored.body.eligible!==true)throw new Error('DEMO_CHANGED_SOURCE_PROOF')
  return requests
}
