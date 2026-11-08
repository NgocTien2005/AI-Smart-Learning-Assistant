import { spawnSync } from 'node:child_process'

export function validateDemoArguments(args, { isTTY = false } = {}) {
  const options = {}
  for (let i = 0; i < args.length; i++) {
    const name = args[i]
    if (!['--project','--api','--dry-run','--apply','--private-console','--acceptance'].includes(name) || name in options) throw new Error('DEMO_ARGUMENTS')
    options[name] = ['--project','--api'].includes(name) ? args[++i] : true
  }
  const project = options['--project']
  const isolated = /^lumina-acceptance-ci-demo-[a-z0-9-]+$/.test(project || '')
  if ((!isolated && project !== 'ai-smart-learning-assistant') || project.length > 63) throw new Error('DEMO_PROJECT')
  let api
  try { api = new URL(options['--api']) } catch { throw new Error('DEMO_API') }
  if (api.protocol !== 'http:' || !['localhost','127.0.0.1'].includes(api.hostname) || !api.port || api.pathname !== '/api' || api.username || api.password || api.search || api.hash || api.port === '8081' || (!isolated && api.port !== '8080') || (isolated && [8080,8082,8083,8084].includes(Number(api.port)))) throw new Error('DEMO_API')
  if (Boolean(options['--apply']) === Boolean(options['--dry-run'])) throw new Error('DEMO_MODE')
  if (options['--acceptance'] && !isolated) throw new Error('DEMO_ACCEPTANCE')
  if (options['--apply'] && !(options['--acceptance'] && isolated) && !(options['--private-console'] && isTTY)) throw new Error('DEMO_PRIVATE_TTY_REQUIRED')
  return { project, api: api.href, mode: options['--apply'] ? 'apply' : 'dry-run', isolated, privateConsole: !!options['--private-console'], acceptance: !!options['--acceptance'] }
}

export function docker(args, input) {
  const result = spawnSync('docker', args, { encoding:'utf8', input, maxBuffer:4*1024*1024, timeout:180000, windowsHide:true })
  if (result.status !== 0) throw new Error('DEMO_DOCKER_OPERATION')
  return result.stdout.trim()
}

export async function verifyTarget(options) {
  const context = docker(['context','show'])
  const endpoint = process.env.DOCKER_HOST || JSON.parse(docker(['context','inspect','--format','{{json .Endpoints.docker.Host}}',context]))
  if (process.env.DOCKER_HOST && process.env.DOCKER_CONTEXT || !/^(unix|npipe):\/\//.test(endpoint)) throw new Error('DEMO_LOCAL_DAEMON_REQUIRED')
  const records = {}
  for (const service of ['db','backend','frontend']) {
    const ids = docker(['ps','-q','--filter',`label=com.docker.compose.project=${options.project}`,'--filter',`label=com.docker.compose.service=${service}`]).split(/\r?\n/).filter(Boolean)
    if (ids.length !== 1) throw new Error('DEMO_SERVICE_COUNT')
    const [id,labels,networks,ports,mounts,state] = docker(['inspect','--format','{{json .Id}}|{{json .Config.Labels}}|{{json .NetworkSettings.Networks}}|{{json .NetworkSettings.Ports}}|{{json .Mounts}}|{{json .State}}',ids[0]]).split('|').map(x => JSON.parse(x))
    if (labels['com.docker.compose.project'] !== options.project || labels['com.docker.compose.service'] !== service || options.isolated && labels['io.lumina.acceptance'] !== 'true' || Object.keys(networks).length === 0 || Object.keys(networks).some(n => !n.startsWith(options.project+'_')) || mounts.some(m => m.Type !== 'volume' || !m.Name.startsWith(options.project+'_')) || state.Status !== 'running' || service !== 'frontend' && state.Health?.Status !== 'healthy') throw new Error('DEMO_RESOURCE_IDENTITY')
    records[service] = {id,networks,ports}
  }
  const url = new URL(options.api)
  if (!(records.frontend.ports['80/tcp'] || []).some(p => p.HostPort === url.port && (options.isolated ? p.HostIp === '127.0.0.1' : ['127.0.0.1','0.0.0.0'].includes(p.HostIp)))) throw new Error('DEMO_HTTP_BINDING')
  if (!Object.keys(records.db.networks).some(n => n in records.backend.networks && n in records.frontend.networks)) throw new Error('DEMO_NETWORK')
  const probe = `const {prisma}=await import('./src/lib/prisma.js');try {const [r]=await prisma.$queryRawUnsafe('SELECT current_database() AS database, host(inet_server_addr()) AS address');process.stdout.write(JSON.stringify({...r,allowed:process.env.LUMINA_DEMO_ALLOWED==='true'}));}finally{await prisma.$disconnect()}`
  const proof = JSON.parse(docker(['exec',records.backend.id,'node','--input-type=module','-e',probe]))
  if (!proof.allowed || proof.database !== (options.isolated ? 'lumina_acceptance' : 'lumina_lms') || !Object.values(records.db.networks).some(n => n.IPAddress === proof.address)) throw new Error('DEMO_DATABASE_IDENTITY')
  if (!(await fetch(options.api+'/health',{signal:AbortSignal.timeout(10000)})).ok) throw new Error('DEMO_HTTP_HEALTH')
  return {...options,backend:records.backend.id,database:proof.database,address:proof.address}
}

export function runWorker(target) {
  const result = JSON.parse(docker(['exec','-i',target.backend,'node','scripts/demo-seed/worker.mjs'],JSON.stringify({mode:target.mode,database:target.database,address:target.address,api:target.api})))
  if (!result.ok) {
    const error = new Error(['DEMO_COLLISION','DEMO_OWNERSHIP_CHANGED','DEMO_NOT_ENABLED','DEMO_DATABASE_IDENTITY','DEMO_DOCUMENT_INVALID'].includes(result.code) ? result.code : 'DEMO_WORKER_FAILED')
    error.possibleOrphanFiles=Array.isArray(result.possibleOrphanFiles)?result.possibleOrphanFiles.filter(n=>/^demo-v2-[a-f0-9-]+\.(pdf|txt|md|csv)$/.test(n)):[]
    throw error
  }
  return result
}
