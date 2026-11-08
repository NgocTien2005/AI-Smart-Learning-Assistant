import { validateDemoArguments, verifyTarget, runWorker } from './demo-seed/target.mjs'
try {
  const options = validateDemoArguments(process.argv.slice(2), {isTTY:!!process.stdout.isTTY && !!process.stdin.isTTY})
  const target = await verifyTarget(options)
  const result = runWorker(target)
  // Public allowlist: never print internal access/manifest payloads.
  console.log(JSON.stringify({project:target.project,api:target.api,database:target.database,status:result.status,counts:result.counts,created:result.created}))
  if (result.status === 'created' && options.privateConsole) {
    console.log('\nPRIVATE DEMO ACCESS - keep this console private; no transcript/screenshots. Passwords are generated once and never reissued by seed.\n')
    for (const user of result.access) console.log(`${user.key} | ${user.email} | ${user.password}`)
  }
} catch (error) {
  console.error(/^DEMO_[A-Z_]+$/.test(error.message) ? error.message : 'DEMO_FAILED: raw output suppressed')
  if(error.possibleOrphanFiles?.length) console.error(JSON.stringify({possibleOrphanFiles:error.possibleOrphanFiles,cleanup:'not attempted; separate ownership review required'}))
  process.exitCode = 1
}
