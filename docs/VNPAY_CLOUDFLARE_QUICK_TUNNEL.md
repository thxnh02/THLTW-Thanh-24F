# VNPay Sandbox qua Cloudflare Quick Tunnel (Windows)

Frontend and Laravel stay on the local machine. Cloudflare exposes the Next.js app over one temporary HTTPS hostname; Next.js forwards `/api/*` and `/sanctum/*` to Laravel on `127.0.0.1:8000`.

## Start the local apps

Open three PowerShell windows at the project root (`CT_24F`). Keep both app servers running while the tunnel is active.

**Window 1 — Laravel**

```powershell
Set-Location 'D:\HH\MON HOC\THLTW-Thanh-24F\CT_24F\backend'
php artisan serve --host=127.0.0.1 --port=8000
```

**Window 2 — Next.js**

```powershell
Set-Location 'D:\HH\MON HOC\THLTW-Thanh-24F\CT_24F\frontend'
npm run dev -- --hostname 0.0.0.0
```

**Window 3 — Cloudflare Quick Tunnel**

If `cloudflared` is not installed and `winget` is available:

```powershell
winget install --id Cloudflare.cloudflared
```

Open a new PowerShell window after installation, then run:

```powershell
cloudflared tunnel --url http://127.0.0.1:3000
```

Copy the `https://....trycloudflare.com` hostname printed in this window. Keep this window open; stopping it disables the public URL.

## Configure the current tunnel hostname

From the project root, replace the example URL with the exact URL printed by `cloudflared`:

```powershell
Set-Location 'D:\HH\MON HOC\THLTW-Thanh-24F\CT_24F'
powershell -ExecutionPolicy Bypass -File '.\backend\scripts\Configure-VnPayQuickTunnel.ps1' -TunnelUrl 'https://replace-with-current-host.trycloudflare.com'
```

The script validates the HTTPS URL, requires the existing sandbox merchant settings to be present, updates only URL/session/CORS/Sanctum/proxy/sandbox-toggle settings in the private `backend/.env`, and clears Laravel's config cache. It does not print or alter the VNPay merchant credentials. Restart both Laravel and Next.js after running it. Each new Quick Tunnel gets a different hostname, so rerun this step for every new host.

The frontend is configured to call `/api` and `/sanctum` on its own origin. Next.js rewrites those paths to Laravel, so browser requests and session cookies remain under the HTTPS tunnel hostname. The app uses a host-only secure session cookie (`SESSION_DOMAIN=null`, `SESSION_SECURE_COOKIE=true`, `SESSION_SAME_SITE=lax`). The tunnel host is included in Sanctum's stateful hosts and Laravel's credentialed CORS allowlist. Next.js permits `*.trycloudflare.com` as a development origin only.

## Verify routing, CSRF cookie, and unsigned IPN response

Set the current base URL, then check that the HTTPS host responds and `/api` reaches Laravel:

```powershell
$BaseUrl = 'https://replace-with-current-host.trycloudflare.com'
Invoke-WebRequest "$BaseUrl/api/products" -Method Get
```

Fetch the Sanctum CSRF cookie through the same hostname. Both cookies should be present; the session cookie should be `Secure` and host-only:

```powershell
$WebSession = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
Invoke-WebRequest "$BaseUrl/sanctum/csrf-cookie" -Method Get -WebSession $WebSession | Select-Object -ExpandProperty StatusCode
$WebSession.Cookies.GetCookies([uri]$BaseUrl) | Select-Object Name, Secure, Domain
```

Send an unsigned diagnostic request to the public IPN route. Expected JSON is `RspCode: "97"` and `Message: "Invalid Checksum"`; this confirms the public path reaches Laravel and rejects an unsigned callback. It must not change an order:

```powershell
Invoke-RestMethod "$BaseUrl/api/payments/vnpay/ipn" -Method Get
```

Then sign in and test the shop in the browser using `$BaseUrl`. A return page is informational. Payment state changes only through a valid signed VNPay IPN or an authorized, signed QueryDr reconciliation response; never treat the browser return query as proof of payment. Do not manually forge a success callback to test it.

## VNPay merchant URL approval

VNPay's integration specification says the IPN endpoint must use SSL, and describes the Return URL as the address sent in `vnp_ReturnUrl`. The sandbox merchant registration form asks for a website URL, but public documentation does not guarantee that an arbitrary rotating `trycloudflare.com` hostname is accepted for every merchant. Check the website URL associated with this `vnp_TmnCode` in the VNPay Sandbox merchant portal, and ask VNPay support whether the exact temporary host can be used for both Return and IPN. If it is rejected, request an update/allowlist or use a stable hostname; do not assume localhost or the VNPay payment gateway URL is an acceptable callback.

Official references:

- [VNPay integration guide](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html)
- [VNPay Sandbox merchant registration](https://sandbox.vnpayment.vn/devreg)
- [Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/)
- [Next.js `allowedDevOrigins`](https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins)

Quick Tunnel URLs are temporary and publicly reachable by anyone who knows the URL. Use them only during testing and stop `cloudflared` when finished. Do not place credentials in commands, docs, screenshots, or Git.
