import {afterEach,test,vi} from 'vitest'
import assert from 'node:assert/strict'
import {cleanup,render,screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {SessionProvider} from '../app/SessionContext.jsx'
import AuthPage from '../pages/AuthPage.jsx'
import {clearSession} from '../services/api.js'

afterEach(()=>{cleanup();clearSession();vi.unstubAllEnvs()})
test('password sign-in and recovery stay available with no OAuth control or SDK',()=>{
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID','obsolete.apps.googleusercontent.com')
  globalThis.fetch=async()=>{throw Error('No provider requests expected')}
  render(<MemoryRouter initialEntries={['/auth']}><SessionProvider><AuthPage/></SessionProvider></MemoryRouter>)
  assert.equal(screen.getByRole('button',{name:'Đăng nhập',exact:true}).disabled,false)
  assert.ok(screen.getByLabelText('Email'))
  assert.ok(screen.getByLabelText('Mật khẩu'))
  assert.ok(screen.getByRole('button',{name:'Quên mật khẩu?'}))
  assert.equal(screen.queryByRole('button',{name:/Google/}),null)
  assert.equal(document.querySelector('script[src*="accounts.google.com"]'),null)
})
