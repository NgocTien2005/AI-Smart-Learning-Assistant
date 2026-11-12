param([switch]$PrivateConsole)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
if (!$PrivateConsole) {
    # Interactive window is required so only the user can enter the private key.
    Start-Process -FilePath 'powershell.exe' -WorkingDirectory $repo -ArgumentList @('-NoExit', '-NoProfile', '-File', ('"' + $PSCommandPath + '"'), '-PrivateConsole')
    Write-Output 'Opened private Gemini chat setup. Enter key there only; no transcript/screenshots.'
    exit
}
Set-Location -LiteralPath $repo
Write-Output 'Use Gemini FREE with project billing DISABLED. Free inputs/outputs may be reviewed and used for improvement.'
Write-Output 'Chat sends questions, recent turns and the explicitly selected authorized lesson source. Never send confidential, personal or sensitive data.'
$confirmation = Read-Host 'Type FREE_SELECTED_SOURCE_CHAT after checking billing is disabled and accepting this scope'
if ($confirmation -cne 'FREE_SELECTED_SOURCE_CHAT') { throw 'Free-only source scope not confirmed; stopped.' }
$secureKey = Read-Host 'Gemini API key (hidden; never paste into chat)' -AsSecureString
$pointer = [IntPtr]::Zero
try {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    $env:GEMINI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    if ([string]::IsNullOrWhiteSpace($env:GEMINI_API_KEY)) { throw 'Empty key; stopped.' }
    $env:GEMINI_FREE_ONLY_CONFIRMED = 'true'
    $env:GEMINI_CHAT_ALLOWED = 'true'
    node scripts/configure-demo-cloud.mjs
    $result = $LASTEXITCODE
    Write-Output ('Backend configuration exit code: ' + $result)
    if ($result -ne 0) { throw 'Backend not ready. No model request sent. Check Docker Desktop and the local app first.' }
    Write-Output 'Chat configuration submitted. Open an authorized lesson and choose Chat Gemini. No model request sent by setup.'
} finally {
    if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    foreach ($name in @('GEMINI_API_KEY','GEMINI_FREE_ONLY_CONFIRMED','GEMINI_CHAT_ALLOWED')) { [Environment]::SetEnvironmentVariable($name, $null, 'Process') }
    $secureKey.Dispose()
}
