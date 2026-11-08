param([switch]$PrivateConsole)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
if (!$PrivateConsole) {
    # Intentionally visible: the operator must see one-time generated credentials.
    # No transcript, redirect, credential file or chat output.
    Start-Process -FilePath 'powershell.exe' -WorkingDirectory $repo -ArgumentList @('-NoExit', '-NoProfile', '-File', ('"' + $PSCommandPath + '"'), '-PrivateConsole')
    Write-Output 'Opened private demo console. Keep credentials there; do not share screenshots.'
    exit
}
Set-Location -LiteralPath $repo
node backend/scripts/seed-demo.mjs --project ai-smart-learning-assistant --api http://localhost:8080/api --apply --private-console
if ($LASTEXITCODE -ne 0) { Write-Output 'Demo apply failed; no success claimed. Keep this console for the safe error code.' }
