import test from 'node:test'
import assert from 'node:assert/strict'
import { createIntegrationTarget } from '../scripts/integration-target.mjs'

const project = 'lumina-acceptance-unit'
const env = { TEST_COMPOSE_PROJECT: project, TEST_API_URL: 'http://127.0.0.1:8082/api' }
const fakeDocker = (change = () => {}, backendDatabase = { database: 'lumina_acceptance', address: '172.31.0.2' }) => {
  const calls = []
  const run = (_command, args, options) => {
    calls.push({ args, input: options.input })
    let output
    if (args[0] === 'ps') output = args.find(x => x.startsWith('label=com.docker.compose.service=')).split('=').at(-1)
    else if (args[0] === 'inspect') {
      const service = args.at(-1)
      const c = { id: service, labels: { 'com.docker.compose.project': project, 'com.docker.compose.service': service, 'io.lumina.acceptance': 'true' }, networks: { [project + '_default']: { IPAddress: service === 'db' ? '172.31.0.2' : '172.31.0.3' } }, ports: service === 'frontend' ? { '80/tcp': [{ HostIp: '127.0.0.1', HostPort: '8082' }] } : {}, mounts: service === 'db' ? [{ Type: 'volume', Name: project + '_postgres_data' }] : [], state: { Status: 'running', Health: { Status: 'healthy' } } }
      change(c, service)
      output = Object.values(c).map(x => JSON.stringify(x)).join('|')
    } else output = args[0] === 'exec' && args[1] === 'backend' ? JSON.stringify(backendDatabase) : 'lumina_acceptance'
    return { status: 0, stdout: output }
  }
  return { run, calls }
}

test('integration refuses missing target and non-loopback/credential URLs before Docker', () => {
  let calls = 0
  const run = () => { calls++; throw new Error('must not run') }
  for (const e of [{}, { ...env, TEST_COMPOSE_PROJECT: 'ai-smart-learning-assistant' }, { ...env, TEST_API_URL: 'invalid URL' }, { ...env, TEST_API_URL: 'http://localhost:8081/api' }, { ...env, TEST_API_URL: 'http://user:secret@127.0.0.1:8082/api' }]) assert.throws(() => createIntegrationTarget(e, run))
  assert.equal(calls, 0)
})

for (const mismatch of ['project', 'network', 'separate-networks', 'volume', 'port', 'health']) test('integration rejects mismatched ' + mismatch + ' before SQL', () => {
  const { run, calls } = fakeDocker((c, service) => {
    if (mismatch === 'project') c.labels['com.docker.compose.project'] = 'existing-local'
    if (mismatch === 'network') c.networks = { existing_local_default: {} }
    if (mismatch === 'separate-networks') c.networks = { [project + '_' + service]: {} }
    if (mismatch === 'volume' && service === 'db') c.mounts[0].Name = 'existing_local_postgres_data'
    if (mismatch === 'port' && service === 'frontend') c.ports['80/tcp'][0].HostPort = '8081'
    if (mismatch === 'health') c.state.Health.Status = 'unhealthy'
  })
  assert.throws(() => createIntegrationTarget(env, run))
  assert.equal(calls.filter(c => c.args[0] === 'exec').length, 0)
})

test('integration verifies database then sends scoped SQL through stdin', () => {
  const { run, calls } = fakeDocker()
  const target = createIntegrationTarget(env, run)
  target.query('SELECT 1;')
  const query = calls.at(-1)
  assert.equal(target.database, 'lumina_acceptance')
  assert.equal(query.args[2], 'db')
  assert.equal(query.input, 'SELECT 1;')
  assert.ok(!query.args.includes('SELECT 1;'))
})

test('integration rejects a backend connected to another database server', () => {
  for (const identity of [{ database: 'local', address: '172.31.0.2' }, { database: 'lumina_acceptance', address: '172.32.0.2' }]) {
    const { run, calls } = fakeDocker(undefined, identity)
    assert.throws(() => createIntegrationTarget(env, run), /Backend database connection/)
    assert.equal(calls.filter(c => c.input && c.input !== 'SELECT current_database();').length, 0)
  }
})
