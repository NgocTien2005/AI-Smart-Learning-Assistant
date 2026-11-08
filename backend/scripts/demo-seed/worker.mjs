// Internal pipe only: the host must never log the access payload.
let prisma
try {
  let input = ''
  for await (const chunk of process.stdin) {input += chunk; if (input.length > 8192) throw new Error('DEMO_INPUT')}
  const proof = JSON.parse(input)
  if (process.env.LUMINA_DEMO_ALLOWED !== 'true') throw new Error('DEMO_NOT_ENABLED')
  const origin = new URL(process.env.APP_ORIGIN)
  const api = new URL(proof.api)
  if (!['localhost','127.0.0.1'].includes(origin.hostname) || origin.protocol !== 'http:' || origin.port !== api.port || origin.port === '8081') throw new Error('DEMO_NOT_ENABLED')
  ;({prisma} = await import('../../src/lib/prisma.js'))
  const [identity] = await prisma.$queryRawUnsafe('SELECT current_database() AS database, host(inet_server_addr()) AS address')
  if (identity.database !== proof.database || identity.address !== proof.address || !['lumina_acceptance','lumina_lms'].includes(identity.database)) throw new Error('DEMO_DATABASE_IDENTITY')
  const {uploadDirectory} = await import('../../src/config/env.js')
  const {seedDemo} = await import('./seed.mjs')
  process.stdout.write(JSON.stringify({ok:true,...await seedDemo({prisma,uploadDirectory,mode:proof.mode})}))
} catch (error) {
  process.stdout.write(JSON.stringify({ok:false,code:/^DEMO_[A-Z_]+$/.test(error.message)?error.message:'DEMO_WORKER_FAILED',possibleOrphanFiles:Array.isArray(error.orphanFiles)?error.orphanFiles.filter(n=>/^demo-v2-[a-f0-9-]+\.(pdf|txt|md|csv)$/.test(n)):[]}))
} finally {await prisma?.$disconnect()}
