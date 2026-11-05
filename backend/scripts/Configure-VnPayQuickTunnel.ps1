[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$TunnelUrl
)

$ErrorActionPreference = 'Stop'

try {
    $tunnelUri = [Uri]::new($TunnelUrl)
} catch {
    throw 'TunnelUrl must be a full HTTPS URL, for example https://random-name.trycloudflare.com.'
}

if (-not $tunnelUri.IsAbsoluteUri -or $tunnelUri.Scheme -ne 'https' -or $tunnelUri.UserInfo -or $tunnelUri.Port -ne 443 -or
    $tunnelUri.AbsolutePath -notin @('', '/') -or $tunnelUri.Query -or $tunnelUri.Fragment) {
    throw 'Use the HTTPS hostname printed by cloudflared, without a path, query string, credentials, or custom port.'
}

$tunnelHost = $tunnelUri.Host.ToLowerInvariant()
if ($tunnelHost -eq 'localhost' -or $tunnelHost -match '^127\.' -or $tunnelHost -notmatch '\.') {
    throw 'The tunnel URL must use a public hostname, not localhost or an IP address.'
}

$backendPath = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $backendPath '.env'
if (-not (Test-Path -LiteralPath $envPath -PathType Leaf)) {
    throw 'backend/.env was not found. Create and configure your local backend environment before using the tunnel script.'
}

$lines = [System.Collections.Generic.List[string]]::new()
(Get-Content -LiteralPath $envPath -Encoding utf8) | ForEach-Object { $lines.Add($_) }

function Get-EnvValue([string]$Name) {
    $matchLine = $lines | Where-Object { $_ -match "^$([regex]::Escape($Name))=" } | Select-Object -Last 1
    if (-not $matchLine) { return $null }
    return $matchLine.Substring($Name.Length + 1).Trim().Trim('"').Trim("'")
}

foreach ($secretName in @('VNPAY_TMN_CODE', 'VNPAY_HASH_SECRET')) {
    if ([string]::IsNullOrWhiteSpace((Get-EnvValue $secretName))) {
        throw "The existing $secretName setting is empty. No environment values were changed. Add the sandbox credential locally, then rerun this script."
    }
}

function Set-EnvValue([string]$Name, [string]$Value) {
    $matchingIndexes = @()
    for ($index = 0; $index -lt $lines.Count; $index++) {
        if ($lines[$index] -match "^$([regex]::Escape($Name))=") { $matchingIndexes += $index }
    }

    if ($matchingIndexes.Count -gt 0) {
        foreach ($index in $matchingIndexes) { $lines[$index] = "$Name=$Value" }
    } else {
        $lines.Add("$Name=$Value")
    }
}

function Merge-EnvList([string]$Name, [string[]]$RequiredValues, [string[]]$FallbackValues) {
    $existing = Get-EnvValue $Name
    $values = if ([string]::IsNullOrWhiteSpace($existing)) { $FallbackValues } else { $existing -split ',' }
    $merged = @($values + $RequiredValues | ForEach-Object { $_.Trim() } | Where-Object { $_ } | Select-Object -Unique)
    return ($merged -join ',')
}

$statefulHosts = Merge-EnvList 'SANCTUM_STATEFUL_DOMAINS' @($tunnelHost) @('127.0.0.1:3000', 'localhost:3000')
$corsOrigins = Merge-EnvList 'CORS_ALLOWED_ORIGINS' @("https://$tunnelHost") @('http://127.0.0.1:3000', 'http://localhost:3000')

# Update only non-secret host, cookie, and sandbox toggle values. Merchant credentials remain byte-for-byte unchanged.
Set-EnvValue 'APP_URL' "https://$tunnelHost"
Set-EnvValue 'FRONTEND_URL' "https://$tunnelHost"
Set-EnvValue 'SESSION_DOMAIN' 'null'
Set-EnvValue 'SESSION_SECURE_COOKIE' 'true'
Set-EnvValue 'SESSION_SAME_SITE' 'lax'
Set-EnvValue 'SANCTUM_STATEFUL_DOMAINS' $statefulHosts
Set-EnvValue 'CORS_ALLOWED_ORIGINS' $corsOrigins
Set-EnvValue 'TRUSTED_PROXIES' '127.0.0.1,::1'
Set-EnvValue 'VNPAY_ENABLED' 'true'
Set-EnvValue 'VNPAY_ENV' 'sandbox'
Set-EnvValue 'VNPAY_RETURN_URL' "https://$tunnelHost/vnpay-return"
Set-EnvValue 'VNPAY_IPN_URL' "https://$tunnelHost/api/payments/vnpay/ipn"

[System.IO.File]::WriteAllLines($envPath, $lines.ToArray(), [System.Text.UTF8Encoding]::new($false))

Push-Location $backendPath
try {
    & php artisan config:clear
    if ($LASTEXITCODE -ne 0) { throw 'Laravel config:clear failed.' }
} finally {
    Pop-Location
}

Write-Output "Tunnel host configured for frontend/API and VNPay Sandbox: https://$tunnelHost"
Write-Output 'Existing VNPay credentials were preserved and were not printed.'
Write-Output 'Restart both Laravel and Next.js servers before testing.'
