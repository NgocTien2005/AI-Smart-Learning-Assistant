import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function executable(command, args) {
  if (command !== 'npm') return { command, args }
  const bin = path.dirname(process.execPath)
  const cli = [path.join(bin, 'node_modules/npm/bin/npm-cli.js'), path.resolve(bin, '../lib/node_modules/npm/bin/npm-cli.js')].find(p => existsSync(p))
  if (!cli) throw new Error('npm CLI unavailable in the selected Node installation')
  return { command: process.execPath, args: [cli, ...args] }
}

export function runCommand(command, args, { cwd = repoRoot, env = process.env, timeoutMs = 900000, signal } = {}) {
  return new Promise(resolve => {
    const started = Date.now()
    let child, timer, killTimer, reason, stdout = '', stderr = '', finished = false
    const finish = exitCode => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      clearTimeout(killTimer)
      signal?.removeEventListener('abort', abort)
      resolve({ exitCode, durationMs: Date.now() - started, stdout, stderr })
    }
    const stop = () => {
      if (!child?.pid) return
      if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
      else {
        // npm starts test/build descendants. Stop the entire owned process group.
        try { process.kill(-child.pid, 'SIGTERM') } catch { /* Already exited. */ }
        killTimer = setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL') } catch { /* Already exited. */ } }, 3000)
        killTimer.unref()
      }
    }
    const abort = () => { reason = 130; stop() }
    if (signal?.aborted) { finish(130); return }
    try {
      const actual = executable(command, args)
      child = spawn(actual.command, actual.args, { cwd, env, shell: false, detached: process.platform !== 'win32', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
      child.stdout.on('data', data => { if (stdout.length < 8000000) stdout += data.toString() })
      child.stderr.on('data', data => { if (stderr.length < 8000000) stderr += data.toString() })
      child.on('error', () => finish(reason || 1))
      child.on('close', code => finish(reason || (Number.isInteger(code) ? code : 1)))
      signal?.addEventListener('abort', abort, { once: true })
      timer = setTimeout(() => { reason = 124; stop() }, timeoutMs)
    } catch { finish(1) }
  })
}

export function safeCommandRecord(command, cwd, result) {
  return { command, cwd, durationMs: result.durationMs || 0, exitCode: result.exitCode, status: result.exitCode === 0 ? 'passed' : 'failed' }
}

export function publicContext() {
  const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe' })
  return { time: new Date().toISOString(), revision: /^[a-f0-9]{40,64}$/.test(process.env.GITHUB_SHA || '') ? process.env.GITHUB_SHA : head.stdout?.trim() || 'unavailable', sourceType: process.env.GITHUB_ACTIONS === 'true' ? 'GitHub-hosted checkout' : 'local working tree; see source manifest', node: process.version, platform: process.platform }
}

export async function writeSummary(job, summary) {
  const dir = path.join(repoRoot, 'ci-results', job)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2))
}

export async function prepareJob(job) {
  const dir = path.join(repoRoot, 'ci-results', job)
  await mkdir(dir, { recursive: true })
  const emptyEnv = path.join(dir, '.empty.env')
  await writeFile(emptyEnv, '')
  const jwt = randomBytes(48).toString('hex')
  if (process.env.GITHUB_ACTIONS === 'true') process.stdout.write(`::add-mask::${jwt}\n`)
  // Explicit dotenv path and overrides keep local .env / SMTP / DB credentials out.
  const env = { ...process.env, DOTENV_CONFIG_PATH: emptyEnv, JWT_SECRET: jwt, DATABASE_URL: 'postgresql://unit:unit@127.0.0.1:1/unit', SMTP_USER: '', SMTP_APP_PASSWORD: '', GOOGLE_CLIENT_ID: '', VITE_GOOGLE_CLIENT_ID: '', GEMINI_API_KEY: '', GEMINI_FREE_ONLY_CONFIRMED: 'false', LUMINA_DEMO_ALLOWED: 'false', NODE_ENV: 'test', CI: 'true' }
  return { dir, emptyEnv, env, context: publicContext() }
}

export function exportHttpEvidence(raw, target) {
  if (!raw || raw.project !== target.project || raw.baseUrl !== target.baseUrl || raw.database !== target.database || raw.remainingOwnedUsers !== 0 || !Array.isArray(raw.requests) || !raw.requests.length || !Array.isArray(raw.resources)) throw new Error('Missing, mismatched or incomplete integration evidence')
  const requests = raw.requests.map(entry => {
    const approvedPath = /^\/api\/(?:auth\/(?:register|login|me|forgot-password|reset-password|change-password|google\/(?:challenge|login|link))|admin\/users(?:\/\d+)?|courses(?:\/join|\/\d+(?:\/(?:students|lessons|assignments|enrollment))?|\/lessons\/\d+(?:\/(?:document(?:\/process)?|progress|chat|summary|quizzes))?|\/assignments\/\d+(?:\/submission|\/submissions(?:\/\d+)?)?|\/quiz-attempts\/\d+(?:\/(?:draft|submit))?)?)$/
    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(entry.method) || typeof entry.path !== 'string' || !approvedPath.test(entry.path)) throw new Error('Unsafe HTTP evidence shape')
    const safe = { method: entry.method, path: entry.path }
    if (Number.isInteger(entry.status) && entry.status >= 100 && entry.status < 600) safe.status = entry.status
    else if (['TypeError', 'AbortError', 'TimeoutError', 'Error'].includes(entry.failure)) safe.failure = entry.failure
    else throw new Error('Missing HTTP outcome')
    return safe
  })
  const resources = raw.resources.map(entry => {
    if (!['user', 'course', 'lesson', 'assignment', 'submission', 'attempt'].includes(entry.kind) || !Number.isSafeInteger(entry.id) || entry.id <= 0) throw new Error('Unsafe resource evidence shape')
    return { kind: entry.kind, id: entry.id }
  })
  return { project: target.project, baseUrl: target.baseUrl, database: target.database, requests, resources, remainingOwnedUsers: 0 }
}
