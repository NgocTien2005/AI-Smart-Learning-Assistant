import test from 'node:test'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {mkdtempSync,writeFileSync,unlinkSync,rmdirSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root=fileURLToPath(new URL('../../../',import.meta.url))
// Never read the developer's .env or print resolved configuration/secret values.
function resolveConfig(patch={},web=true){
  const dir=mkdtempSync(path.join(tmpdir(),'lumina-web-config-')),empty=path.join(dir,'empty.env')
  writeFileSync(empty,'')
  try{
    const env={...process.env,POSTGRES_PASSWORD:'a'.repeat(64),JWT_SECRET:'b'.repeat(96),LUMINA_DOMAIN:'lms.example.invalid',APP_ORIGIN:'',FRONTEND_PORT:'8080',SMTP_USER:'',SMTP_APP_PASSWORD:'',GEMINI_API_KEY:'',GEMINI_CHAT_ALLOWED:'false',GEMINI_FREE_ONLY_CONFIRMED:'false',ADMIN_BOOTSTRAP_NAME:'',ADMIN_BOOTSTRAP_EMAIL:'',ADMIN_BOOTSTRAP_PASSWORD:'',...patch}
    const r=spawnSync('docker',['compose','-p','lumina-web-config-test','--env-file',empty,'-f','compose.yaml',...(web?['-f','compose.web.yaml']:[]),'config','--format','json'],{cwd:root,env,encoding:'utf8',windowsHide:true,timeout:20000})
    return {exitCode:r.status,config:r.status===0?JSON.parse(r.stdout):null}
  }finally{unlinkSync(empty);rmdirSync(dir)}
}
test('web configuration exclusively publishes frontend on loopback and keeps persistent internal services',()=>{
  const r=resolveConfig();assert.equal(r.exitCode,0,'Compose configuration resolution failed; output suppressed')
  const {frontend,backend,db}=r.config.services
  assert.equal(frontend.ports.length,1);assert.equal(frontend.ports[0].host_ip,'127.0.0.1');assert.equal(String(frontend.ports[0].published),'18080');assert.equal(frontend.ports[0].target,80)
  assert.equal(backend.ports,undefined);assert.equal(db.ports,undefined)
  assert.equal(backend.environment.APP_ORIGIN,'https://lms.example.invalid');assert.equal(backend.environment.CORS_ORIGIN,backend.environment.APP_ORIGIN)
  assert.equal(backend.environment.LUMINA_DEMO_ALLOWED,'false')
  assert.ok(db.volumes.some(v=>v.source==='postgres_data'));assert.ok(backend.volumes.some(v=>v.source==='uploads_data'))
  assert.equal(backend.logging.options['max-size'],'10m');assert.ok(backend.healthcheck)
})
test('web configuration fails closed when required domain or secrets are missing',()=>{
  for(const key of ['LUMINA_DOMAIN','POSTGRES_PASSWORD','JWT_SECRET'])assert.notEqual(resolveConfig({[key]:''}).exitCode,0,'Missing '+key+' must fail')
})
test('optional Gemini configuration is server-only and independent of disabled demo',()=>{
  const r=resolveConfig({GEMINI_API_KEY:'synthetic-not-a-real-key',GEMINI_CHAT_ALLOWED:'true',GEMINI_FREE_ONLY_CONFIRMED:'true',LUMINA_DEMO_ALLOWED:'true'})
  assert.equal(r.exitCode,0)
  assert.equal(r.config.services.backend.environment.GEMINI_API_KEY,'synthetic-not-a-real-key')
  assert.equal(r.config.services.backend.environment.GEMINI_CHAT_ALLOWED,'true');assert.equal(r.config.services.backend.environment.GEMINI_FREE_ONLY_CONFIRMED,'true')
  assert.equal(r.config.services.backend.environment.LUMINA_DEMO_ALLOWED,'false')
  assert.deepEqual(r.config.services.frontend.build.args,{VITE_API_URL:''})
})
test('default development compose remains unchanged without web override',()=>{
  const r=resolveConfig({},false);assert.equal(r.exitCode,0)
  assert.equal(String(r.config.services.frontend.ports[0].published),'8080')
  assert.equal(r.config.services.backend.environment.APP_ORIGIN,'http://localhost:8080')
})
