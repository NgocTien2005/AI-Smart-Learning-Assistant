import {spawnSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import path from 'node:path'
import {validateDemoArguments,verifyTarget} from '../backend/scripts/demo-seed/target.mjs'

// Docker progress belongs on stderr even on success. Keep both native streams
// away from PowerShell 5.1's error stream; always propagate the actual exit code.
// No log/temp file can contain environment values or raw build output.
export function configureDemoBackend({run=spawnSync}={}) {
  try {
    const result=run('docker',['compose','-f','compose.yaml','-f','compose.dev.yaml','up','-d','--build','--no-deps','--wait','--wait-timeout','120','backend'],{cwd:fileURLToPath(new URL('..',import.meta.url)),stdio:'ignore',shell:false,windowsHide:true,timeout:900000})
    return Number.isInteger(result.status)&&result.status>=0?result.status:1
  } catch {return 1}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  let code=1
  try {
    if(!process.env.GEMINI_API_KEY||process.env.GEMINI_FREE_ONLY_CONFIRMED!=='true')throw new Error('Private configuration required')
    await verifyTarget(validateDemoArguments(['--project','ai-smart-learning-assistant','--api','http://localhost:8080/api','--dry-run']))
    code=configureDemoBackend()
  } catch { /* Only the safe numeric outcome leaves this process. */ }
  process.stdout.write(JSON.stringify({configurationExitCode:code})+'\n')
  process.exitCode=code
}
