import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, unlink, rmdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { runCommand, safeCommandRecord, exportHttpEvidence } from '../common.mjs'
import { runPackage } from '../check-package.mjs'
import { validateProject, validatePort, assertFreshProject, runLifecycle, freePort, dockerEndpoint, resetEvidence } from '../integration.mjs'
import { configureDemoBackend } from '../../configure-demo-cloud.mjs'

test('private Gemini launcher isolates native streams and propagates actual Docker failure', () => {
  let recorded
  assert.equal(configureDemoBackend({run:(command,args,options)=>{recorded={command,args,options};return{status:0}}}),0)
  assert.equal(recorded.command,'docker')
  assert.equal(recorded.options.stdio,'ignore')
  assert.equal(recorded.options.shell,false)
  assert.ok(recorded.args.includes('--no-deps'))
  assert.ok(recorded.args.includes('--wait'))
  assert.equal(recorded.args.some(arg=>/key|password|secret/i.test(arg)),false)
  assert.equal(configureDemoBackend({run:()=>({status:7})}),7)
  assert.equal(configureDemoBackend({run:()=>({status:null,signal:'SIGTERM'})}),1)
  assert.equal(configureDemoBackend({run:()=>{throw new Error('not exposed')}}),1)
})

test('package keeps full-suite failure even when later checks pass; never persists raw output', async () => {
  const calls=[];let saved
  const summary=await runPackage('frontend',{prepare:async()=>({env:{},context:{}}),run:async(c,a)=>{calls.push([c,...a].join(' '));return{exitCode:a[0]==='test'?3:0,durationMs:1,stdout:'SENTINEL_PRIVATE_VALUE',stderr:'SECRET_BODY'}},persist:async(_job,s)=>{saved=s}})
  assert.equal(summary.exitCode,3);assert.equal(calls.length,4);assert.ok(calls.includes('npm run build'))
  assert.ok(!JSON.stringify(saved).includes('SENTINEL_PRIVATE_VALUE'));assert.ok(!JSON.stringify(saved).includes('SECRET_BODY'))
})
test('failed dependency install explicitly skips dependent checks',async()=>{
  let calls=0;const summary=await runPackage('backend',{prepare:async()=>({env:{},context:{}}),run:async()=>{calls++;return{exitCode:2,durationMs:1}},persist:async()=>{}})
  assert.equal(calls,1);assert.equal(summary.exitCode,2);assert.ok(summary.commands.slice(1).every(c=>c.status==='skipped'))
})
test('package rejects unknown modes before any executor',async()=>{await assert.rejects(runPackage('deploy'),/frontend or backend/)})

test('integration dependency install uses backend lockfile without rerunning other job checks', async () => {
  const calls = []
  const result = await runPackage('integration-deps', {
    prepare: async () => ({ env: {}, context: {} }),
    run: async (c, a, options) => { calls.push({ c, a, cwd: options.cwd }); return { exitCode: 0 } },
    persist: async () => {},
  })
  assert.equal(result.exitCode, 0)
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0].a, ['ci'])
  assert.equal(path.basename(calls[0].cwd), 'backend')
})
test('command record excludes stdout/stderr and arbitrary properties',()=>{
  const record=safeCommandRecord('npm test','backend',{exitCode:1,durationMs:3,stdout:'TOKEN',stderr:'PASSWORD',env:'JWT_SECRET'})
  assert.deepEqual(Object.keys(record).sort(),['command','cwd','durationMs','exitCode','status'].sort());assert.ok(!JSON.stringify(record).includes('PASSWORD'))
})
test('real child process exits and deadline failures remain nonzero',async()=>{
  assert.equal((await runCommand(process.execPath,['-e','process.exit(7)'],{timeoutMs:2000})).exitCode,7)
  assert.equal((await runCommand(process.execPath,['-e','setInterval(()=>{},1000)'],{timeoutMs:80})).exitCode,124)
})
test('unsafe project names and reserved/invalid ports are refused',()=>{
  for(const p of ['ai-smart-learning-assistant','lumina-acceptance-auth-20261103','lumina-acceptance-ci-UPPER','lumina-acceptance-ci-../x']) assert.throws(()=>validateProject(p))
  assert.doesNotThrow(()=>validateProject('lumina-acceptance-ci-unit-1'))
  for(const p of [0,80,8081,8083,65536,NaN,'8085']) assert.throws(()=>validatePort(p))
  assert.equal(validatePort(18085),18085)
})
for(const resource of ['ps','volume','network']) test('existing '+resource+' refuses project before creation',async()=>{
  const calls=[];await assert.rejects(assertFreshProject('lumina-acceptance-ci-unit',async args=>{calls.push(args);return args[0]===resource?'existing-resource':''}),/already exists/)
  assert.ok(calls.every(a=>!['compose','exec','rm'].includes(a[0])))
})
test('refused target never starts or cleans another stack',async()=>{
  const calls=[];const result=await runLifecycle({preflight:async()=>{throw Error('refused')},start:async()=>calls.push('start'),exercise:async()=>calls.push('write'),cleanup:async()=>calls.push('down')})
  assert.equal(result.exitCode,1);assert.deepEqual(calls,[]);assert.equal(result.failure.stage,'preflight');assert.equal(result.cleanup.attempted,false)
})
test('failed startup still cleans only after fresh-project preflight',async()=>{
  const calls=[];const r=await runLifecycle({preflight:async()=>calls.push('fresh'),start:async()=>{throw Error('build')},exercise:async()=>calls.push('write'),cleanup:async()=>calls.push('down')})
  assert.deepEqual(calls,['fresh','down']);assert.equal(r.exitCode,1);assert.equal(r.cleanup.success,true)
})
test('primary and cleanup failures stay visible together',async()=>{
  const r=await runLifecycle({preflight:async()=>{},start:async()=>{},exercise:async()=>{throw Error('HTTP')},cleanup:async()=>{throw Error('down')}})
  assert.equal(r.exitCode,1);assert.equal(r.failure.stage,'exercise');assert.equal(r.cleanup.success,false)
})
test('cleanup failure cannot pass a successful suite',async()=>{
  const r=await runLifecycle({preflight:async()=>{},start:async()=>{},exercise:async()=>{},cleanup:async()=>{throw Error('down')}})
  assert.equal(r.exitCode,1);assert.equal(r.failure,null)
})
const valid={time:'2026-11-03T00:00:00.000Z',project:'lumina-acceptance-ci-unit',baseUrl:'http://127.0.0.1:18085/api',database:'lumina_acceptance',requests:[{method:'POST',path:'/api/auth/login',status:200,body:'PASSWORD',headers:{Authorization:'TOKEN'}}],resources:[{kind:'user',id:1,password:'HASH'}],remainingOwnedUsers:0,password:'SECRET'}
test('integration export allows public metadata only',()=>{
  const out=exportHttpEvidence(valid,{project:valid.project,baseUrl:valid.baseUrl,database:valid.database})
  for(const secret of ['PASSWORD','TOKEN','HASH','SECRET']) assert.ok(!JSON.stringify(out).includes(secret))
  assert.deepEqual(out.requests,[{method:'POST',path:'/api/auth/login',status:200}]);assert.deepEqual(out.resources,[{kind:'user',id:1}])
})
test('missing/mismatched/unclean evidence or secret query path fails closed',()=>{
  const target={project:valid.project,baseUrl:valid.baseUrl,database:valid.database}
  for(const evidence of [{},{...valid,remainingOwnedUsers:1},{...valid,project:'other'},{...valid,requests:[{method:'GET',path:'/reset-password?token=PRIVATE',status:200}]}]) assert.throws(()=>exportHttpEvidence(evidence,target))
})

test('cancellation preserves nonzero outcome including already aborted calls', async () => {
  const controller = new AbortController()
  const pending = runCommand(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { signal: controller.signal })
  controller.abort()
  assert.equal((await pending).exitCode, 130)
  assert.equal((await runCommand(process.execPath, ['-e', 'process.exit(0)'], { signal: controller.signal })).exitCode, 130)
})

test('explicit occupied port refuses before Compose startup', async () => {
  const { createServer } = await import('node:net')
  const server = createServer()
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  try { await assert.rejects(freePort(String(server.address().port)), /unavailable|reserved/) }
  finally { await new Promise(resolve => server.close(resolve)) }
})

test('Docker endpoint rejects conflicting overrides and remote effective contexts', () => {
  assert.throws(() => dockerEndpoint({ DOCKER_HOST: 'unix:///safe', DOCKER_CONTEXT: 'remote' }, 'ssh://remote'), /conflicting/)
  assert.throws(() => dockerEndpoint({ DOCKER_CONTEXT: 'remote' }, 'ssh://remote'), /local/)
  assert.throws(() => dockerEndpoint({ DOCKER_HOST: 'tcp://remote' }, 'unix:///safe'), /local/)
  assert.equal(dockerEndpoint({}, 'unix:///var/run/docker.sock'), 'unix:///var/run/docker.sock')
})

test('a new attempt removes stale public evidence and preserves other files', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'lumina-ci-evidence-'))
  const kept = path.join(dir, 'private-marker')
  try {
    await writeFile(path.join(dir, 'http.json'), 'OLD_HTTP')
    await writeFile(path.join(dir, 'summary.json'), 'OLD_SUMMARY')
    await writeFile(kept, 'preserve')
    await resetEvidence(dir)
    for (const name of ['http.json', 'summary.json']) await assert.rejects(readFile(path.join(dir, name)), { code: 'ENOENT' })
    assert.equal(await readFile(kept, 'utf8'), 'preserve')
  } finally { await unlink(kept); await rmdir(dir) }
})

test('HTTP evidence rejects unknown endpoints and arbitrary failure strings', () => {
  const target = { project: valid.project, baseUrl: valid.baseUrl, database: valid.database }
  for (const entry of [{ method: 'GET', path: '/api/reset/PRIVATE_TOKEN', status: 200 }, { method: 'GET', path: '/api/auth/me', failure: 'SENSITIVEVALUE' }]) {
    assert.throws(() => exportHttpEvidence({ ...valid, requests: [entry] }, target))
  }
})

test('production evidence accepts the mounted API prefix and actual submission/grading routes', () => {
  const target = { project: valid.project, baseUrl: valid.baseUrl, database: valid.database }
  for (const pathname of ['/api/auth/login', '/api/courses/assignments/1/submission', '/api/courses/assignments/1/submissions/2', '/api/courses/lessons/1/gemini-chat']) {
    assert.equal(exportHttpEvidence({ ...valid, requests: [{ method: 'POST', path: pathname, status: 200 }] }, target).requests[0].path, pathname)
  }
})
