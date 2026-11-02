import { spawnSync } from 'node:child_process'

// Never infer a database target from TEST_API_URL or the enclosing checkout.
export const createIntegrationTarget = (env = process.env, run = spawnSync) => {
  const project = env.TEST_COMPOSE_PROJECT
  const base = env.TEST_API_URL
  if (!/^lumina-acceptance-[a-z0-9-]+$/.test(project || '') || !base) {
    throw new Error('Integration requires explicit TEST_COMPOSE_PROJECT=lumina-acceptance-* and TEST_API_URL for an isolated acceptance stack')
  }
  let url
  try { url = new URL(base) } catch { throw new Error('Integration target URL is invalid; value suppressed') }
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port || url.pathname !== '/api' || url.username || url.password || url.search || url.hash) {
    throw new Error('Integration target must be an explicit loopback http://127.0.0.1:PORT/api URL without credentials')
  }
  const docker = (args, input) => {
    const result = run('docker', args, { encoding: 'utf8', stdio: 'pipe', shell: false, input })
    if (result.status !== 0) throw new Error('Isolated integration Docker operation failed; raw SQL/container environment suppressed')
    return result.stdout.trim()
  }
  const services = {}
  for (const service of ['db', 'backend', 'frontend']) {
    const ids = docker(['ps', '--filter', `label=com.docker.compose.project=${project}`, '--filter', `label=com.docker.compose.service=${service}`, '--format', '{{.ID}}']).split(/\r?\n/).filter(Boolean)
    if (ids.length !== 1) throw new Error(`Expected exactly one running isolated ${service} container`)
    const parts = docker(['inspect', '--format', '{{json .Id}}|{{json .Config.Labels}}|{{json .NetworkSettings.Networks}}|{{json .NetworkSettings.Ports}}|{{json .Mounts}}|{{json .State}}', ids[0]]).split('|').map(x => JSON.parse(x))
    const record = Object.fromEntries(['id', 'labels', 'networks', 'ports', 'mounts', 'state'].map((key, index) => [key, parts[index]]))
    services[service] = record
  }
  for (const [service, record] of Object.entries(services)) {
    if (record.labels['com.docker.compose.project'] !== project || record.labels['com.docker.compose.service'] !== service || record.labels['io.lumina.acceptance'] !== 'true') throw new Error('Container acceptance identity mismatch')
    if (!Object.keys(record.networks).length || Object.keys(record.networks).some(name => !name.startsWith(project + '_'))) throw new Error('Acceptance network is shared or mismatched')
    if (record.mounts.some(m => m.Type !== 'volume' || !m.Name.startsWith(project + '_'))) throw new Error('Acceptance storage is shared or mismatched')
    if (record.state.Status !== 'running' || service !== 'frontend' && record.state.Health?.Status !== 'healthy') throw new Error('Acceptance stack is not healthy')
  }
  if (!Object.keys(services.db.networks).some(name => name in services.backend.networks && name in services.frontend.networks)) throw new Error('Acceptance services do not share their isolated network')
  const bindings = services.frontend.ports['80/tcp'] || []
  if (!bindings.some(p => p.HostIp === '127.0.0.1' && p.HostPort === url.port)) throw new Error('HTTP port does not belong to the selected isolated frontend')
  const database = 'lumina_acceptance'
  const user = 'lumina_acceptance'
  const query = (sql) => docker(['exec', '-i', services.db.id, 'psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-U', user, '-d', database], sql)
  if (query('SELECT current_database();') !== database) throw new Error('Acceptance database mismatch')
  const probe = `const { prisma } = await import('./src/lib/prisma.js'); try { const [identity] = await prisma.$queryRawUnsafe('SELECT current_database() AS database, host(inet_server_addr()) AS address'); process.stdout.write(JSON.stringify(identity)); } finally { await prisma.$disconnect(); }`
  const backendDatabase = JSON.parse(docker(['exec', services.backend.id, 'node', '--input-type=module', '-e', probe]))
  const databaseAddresses = Object.values(services.db.networks).map(network => network.IPAddress).filter(Boolean)
  if (backendDatabase.database !== database || !databaseAddresses.includes(backendDatabase.address)) throw new Error('Backend database connection does not match the isolated target')
  return { baseUrl: url.href, project, database, user, containers: Object.fromEntries(Object.entries(services).map(([s, c]) => [s, c.id])), query }
}
