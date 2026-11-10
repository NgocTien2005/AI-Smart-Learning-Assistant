import { randomBytes } from 'node:crypto'
import { createServer } from 'node:net'
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createIntegrationTarget } from '../../backend/scripts/integration-target.mjs'
import { repoRoot, runCommand, safeCommandRecord, publicContext, writeSummary, exportHttpEvidence } from './common.mjs'

export function validateProject(project) {
  if (!/^lumina-acceptance-ci-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project || '') || project.length > 63) throw new Error('Invalid isolated CI project name')
  return project
}
export function validatePort(port) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || [8080, 8081, 8082, 8083, 8084].includes(port)) throw new Error('Invalid or reserved CI loopback port')
  return port
}
export async function assertFreshProject(project, docker) {
  validateProject(project)
  for (const args of [
    ['ps', '-aq', '--filter', `label=com.docker.compose.project=${project}`],
    ['ps', '-aq', '--filter', `name=^/${project}[-_]`],
    ['volume', 'ls', '-q', '--filter', `label=com.docker.compose.project=${project}`],
    ['volume', 'ls', '-q', '--filter', `name=^${project}_`],
    ['network', 'ls', '-q', '--filter', `label=com.docker.compose.project=${project}`],
    ['network', 'ls', '-q', '--filter', `name=^${project}_`],
  ]) if ((await docker(args)).trim()) throw new Error('Isolated project resource already exists; refusing reuse')
}
export async function runLifecycle({ preflight, start, exercise, cleanup }) {
  let attempted = false, stage = 'preflight', failure = null, cleanupResult = { attempted: false, success: null }
  try { await preflight(); attempted = true; stage = 'start'; await start(); stage = 'exercise'; await exercise() }
  catch { failure = { stage, code: 'CI_STAGE_FAILED' } }
  finally {
    if (attempted) {
      cleanupResult = { attempted: true, success: false }
      try { await cleanup(); cleanupResult.success = true } catch { /* Failure is retained below; never converted to success. */ }
    }
  }
  return { failure, cleanup: cleanupResult, exitCode: failure || cleanupResult.success === false ? 1 : 0 }
}
export async function freePort(requested) {
  if (requested !== undefined && !/^\d{4,5}$/.test(requested)) throw new Error('Invalid explicit CI port')
  const port = requested === undefined ? 0 : validatePort(Number(requested))
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', () => reject(new Error('CI loopback port is unavailable')))
    server.listen(port, '127.0.0.1', () => { const selected = server.address().port; server.close(() => { try { resolve(validatePort(selected)) } catch (error) { reject(error) } }) })
  })
}

export function dockerEndpoint(env, contextEndpoint) {
  if (env.DOCKER_HOST && env.DOCKER_CONTEXT) throw new Error('Refusing conflicting Docker overrides')
  const endpoint = env.DOCKER_HOST || contextEndpoint
  if (!/^(unix|npipe):\/\//.test(endpoint || '')) throw new Error('A local Docker endpoint is required')
  return endpoint
}

export async function resetEvidence(dir) {
  await mkdir(dir, { recursive: true })
  for (const name of ['http.json', 'summary.json']) {
    try { await unlink(path.join(dir, name)) } catch (error) { if (error.code !== 'ENOENT') throw error }
  }
}

export async function runIntegration() {
  const dir = path.join(repoRoot, 'ci-results/integration')
  await resetEvidence(dir)
  const project = validateProject(process.env.CI_TEST_PROJECT || `lumina-acceptance-ci-${Date.now()}-${randomBytes(4).toString('hex')}`)
  const privateDir = path.join(dir, 'private-' + randomBytes(6).toString('hex'))
  await mkdir(privateDir)
  const emptyEnv = path.join(privateDir, 'empty.env')
  await writeFile(emptyEnv, '')
  const dbSecret = randomBytes(24).toString('hex'), jwt = randomBytes(48).toString('hex')
  if (process.env.GITHUB_ACTIONS === 'true') for (const secret of [dbSecret, jwt]) process.stdout.write(`::add-mask::${secret}\n`)
  const env = { ...process.env, ACCEPTANCE_DB_PASSWORD: dbSecret, ACCEPTANCE_JWT_SECRET: jwt, DOTENV_CONFIG_PATH: emptyEnv, SMTP_USER: '', SMTP_APP_PASSWORD: '', GOOGLE_CLIENT_ID: '', VITE_GOOGLE_CLIENT_ID: '', GEMINI_API_KEY: '', GEMINI_FREE_ONLY_CONFIRMED: 'false' }
  const summary = { ...publicContext(), job: 'integration', project, commands: [], targetVerifiedBeforeProvisioning: false, suiteEvidenceAvailable: false, namedVolumesRemoved: false }
  const controller = new AbortController()
  const cancel = () => controller.abort()
  process.once('SIGINT', cancel); process.once('SIGTERM', cancel)
  const docker = async (args, { cleanup = false } = {}) => {
    const result = await runCommand('docker', args, { env, timeoutMs: 900000, signal: cleanup ? undefined : controller.signal })
    if (result.exitCode !== 0) throw new Error('Docker operation failed; raw output suppressed')
    return result.stdout.trim()
  }
  let port, target
  const compose = ['compose', '--env-file', emptyEnv, '-f', path.join(repoRoot, 'compose.acceptance.yaml'), '-p', project]
  const checked = async (command, args, display, cwd = repoRoot, cleanup = false) => {
    const result = await runCommand(command, args, { cwd, env, timeoutMs: cleanup ? 90000 : 900000, signal: cleanup ? undefined : controller.signal })
    summary.commands.push(safeCommandRecord(display, path.relative(repoRoot, cwd) || '.', result))
    if (result.exitCode !== 0) throw new Error('Required CI command failed; raw output suppressed')
  }
  const outcome = await runLifecycle({
    preflight: async () => {
      // Do not let an externally selected remote daemon become a test target.
      const context = await docker(['context', 'show'])
      dockerEndpoint(env, JSON.parse(await docker(['context', 'inspect', '--format', '{{json .Endpoints.docker.Host}}', context])))
      if (await docker(['info', '--format', '{{.OSType}}']) !== 'linux') throw new Error('A local Linux Docker engine is required')
      await assertFreshProject(project, docker)
      port = await freePort(process.env.CI_TEST_PORT)
      env.ACCEPTANCE_PORT = String(port)
      env.TEST_COMPOSE_PROJECT = project
      env.TEST_API_URL = `http://127.0.0.1:${port}/api`
      env.TEST_EVIDENCE_PATH = path.join(privateDir, 'suite.json')
      summary.http = env.TEST_API_URL
      summary.provisioningScope = 'only the newly allocated empty isolated project; production suite owns its registered test accounts/resources'
      await writeSummary('integration', summary)
    },
    start: () => checked('docker', [...compose, 'up', '--build', '--wait', '--wait-timeout', '180'], 'docker compose <explicit fresh project/file/empty env> up --build --wait --wait-timeout 180'),
    exercise: async () => {
      target = createIntegrationTarget(env)
      if (!(await fetch(target.baseUrl + '/health', { signal: AbortSignal.timeout(10000) })).ok || target.query('SELECT COUNT(*) FROM "User";') !== '0') throw new Error('Fresh target health/empty database check failed')
      summary.targetVerifiedBeforeProvisioning = true
      summary.database = target.database
      summary.containers = target.containers
      summary.retainedVolumes = [project + '_postgres_data', project + '_uploads_data']
      await writeSummary('integration', summary)
      await checked('docker', ['exec', target.containers.backend, './node_modules/.bin/prisma', 'migrate', 'status'], 'docker exec <verified isolated backend> prisma migrate status')
      await checked('npm', ['run', 'test:integration'], 'npm run test:integration', path.join(repoRoot, 'backend'))
      const exported = exportHttpEvidence(JSON.parse(await readFile(env.TEST_EVIDENCE_PATH, 'utf8')), target)
      await writeFile(path.join(dir, 'http.json'), JSON.stringify(exported, null, 2))
      summary.suiteEvidenceAvailable = true
      summary.remainingOwnedUsers = exported.remainingOwnedUsers
      summary.httpOperations = exported.requests.length
      summary.recordedResources = exported.resources.length
      if (target.query('SELECT COUNT(*) FROM "User";') !== '0') throw new Error('Owned test data remains in new project')
      // Revalidate the backend's actual DB connection immediately before recovery.
      target = createIntegrationTarget(env)
      const { verifyOperations } = await import('./operations-check.mjs')
      summary.operations = await verifyOperations(target, async args => {
        const result = await runCommand('docker', args, { env, timeoutMs: 90000, signal: controller.signal })
        summary.commands.push(safeCommandRecord(`docker ${args[0]} <verified operations fixture; arguments suppressed>`, '.', result))
        if (result.exitCode !== 0) throw new Error('Required operations command failed; raw output suppressed')
        return (args[0] === 'logs' ? result.stdout + result.stderr : result.stdout).trim()
      })
    },
    cleanup: async () => {
      const ids = (await docker(['ps', '-aq', '--filter', `label=com.docker.compose.project=${project}`], { cleanup: true })).split(/\r?\n/).filter(Boolean)
      for (const id of ids) {
        const parts = (await docker(['inspect', '--format', '{{json .Config.Labels}}|{{json .Mounts}}|{{json .NetworkSettings.Networks}}', id], { cleanup: true })).split('|').map(p => JSON.parse(p))
        const [labels, mounts, networks] = parts
        if (labels['com.docker.compose.project'] !== project || labels['io.lumina.acceptance'] !== 'true' || !['db', 'backend', 'frontend'].includes(labels['com.docker.compose.service']) || mounts.some(m => m.Type !== 'volume' || !m.Name.startsWith(project + '_')) || Object.keys(networks).some(n => !n.startsWith(project + '_'))) throw new Error('Cleanup ownership check failed')
      }
      await checked('docker', [...compose, 'down'], 'docker compose <this run only> down (named volumes retained)', repoRoot, true)
    },
  })
  Object.assign(summary, outcome)
  if (controller.signal.aborted) summary.exitCode = 130
  await writeSummary('integration', summary)
  process.removeListener('SIGINT', cancel); process.removeListener('SIGTERM', cancel)
  return summary
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const result = await runIntegration(); process.stdout.write(JSON.stringify(result) + '\n'); process.exitCode = result.exitCode }
  catch {
    await writeSummary('integration', { ...publicContext(), job: 'integration', commands: [], failure: { stage: 'setup', code: 'CI_SETUP_FAILED' }, exitCode: 1 })
    process.stderr.write('Integration CI setup failed; raw configuration/output suppressed.\n')
    process.exitCode = 1
  }
}
