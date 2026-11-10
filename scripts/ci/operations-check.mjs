import { randomBytes } from 'node:crypto'

export function assertOperationsTarget(target) {
  try {
    if (!/^lumina-acceptance-ci-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(target.project || '') || target.project.length > 63) throw new Error()
    const url = new URL(target.baseUrl)
    const port = Number(url.port)
    if (!Number.isInteger(port) || port < 1024 || port > 65535 || [8080, 8081, 8082, 8083, 8084].includes(port)) throw new Error()
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.pathname !== '/api' || url.search || url.hash || url.username || url.password || target.database !== 'lumina_acceptance') throw new Error()
    if (!['db', 'backend', 'frontend'].every(s => /^[a-f0-9]{64}$/.test(target.containers?.[s] || ''))) throw new Error()
  } catch { throw new Error('OPERATIONS_TARGET') }
}

export function assertPrivateAccessLog(raw, marker) {
  if (!raw.trim() || raw.includes(marker)) throw new Error('OPERATIONS_LOG')
  const records = raw.trim().split(/\r?\n/).filter(line => line.startsWith('{'))
  if (!records.length) throw new Error('OPERATIONS_LOG')
  for (const line of records) {
    let r
    try { r = JSON.parse(line) } catch { throw new Error('OPERATIONS_LOG') }
    if (Object.keys(r).sort().join(',') !== 'bytes,seconds,status' || ![r.status, r.bytes, r.seconds].every(Number.isFinite)) throw new Error('OPERATIONS_LOG')
  }
}

// Called only after createIntegrationTarget has reverified actual HTTP/DB identity.
// No arbitrary backup paths, restore targets or external archives are accepted.
export async function verifyOperations(target, docker) {
  assertOperationsTarget(target)
  const { db, backend, frontend } = target.containers
  const suffix = randomBytes(8).toString('hex')
  const restored = 'lumina_restore_' + suffix
  const marker = 'synthetic-canary-' + suffix
  const psql = (database, sql) => docker(['exec', db, 'psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-U', 'lumina_acceptance', '-d', database, '-c', sql])
  if (await psql(target.database, 'SELECT COUNT(*) FROM "User";') !== '0') throw new Error('OPERATIONS_NOT_EMPTY')
  await docker(['exec', frontend, 'nginx', '-t'])
  const expected = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'x-frame-options': 'SAMEORIGIN', 'permissions-policy': 'camera=(), microphone=(), geolocation=()' }
  const origin = new URL(target.baseUrl).origin
  const probes = [
    ['/reset-password?token=' + marker, {}],
    ['/api/health?token=' + marker, {}],
    ['/api/not-found/' + marker, {}],
    ['/api/auth/login?token=' + marker, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + marker, Referer: origin + '/' + marker }, body: JSON.stringify({ email: marker, password: marker }) }],
    ['/api/health', { method: 'UNSUPPORTED' + suffix }],
  ]
  const statuses = []
  for (const [pathname, options] of probes) {
    const response = await fetch(origin + pathname, { ...options, signal: AbortSignal.timeout(10000) })
    for (const [key, value] of Object.entries(expected)) if (response.headers.get(key) !== value) throw new Error('OPERATIONS_HEADERS')
    statuses.push(response.status)
    await response.body?.cancel()
  }
  const logs = await docker(['logs', frontend])
  assertPrivateAccessLog(logs, marker)
  for (const id of [db, backend, frontend]) {
    const config = JSON.parse(await docker(['inspect', '--format', '{{json .HostConfig.LogConfig}}', id]))
    if (config.Type !== 'json-file' || config.Config['max-size'] !== '10m' || config.Config['max-file'] !== '3') throw new Error('OPERATIONS_ROTATION')
  }
  // This project was freshly allocated and has completed its scoped HTTP cleanup.
  // Keep the source fixture and restored DB; never DROP or reset a database.
  await psql(target.database, 'CREATE TABLE "_OperationsFixture" (id integer PRIMARY KEY, value text NOT NULL); INSERT INTO "_OperationsFixture" VALUES (1, \'synthetic recovery fixture\');')
  const dump = '/tmp/lumina-' + suffix + '.dump'
  if (await psql('postgres', `SELECT COUNT(*) FROM pg_database WHERE datname='${restored}';`) !== '0') throw new Error('OPERATIONS_DESTINATION_EXISTS')
  await docker(['exec', db, 'pg_dump', '-U', 'lumina_acceptance', '-d', target.database, '--format=custom', '--no-owner', '--no-acl', '--file', dump])
  await docker(['exec', db, 'createdb', '-U', 'lumina_acceptance', '--template=template0', restored])
  await docker(['exec', db, 'pg_restore', '-U', 'lumina_acceptance', '-d', restored, '--exit-on-error', '--no-owner', '--no-acl', dump])
  const sql = 'SELECT (SELECT COUNT(*) FROM "User")::text || \':\' || (SELECT COUNT(*) FROM "_prisma_migrations")::text || \':\' || (SELECT value FROM "_OperationsFixture" WHERE id=1);'
  if (await psql(target.database, sql) !== await psql(restored, sql)) throw new Error('OPERATIONS_RESTORE_MISMATCH')
  const file = 'operations-' + suffix + '.txt'
  const archive = '/tmp/lumina-' + suffix + '.tar'
  const output = '/tmp/lumina-restore-' + suffix
  await docker(['exec', backend, 'node', '--input-type=module', '-e', `import{writeFileSync}from'node:fs';writeFileSync('/app/uploads/${file}','Synthetic upload recovery fixture');`])
  const digest = await docker(['exec', backend, 'sha256sum', '/app/uploads/' + file])
  await docker(['exec', backend, 'tar', '-cf', archive, '-C', '/app/uploads', file])
  await docker(['exec', backend, 'mkdir', output])
  await docker(['exec', backend, 'tar', '-xf', archive, '-C', output])
  const restoredDigest = await docker(['exec', backend, 'sha256sum', output + '/' + file])
  if (digest.split(/\s/)[0] !== restoredDigest.split(/\s/)[0]) throw new Error('OPERATIONS_FILE_MISMATCH')
  return { headers: true, probeStatuses: statuses, proxyCanaryAbsent: true, accessFieldsAllowlisted: true, loggingRotation: true, databaseRestored: true, uploadDigestMatched: true, restoreDatabase: restored, retainedSyntheticFixtureRows: 1, retainedSyntheticUploadFiles: 1, archivesPublished: false, realProviderRequests: 0 }
}
