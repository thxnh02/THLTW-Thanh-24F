$ErrorActionPreference = 'Stop'
$backendPath = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$artisanPath = Join-Path $backendPath 'artisan'
$existing = Get-CimInstance Win32_Process -Filter "Name = 'php.exe'" | Where-Object {
    $_.CommandLine -and $_.CommandLine.Contains($artisanPath) -and $_.CommandLine.Contains('--name=ct24f-order-emails')
}
if ($existing) {
    Write-Output 'Order email worker is already running.'
    exit 0
}
$logDirectory = Join-Path $backendPath 'storage\logs'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
$arguments = @('"' + $artisanPath + '"', 'queue:work', 'database', '--queue=order-emails', '--name=ct24f-order-emails', '--sleep=3', '--tries=1', '--timeout=30')
Start-Process -FilePath 'php.exe' -ArgumentList $arguments -WorkingDirectory $backendPath -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDirectory 'order-worker.out.log') `
    -RedirectStandardError (Join-Path $logDirectory 'order-worker.err.log')
Write-Output 'Order email worker started.'
