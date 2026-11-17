import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareJob, repoRoot, runCommand, safeCommandRecord, writeSummary } from './common.mjs'

export async function runPackage(mode, { run = runCommand, prepare = prepareJob, persist = writeSummary } = {}) {
  if (!['frontend', 'backend', 'integration-deps'].includes(mode)) throw new Error('Select frontend or backend, or integration-deps')
  const packageDir = mode === 'frontend' ? 'frontend' : 'backend'
  const setup = await prepare(mode)
  const commands = mode === 'integration-deps' ? [['npm', ['ci']]] : mode === 'frontend' ? [['npm', ['ci']], ['npm', ['test']], ['npm', ['run', 'lint']], ['npm', ['run', 'build']]] : [['npm', ['ci']], ['npm', ['test']], ['npm', ['test', '--', '--test-name-pattern=quiz']], [process.execPath, ['--test', '../scripts/ci/test/ci.test.mjs', '../scripts/ci/test/operations.test.mjs', '../scripts/ci/test/web-deploy.test.mjs']]]
  const summary = { ...setup.context, job: mode, commands: [], exitCode: 0 }
  let installFailed = false
  for (const [command, args] of commands) {
    const display = (command === process.execPath ? 'node' : command) + ' ' + args.join(' ')
    if (installFailed) { summary.commands.push({ command: display, cwd: packageDir, status: 'skipped', exitCode: null, reason: 'dependency installation failed' }); continue }
    const result = await run(command, args, { cwd: path.join(repoRoot, packageDir), env: setup.env, timeoutMs: 600000 })
    summary.commands.push(safeCommandRecord(display, packageDir, result))
    if (result.exitCode !== 0 && summary.exitCode === 0) summary.exitCode = result.exitCode
    if (args[0] === 'ci' && result.exitCode !== 0) installFailed = true
  }
  await persist(mode, summary)
  return summary
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const summary = await runPackage(process.argv[2])
    process.stdout.write(JSON.stringify(summary) + '\n')
    process.exitCode = summary.exitCode
  } catch { process.stderr.write('Package CI helper failed; no raw output/configuration exported.\n'); process.exitCode = 1 }
}
