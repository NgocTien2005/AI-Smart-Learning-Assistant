import test from 'node:test'
import assert from 'node:assert/strict'
import {once} from 'node:events'

process.env.DATABASE_URL = 'postgresql://unit:unit@127.0.0.1:1/unit'
const {createApp}=await import('../src/app.js')

test('production app retires OAuth endpoints without database/provider access',async()=>{
  const server=createApp().listen(0,'127.0.0.1');await once(server,'listening')
  try{
    for(const authorization of [undefined,'Bearer obsolete-synthetic-token']){
      for(const [method,path] of [['POST','challenge'],['POST','login'],['GET','link'],['POST','link']]){
        const response=await fetch(`http://127.0.0.1:${server.address().port}/api/auth/google/${path}`,{method,headers:{...(authorization?{Authorization:authorization}:{}),...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify({intent:'login',credential:'synthetic'})}:{})})
        assert.equal(response.status,404)
        assert.equal(response.headers.get('set-cookie'),null)
        assert.deepEqual(Object.keys(await response.json()),['error'])
      }
    }
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
})
