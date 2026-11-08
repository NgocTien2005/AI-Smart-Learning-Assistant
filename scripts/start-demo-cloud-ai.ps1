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
    docker compose -f compose.yaml -f compose.dev.yaml up -d --build --no-deps --wait --wait-timeout 120 backend *> $null
    $result = $LASTEXITCODE
    Write-Output ('Backend configuration command exit code: ' + $result)
    if ($result -ne 0) { throw 'Backend did not become ready. No model request sent.' }
    Write-Output 'Private configuration submitted. Report readiness only; use the app for explicit demo requests. No model request was sent by this launcher.'
} finally {
    if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    [Environment]::SetEnvironmentVariable('GEMINI_API_KEY', $null, 'Process')
    [Environment]::SetEnvironmentVariable('GEMINI_FREE_ONLY_CONFIRMED', $null, 'Process')
    $secureKey.Dispose()
}
