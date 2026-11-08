// Optional real-Chrome acceptance. One fresh profile per run; no existing profile access.
import {spawn} from 'node:child_process'
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {tmpdir} from 'node:os'
const pause=ms=>new Promise(r=>setTimeout(r,ms))
export async function verifyDemoBrowser(target,seeded,{executable,evidenceDirectory}) {
  await mkdir(evidenceDirectory,{recursive:true})
  const profile=await mkdtemp(join(tmpdir(),'lumina-demo-browser-'))
  const child=spawn(executable,['--headless=new','--disable-gpu','--disable-extensions','--disable-background-networking','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true})
  let ws,session,id=0,stage='START'
  const pending=new Map(),outcomes=[]
  const call=(method,params={},attached=true)=>new Promise((accept,reject)=>{
    const key=++id
    const timer=setTimeout(()=>{pending.delete(key);reject(new Error('DEMO_BROWSER_TIMEOUT'))},20000)
    pending.set(key,{accept,reject,timer})
    ws.send(JSON.stringify({id:key,method,params,...(attached?{sessionId:session}:{})}))
  })
  const evaluate=async expression=>(await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true})).result?.value
  async function until(expression) {
    const end=Date.now()+20000
    while(Date.now()<end){if(await evaluate(expression))return;await pause(150)}
    throw new Error('DEMO_BROWSER_PAGE_STATE')
  }
  async function navigate(path) {
    await call('Page.navigate',{url:new URL(path,target.api).href})
    await until('document.readyState==="complete"')
  }
  try {
    let endpoint
    const end=Date.now()+20000
    while(Date.now()<end){try{endpoint=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).split(/\r?\n/);break}catch{await pause(150)}}
    if(!endpoint)throw new Error('DEMO_BROWSER_START')
    ws=new WebSocket(`ws://127.0.0.1:${endpoint[0]}${endpoint[1]}`)
    await new Promise((accept,reject)=>{ws.addEventListener('open',accept,{once:true});ws.addEventListener('error',reject,{once:true})})
    ws.addEventListener('message',e=>{const data=JSON.parse(String(e.data)),p=pending.get(data.id);if(p){pending.delete(data.id);clearTimeout(p.timer);data.error?p.reject(new Error('DEMO_BROWSER_PROTOCOL')):p.accept(data.result)}})
    const created=await call('Target.createTarget',{url:'about:blank'},false)
    session=(await call('Target.attachToTarget',{targetId:created.targetId,flatten:true},false)).sessionId
    await call('Page.enable');await call('Runtime.enable')
    for(const key of ['admin','instructor1','student1']) {
      stage='LOGIN_'+key.toUpperCase()
      const u=seeded.access.find(u=>u.key===key)
      await navigate('/auth');await until('Boolean(document.querySelector("#email"))')
      // Values stay inside this process/CDP pipe, never in evidence or stdout.
      await evaluate(`(()=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;for(const [selector,value]of ${JSON.stringify([['#email',u.email],['#password',u.password]])}){const e=document.querySelector(selector);setter.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}))}const remember=document.querySelector('input[type=checkbox]');if(remember?.checked)remember.click();return true})()`)
      await evaluate('document.querySelector("form button[type=submit]").click();true')
      await until(`location.pathname!=='/auth' && document.body.innerText.includes(${JSON.stringify(key==='admin'?'Quản trị đào tạo':key==='instructor1'?'Giảng viên An':'Học viên 01')}) && !document.body.innerText.includes('Đang xác minh')`)
      for(const [width,height]of [[1280,800],[1440,900]]) {
        await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
        const course=seeded.manifest.courses[0]
        const views=[['home',key==='admin'?'/admin':'/dashboard'],...(key==='admin'?[]:[['lessons',`/courses/${course.id}?section=lessons&lessonId=${course.lessons[0]}`],['cloud',`/courses/${course.id}?section=lessons&lessonId=${course.lessons[0]}&panel=cloud`],['assignments',`/courses/${course.id}?section=assignments`],...(key==='instructor1'?[['students',`/courses/${course.id}?section=students`]]:[])])]
        for(const [label,path]of views) {
          stage=key.toUpperCase()+'_'+width+'_'+label.toUpperCase()
          await navigate(path)
          await until(`document.body.innerText.includes('[Demo]') && !document.body.innerText.includes('Đang tải')`)
          if(label==='cloud') {
            await until(`Boolean(document.querySelector('.demo-cloud-panel')) && document.querySelector('.demo-cloud-panel').innerText.includes('Gemini chưa được cấu hình')`)
            if(!await evaluate(`[...document.querySelectorAll('.demo-cloud-actions button')].every(b=>b.disabled)`))throw new Error('DEMO_BROWSER_DISABLED_CLOUD')
            await evaluate(`document.querySelector('.demo-cloud-panel').scrollIntoView({block:'start'});document.querySelector('.demo-cloud-panel header button').focus();true`)
          }
          const metrics=await evaluate('({width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth})')
          if(metrics.width!==width||metrics.height!==height||metrics.overflow)throw new Error('DEMO_BROWSER_LAYOUT')
          const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})
          await writeFile(join(evidenceDirectory,`${key}-${width}-${label}.png`),Buffer.from(shot.data,'base64'))
          await writeFile(join(evidenceDirectory,`${key}-${width}-${label}.txt`),await evaluate('document.body.innerText'))
          outcomes.push({role:key,viewport:`${width}x${height}`,view:label,observed:true})
        }
      }
      const loggedOut=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Đăng xuất');if(!b)return false;b.click();return true})()`)
      if(!loggedOut)throw new Error('DEMO_BROWSER_LOGOUT')
      await until('location.pathname==="/auth"')
    }
    await call('Target.closeTarget',{targetId:created.targetId},false)
  } catch(error) {
    if(session) {
      try {await writeFile(join(evidenceDirectory,'browser-failure.json'),JSON.stringify({stage,page:await evaluate('({path:location.pathname,text:document.body.innerText})')},null,2))}catch{}
    }
    throw error
  } finally {
    ws?.close();child.kill()
    await new Promise(r=>{if(child.exitCode!==null)r();else{child.once('exit',r);setTimeout(r,5000)}})
    // Exact fresh OS-temp profile owned by this invocation. Never a repository
    // profile or either historical policy-blocked acceptance profile.
    const actual=resolve(profile),root=resolve(tmpdir())
    if(actual.startsWith(root+'\\lumina-demo-browser-')||actual.startsWith(root+'/lumina-demo-browser-')) {
      try{await rm(actual,{recursive:true,maxRetries:0})}catch{outcomes.push({cleanup:'fresh browser profile retained; no alternative deletion attempted'})}
    }
  }
  return outcomes
}
