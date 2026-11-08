import {randomBytes} from 'node:crypto'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
import {repoRoot,runCommand,safeCommandRecord,publicContext,writeSummary} from './common.mjs'
import {assertFreshProject,freePort,runLifecycle,dockerEndpoint,resetEvidence} from './integration.mjs'
import {validateDemoArguments,verifyTarget,runWorker,docker as syncDocker} from '../../backend/scripts/demo-seed/target.mjs'
import {createIntegrationTarget} from '../../backend/scripts/integration-target.mjs'
import {verifyDemo,verifyChangedDemoSource} from '../../backend/scripts/demo-seed/verify.mjs'

const project = `lumina-acceptance-ci-demo-${Date.now()}-${randomBytes(3).toString('hex')}`
const dir = path.join(repoRoot,'ci-results','seed-integration')
await mkdir(dir,{recursive:true})
await resetEvidence(dir)
const emptyEnv = path.join(dir,'.empty.env')
await writeFile(emptyEnv,'')
const env = {...process.env,ACCEPTANCE_DB_PASSWORD:randomBytes(24).toString('hex'),ACCEPTANCE_JWT_SECRET:randomBytes(48).toString('hex'),DOTENV_CONFIG_PATH:emptyEnv,SMTP_USER:'',SMTP_APP_PASSWORD:'',GOOGLE_CLIENT_ID:'',VITE_GOOGLE_CLIENT_ID:'',GEMINI_API_KEY:'',GEMINI_FREE_ONLY_CONFIRMED:'false'}
if(env.GITHUB_ACTIONS==='true') for(const s of [env.ACCEPTANCE_DB_PASSWORD,env.ACCEPTANCE_JWT_SECRET]) console.log(`::add-mask::${s}`)
const compose = ['compose','--env-file',emptyEnv,'-f',path.join(repoRoot,'compose.acceptance.yaml'),'-p',project]
const summary = {...publicContext(),project,job:'seed-integration',commands:[],emailsSent:0,providerRequests:0,namedVolumesRemoved:false}
let target, isolated, seeded
async function checked(args,display) {
  const r = await runCommand('docker',args,{env})
  summary.commands.push(safeCommandRecord(display,'.',r))
  if(r.exitCode!==0) throw new Error('DEMO_DOCKER_OPERATION')
  return r.stdout.trim()
}
const outcome = await runLifecycle({
  preflight:async()=>{
    const context=await checked(['context','show'],'docker context show')
    dockerEndpoint(env,JSON.parse(await checked(['context','inspect','--format','{{json .Endpoints.docker.Host}}',context],'docker context inspect <endpoint only>')))
    await assertFreshProject(project,args=>checked(args,'docker <fresh project ownership inventory>'))
    env.ACCEPTANCE_PORT=String(await freePort())
    env.TEST_COMPOSE_PROJECT=project;env.TEST_API_URL=`http://127.0.0.1:${env.ACCEPTANCE_PORT}/api`
  },
  start:()=>checked([...compose,'up','--build','--wait','--wait-timeout','180'],'docker compose <fresh seed project> up --build --wait'),
  exercise:async()=>{try{
    target=await verifyTarget(validateDemoArguments(['--project',project,'--api',env.TEST_API_URL,'--dry-run']))
    isolated=createIntegrationTarget(env)
    summary.targetVerifiedBeforeProvisioning=true;summary.database=target.database;summary.api=target.api
    await checked(['exec',target.backend,'./node_modules/.bin/prisma','migrate','status'],'docker exec <verified seed backend> prisma migrate status')
    if(isolated.query('SELECT COUNT(*) FROM "User";')!=='0') throw new Error('DEMO_NOT_EMPTY')
    const sentinelPassword=randomBytes(18).toString('base64url')+'aA7!'
    const sentinelEmail=`sentinel-${randomBytes(5).toString('hex')}@fixture.invalid`
    const register=await fetch(target.api+'/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Synthetic sentinel',email:sentinelEmail,password:sentinelPassword,role:'STUDENT'})})
    if(register.status!==201) throw new Error('DEMO_SENTINEL')
    const sentinel=(await register.json()).user
    summary.sentinelId=sentinel.id
    if(runWorker(target).status!=='preview' || isolated.query('SELECT COUNT(*) FROM "User";')!=='1' || isolated.query('SELECT COUNT(*) FROM "DemoSeedDataset";')!=='0') throw new Error('DEMO_DRY_RUN')
    // Owned collision fixture; no real accounts are touched.
    const collision=isolated.query(`INSERT INTO "User" (name,email,password,role) VALUES ('Collision fixture','admin@demo.lumina.invalid','not-a-login','ADMIN') RETURNING id;`)
    let denied=false
    try{runWorker({...target,mode:'apply'})}catch(e){denied=e.message==='DEMO_COLLISION'}
    if(!denied || isolated.query('SELECT COUNT(*) FROM "User";')!=='2' || isolated.query('SELECT COUNT(*) FROM "DemoSeedDataset";')!=='0') throw new Error('DEMO_COLLISION_TEST')
    if(!/^\d+$/.test(collision)) throw new Error('DEMO_FIXTURE_ID')
    isolated.query(`DELETE FROM "User" WHERE id=${collision} AND email='admin@demo.lumina.invalid';`)
    seeded=runWorker({...target,mode:'apply'})
    if(seeded.status!=='created') throw new Error('DEMO_APPLY')
    summary.counts=seeded.counts
    const http=await verifyDemo(target,seeded)
    http.requests.push(...await verifyChangedDemoSource(target,seeded,isolated.query))
    summary.modifiedSourceDenied=true
    await writeFile(path.join(dir,'http.json'),JSON.stringify({project,...http},null,2))
    summary.httpOperations=http.requests.length;summary.coverage=http.coverage
    if(runWorker({...target,mode:'apply'}).status!=='unchanged' || isolated.query('SELECT COUNT(*) FROM "User";')!=='19') throw new Error('DEMO_RERUN')
    // Same generated credentials must still work after a no-op rerun.
    for(const u of [seeded.access.find(u=>u.key==='student1'),{email:sentinelEmail,password:sentinelPassword}]) {
      const r=await fetch(target.api+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:u.email,password:u.password})})
      if(r.status!==200) throw new Error('DEMO_PASSWORD_PRESERVATION')
      await r.body.cancel()
    }
    summary.dryRunNoWrites=true;summary.collisionDenied=true;summary.rerunNoDuplicates=true;summary.preexistingSentinelPreserved=true
    if(process.env.DEMO_BROWSER_ACCEPTANCE==='1') {
      const {verifyDemoBrowser}=await import('../../backend/scripts/demo-seed/browser-verify.mjs')
      summary.browser=await verifyDemoBrowser(target,seeded,{executable:process.env.DEMO_BROWSER_EXECUTABLE || process.env.DEMO_ORCA_EXECUTABLE,evidenceDirectory:path.join(repoRoot,'.artifacts','mvp-completion-20261108','browser')})
    }
  }catch(error){summary.safeFailureCode=/^DEMO_[A-Z_0-9]+$/.test(error.message)?error.message:'DEMO_EXERCISE_FAILED';if(error.possibleOrphanFiles?.length)summary.possibleOrphanFiles=error.possibleOrphanFiles;throw error}},
  cleanup:async()=>{
    // Revalidate exact stack before removing only this run's owned rows.
    if(target) {
      await verifyTarget({...target,mode:'dry-run'})
      if(seeded?.manifest) {
        const ids=seeded.manifest.users.map(u=>u.id)
        if(ids.length!==18 || !ids.every(Number.isSafeInteger)) throw new Error('DEMO_CLEANUP_IDS')
        isolated.query(`BEGIN; DELETE FROM "User" WHERE id IN (${ids.join(',')}); DELETE FROM "DemoSeedDataset" WHERE id='lumina-demo-v2'; COMMIT;`)
      }
      if(Number.isSafeInteger(summary.sentinelId)) isolated.query(`DELETE FROM "User" WHERE id=${summary.sentinelId};`)
      summary.remainingUsers=isolated.query('SELECT COUNT(*) FROM "User";')
      summary.retainedSyntheticDocuments=seeded?.manifest?.files.length || 0
      if(summary.remainingUsers!=='0') throw new Error('DEMO_CLEANUP_REMAINS')
    }
    // No volume removal: scoped run containers/network only.
    const ids=syncDocker(['ps','-aq','--filter',`label=com.docker.compose.project=${project}`]).split(/\r?\n/).filter(Boolean)
    for(const id of ids) {
      const labels=JSON.parse(syncDocker(['inspect','--format','{{json .Config.Labels}}',id]))
      if(labels['com.docker.compose.project']!==project || labels['io.lumina.acceptance']!=='true') throw new Error('DEMO_CLEANUP_OWNERSHIP')
    }
    await checked([...compose,'down'],'docker compose <this seed run only> down (volumes retained)')
    summary.retainedVolumes=[project+'_postgres_data',project+'_uploads_data']
  },
})
Object.assign(summary,outcome)
await writeSummary('seed-integration',summary)
console.log(JSON.stringify(summary))
process.exitCode=summary.exitCode
