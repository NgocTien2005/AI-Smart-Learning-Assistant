import { afterEach, test, vi } from 'vitest'
import assert from 'node:assert/strict'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { SessionProvider, useSession } from '../app/SessionContext.jsx'
import AuthPage from '../pages/AuthPage.jsx'
import AccountPage from '../pages/AccountPage.jsx'
import { clearSession } from '../services/api.js'

const user = { id: 7, name: 'Fixture', email: 'fixture@example.invalid', role: 'STUDENT' }
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
let callback
function configured() {
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'fixture.apps.googleusercontent.com')
  window.google = { accounts: { id: { initialize: options => { callback = options.callback }, renderButton: node => { const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Fixture Google provider'; button.onclick = () => callback({ credential: 'synthetic-id-token' }); node.append(button) }, cancel: () => {} } } }
}
function Controls() { const navigate = useNavigate(); const { logout } = useSession(); return <><button onClick={() => navigate('/elsewhere')}>Depart</button><button onClick={() => logout()}>Logout fixture</button></> }
function Location() { const l = useLocation(); return <output>{l.pathname}</output> }
function mount(path = '/auth') { render(<MemoryRouter initialEntries={[path]}><SessionProvider><Controls /><Routes><Route path="/auth" element={<AuthPage />} /><Route path="/account" element={<AccountPage />} /><Route path="*" element={<Location />} /></Routes></SessionProvider></MemoryRouter>) }
afterEach(() => { cleanup(); clearSession(); vi.unstubAllEnvs(); delete window.google; callback = undefined })

test('Google is honestly unavailable without client ID and password sign-in stays enabled', () => {
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
  globalThis.fetch = async () => { throw new Error('Unexpected request') }
  mount()
  assert.equal(screen.getByRole('button', { name: 'Đăng nhập bằng Google' }).disabled, true)
  assert.equal(screen.getByRole('button', { name: 'Đăng nhập', exact: true }).disabled, false)
  assert.ok(screen.getByText(/Google hiện chưa sẵn sàng/))
})

test('Google login uses challenge then existing SessionContext me verification and role routing', async () => {
  configured()
  const calls = []
  globalThis.fetch = async (path, options) => { calls.push(String(path)); if (path.endsWith('/challenge')) return json({ challengeId: 'a'.repeat(64), nonce: 'nonce' }); if (path.endsWith('/google/login')) { assert.equal(JSON.parse(options.body).credential, 'synthetic-id-token'); return json({ token: 'lumina-fixture', user }) } if (path.endsWith('/me')) return json({ user: { ...user, role: 'ADMIN' } }); throw new Error('Unexpected request') }
  mount()
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập bằng Google' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Fixture Google provider' }))
  await screen.findByText('/admin')
  assert.deepEqual(calls, ['/api/auth/google/challenge', '/api/auth/google/login', '/api/auth/me'])
})

test('Departed Google popup callback does not send credentials or install a session', async () => {
  configured()
  let writes = 0
  globalThis.fetch = async path => { if (!path.endsWith('/challenge')) writes++; return json({ challengeId: 'a'.repeat(64), nonce: 'nonce' }) }
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập bằng Google' }))
  await screen.findByRole('button', { name: 'Fixture Google provider' })
  const late = callback
  fireEvent.click(screen.getByRole('button', { name: 'Depart' }))
  await act(async () => late({ credential: 'late-fixture' }))
  assert.equal(writes, 0)
  assert.equal(localStorage.getItem('luminaToken'), null)
})

test('Google preparation gates same-tick clicks and a password submission invalidates its old popup', async () => {
  configured()
  let challenges = 0; let googleWrites = 0
  globalThis.fetch = async path => {
    if (path.endsWith('/challenge')) { challenges++; return json({ challengeId: 'a'.repeat(64), nonce: 'nonce' }) }
    if (path.endsWith('/google/login')) googleWrites++
    return json({ code: 'INVALID_CREDENTIALS', error: 'Fixture wrong password' }, 401)
  }
  mount()
  const start = screen.getByRole('button', { name: 'Đăng nhập bằng Google' })
  act(() => { start.click(); start.click() })
  await screen.findByRole('button', { name: 'Fixture Google provider' })
  assert.equal(challenges, 1)
  const late = callback
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: user.email } })
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'fixture-password' } })
  fireEvent.submit(document.querySelector('form.auth-card'))
  await screen.findByText('Fixture wrong password')
  await act(async () => late({ credential: 'old-popup' }))
  assert.equal(googleWrites, 0)
})

test('Google verification recovery repeats only me, never replays Google authentication', async () => {
  configured(); const calls = []; let me = 0
  globalThis.fetch = async path => {
    calls.push(String(path))
    if (path.endsWith('/challenge')) return json({ challengeId: 'a'.repeat(64), nonce: 'nonce' })
    if (path.endsWith('/google/login')) return json({ token: 'lumina-fixture', user })
    if (path.endsWith('/me')) return ++me === 1 ? json({ error: 'Fixture verification offline' }, 503) : json({ user })
    throw new Error('Unexpected request')
  }
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập bằng Google' })); fireEvent.click(await screen.findByRole('button', { name: 'Fixture Google provider' }))
  await screen.findByText('Fixture verification offline')
  fireEvent.click(screen.getByRole('button', { name: 'Thử xác minh lại' }))
  await screen.findByText('/dashboard')
  assert.equal(calls.filter(path => path.endsWith('/google/login')).length, 1)
  assert.equal(me, 2)
})

test('Google exchange finishing after logout cannot install stale credentials', async () => {
  configured(); let resolve
  globalThis.fetch = async path => path.endsWith('/challenge') ? json({ challengeId: 'a'.repeat(64), nonce: 'nonce' }) : new Promise(done => { resolve = done })
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập bằng Google' })); fireEvent.click(await screen.findByRole('button', { name: 'Fixture Google provider' }))
  fireEvent.click(screen.getByRole('button', { name: 'Logout fixture' }))
  await act(async () => resolve(json({ token: 'late-lumina-fixture', user })))
  assert.equal(localStorage.getItem('luminaToken'), null)
  assert.ok(screen.getByRole('heading', { name: 'Đăng nhập' }))
})

test('Unlinked Google denial never registers and preserves password recovery without automatic replay', async () => {
  configured()
  const calls = []
  globalThis.fetch = async path => { calls.push(String(path)); return path.endsWith('/challenge') ? json({ challengeId: 'a'.repeat(64), nonce: 'nonce' }) : json({ code: 'GOOGLE_NOT_LINKED', error: 'Hãy dùng tài khoản Lumina đã có và liên kết Google trong Tài khoản.' }, 403) }
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập bằng Google' })); fireEvent.click(await screen.findByRole('button', { name: 'Fixture Google provider' }))
  await screen.findByText(/Hãy dùng tài khoản Lumina đã có/)
  assert.deepEqual(calls, ['/api/auth/google/challenge', '/api/auth/google/login'])
  assert.equal(screen.getByRole('button', { name: 'Đăng nhập', exact: true }).disabled, false)
})

test('Account explicitly links matching Google and checks status after uncertain result without replay', async () => {
  configured(); localStorage.setItem('luminaToken', 'lumina-fixture')
  let linked = false; let writes = 0
  globalThis.fetch = async (path, options = {}) => {
    if (path.endsWith('/me')) return json({ user })
    if (path.endsWith('/challenge')) { assert.equal(JSON.parse(options.body).intent, 'link'); return json({ challengeId: 'a'.repeat(64), nonce: 'nonce' }) }
    if (path.endsWith('/google/link') && options.method === 'POST') { writes++; linked = true; throw new TypeError('fixture uncertain network') }
    if (path.endsWith('/google/link')) return json({ linked })
    throw new Error('Unexpected request')
  }
  mount('/account')
  fireEvent.click(await screen.findByRole('button', { name: 'Kiểm tra liên kết Google' }))
  await screen.findByText('Chưa liên kết Google.')
  fireEvent.click(screen.getByRole('button', { name: 'Liên kết Google' })); fireEvent.click(await screen.findByRole('button', { name: 'Fixture Google provider' }))
  await screen.findByText(/Chưa xác định kết quả liên kết/)
  assert.equal(writes, 1)
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra liên kết Google' }))
  await screen.findByText('Đã liên kết Google.')
  assert.equal(writes, 1)
})
