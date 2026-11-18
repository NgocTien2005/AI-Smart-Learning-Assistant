import { validateFreeDeployTarget } from '../src/utils/freeDeployTarget.js'
import { validateAdminBootstrap } from '../src/utils/adminBootstrap.js'

let prisma
try {
  validateFreeDeployTarget(process.env)
  validateAdminBootstrap(process.env)
  if (!process.env.DOTENV_CONFIG_PATH) throw new Error('Explicit isolated dotenv path required')
  if (process.argv.includes('--check-only')) {
    console.log('Free admin configuration shape accepted; database not contacted.')
  } else {
    ;({ prisma } = await import('../src/lib/prisma.js'))
    if (await prisma.user.count() !== 0) throw new Error('Target is not empty')
    await import('./create-admin.mjs')
  }
} catch {
  console.error('Free admin bootstrap refused or failed; no automatic retry. Check target/configuration privately.')
  process.exitCode = 1
} finally { await prisma?.$disconnect() }
