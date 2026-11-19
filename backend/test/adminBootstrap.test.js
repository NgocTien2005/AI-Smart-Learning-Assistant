import test from 'node:test'
import assert from 'node:assert/strict'
import {validateAdminBootstrap} from '../src/utils/adminBootstrap.js'

const valid={ADMIN_BOOTSTRAP_NAME:'  Operator  ',ADMIN_BOOTSTRAP_EMAIL:'  Admin@example.invalid  ',ADMIN_BOOTSTRAP_PASSWORD:' 12345678901 '}
test('admin bootstrap accepts ordinary email and preserves password whitespace',()=>{
  assert.deepEqual(validateAdminBootstrap(valid),{name:'Operator',email:'admin@example.invalid',password:valid.ADMIN_BOOTSTRAP_PASSWORD})
  for(const email of ['first.last+ops@example.invalid','sysadmin@school.example'])assert.equal(validateAdminBootstrap({...valid,ADMIN_BOOTSTRAP_EMAIL:email}).email,email)
})
test('admin bootstrap rejects malformed operator input before database work',()=>{
  for(const email of ['no-at','a@b','a b@example.invalid','a@example. invalid','a@@b.invalid',''])assert.throws(()=>validateAdminBootstrap({...valid,ADMIN_BOOTSTRAP_EMAIL:email}),/valid email/)
  for(const name of ['', 'a', 'x'.repeat(81)])assert.throws(()=>validateAdminBootstrap({...valid,ADMIN_BOOTSTRAP_NAME:name}),/NAME/)
  for(const password of [undefined,'x'.repeat(11),'x'.repeat(73)])assert.throws(()=>validateAdminBootstrap({...valid,ADMIN_BOOTSTRAP_PASSWORD:password}),/PASSWORD/)
  for(const length of [12,72])assert.equal(validateAdminBootstrap({...valid,ADMIN_BOOTSTRAP_PASSWORD:'x'.repeat(length)}).password.length,length)
})
