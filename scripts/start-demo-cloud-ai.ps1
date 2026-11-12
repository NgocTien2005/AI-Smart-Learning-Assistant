param([switch]$PrivateConsole)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
if (!$PrivateConsole) {
    Start-Process -FilePath 'powershell.exe' -WorkingDirectory $repo -ArgumentList @('-NoExit', '-NoProfile', '-File', ('"' + $PSCommandPath + '"'), '-PrivateConsole')
    Write-Output 'Opened private Gemini setup console. Enter the key there only; no transcript/screenshots.'
    exit
}
Set-Location -LiteralPath $repo
node backend/scripts/seed-demo.mjs --project ai-smart-learning-assistant --api http://localhost:8080/api --dry-run
if ($LASTEXITCODE -ne 0) { throw 'Verified demo target required; setup stopped.' }
Write-Output 'Use a Google AI Studio FREE project with billing DISABLED. Only synthetic demo sources are permitted.'
$confirmation = Read-Host 'Type FREE_DEMO_ONLY after checking your project has no paid billing'
if ($confirmation -cne 'FREE_DEMO_ONLY') { throw 'Free-only project not confirmed; setup stopped.' }
$secureKey = Read-Host 'Gemini API key (hidden; do not paste into chat)' -AsSecureString
$pointer = [IntPtr]::Zero
try {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    $env:GEMINI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    if ([string]::IsNullOrWhiteSpace($env:GEMINI_API_KEY)) { throw 'Empty key; setup stopped.' }
    $env:GEMINI_FREE_ONLY_CONFIRMED = 'true'
    # This launcher retains the original synthetic/finite demo scope only.
    $env:GEMINI_CHAT_ALLOWED = 'false'
    # Docker build progress on stderr is not an error. The Node bridge drains
    # native streams privately and returns Docker's real exit code on PS5.1.
    node scripts/configure-demo-cloud.mjs
    $result = $LASTEXITCODE
    Write-Output ('Backend configuration command exit code: ' + $result)
    if ($result -ne 0) { throw 'Backend did not become ready. No model request sent.' }
    Write-Output 'Private configuration submitted. Report readiness only; use the app for explicit demo requests. No model request was sent by this launcher.'
} finally {
    if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    [Environment]::SetEnvironmentVariable('GEMINI_API_KEY', $null, 'Process')
    [Environment]::SetEnvironmentVariable('GEMINI_FREE_ONLY_CONFIRMED', $null, 'Process')
    [Environment]::SetEnvironmentVariable('GEMINI_CHAT_ALLOWED', $null, 'Process')
    $secureKey.Dispose()
}
