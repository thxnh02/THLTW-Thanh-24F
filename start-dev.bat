@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=%~dp0"
set "BACKEND_PORT=8000"
set "FRONTEND_PORT=3000"

if not exist "%ROOT%backend" (
  echo Khong tim thay thu muc backend.
  pause
  exit /b 1
)

if not exist "%ROOT%frontend" (
  echo Khong tim thay thu muc frontend.
  pause
  exit /b 1
)

where php >nul 2>&1
if not "%ERRORLEVEL%"=="0" (
  echo Khong tim thay PHP trong PATH.
  echo Hay cai PHP/Laragon va them PHP vao PATH.
  pause
  exit /b 1
)

where npm >nul 2>&1
if not "%ERRORLEVEL%"=="0" (
  echo Khong tim thay Node.js va npm trong PATH.
  echo Hay cai Node.js LTS va mo lai file nay.
  pause
  exit /b 1
)

if not exist "%ROOT%backend\.env" (
  if exist "%ROOT%backend\.env.example" (
    copy "%ROOT%backend\.env.example" "%ROOT%backend\.env" >nul
  )
)

if not exist "%ROOT%frontend\.env.local" (
  if exist "%ROOT%frontend\.env.example" (
    copy "%ROOT%frontend\.env.example" "%ROOT%frontend\.env.local" >nul
  )
)

:prepare_backend
if exist "%ROOT%backend\vendor\autoload.php" goto :backend_ready
echo Dang cai dependency backend...
pushd "%ROOT%backend"
call composer install --no-interaction --prefer-dist
if not "%ERRORLEVEL%"=="0" (
  popd
  echo Cai dependency backend that bai.
  pause
  exit /b 1
)
popd

:backend_ready
pushd "%ROOT%backend"
php artisan migrate --force --no-ansi
if not "%ERRORLEVEL%"=="0" (
  popd
  echo Migration backend that bai.
  pause
  exit /b 1
)
if not exist "%ROOT%backend\public\storage" php artisan storage:link --no-ansi
popd

:prepare_frontend
if exist "%ROOT%frontend\node_modules" goto :frontend_ready
echo Dang cai dependency frontend...
pushd "%ROOT%frontend"
call npm.cmd install
if not "%ERRORLEVEL%"=="0" (
  popd
  echo Cai dependency frontend that bai.
  pause
  exit /b 1
)
popd

:frontend_ready
:find_backend_port
call :port_in_use %BACKEND_PORT%
if not "%ERRORLEVEL%"=="0" goto :find_frontend_port
set /a BACKEND_PORT+=1
goto :find_backend_port

:find_frontend_port
call :port_in_use %FRONTEND_PORT%
if not "%ERRORLEVEL%"=="0" goto :write_environment
set /a FRONTEND_PORT+=1
goto :find_frontend_port

:write_environment

powershell -NoProfile -ExecutionPolicy Bypass -Command "$path='%ROOT%frontend\.env.local'; $api='NEXT_PUBLIC_API_URL=http://localhost:%BACKEND_PORT%/api/v1'; $site='NEXT_PUBLIC_SITE_URL=http://localhost:%FRONTEND_PORT%'; $lines=@(); if (Test-Path $path) { $lines=Get-Content $path }; $lines=@($lines | Where-Object { $_ -notmatch '^NEXT_PUBLIC_API_URL=' -and $_ -notmatch '^NEXT_PUBLIC_SITE_URL=' }); $lines += $api; $lines += $site; Set-Content -Path $path -Value $lines"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$path='%ROOT%backend\.env'; $frontend='FRONTEND_URL=http://localhost:%FRONTEND_PORT%'; $cors='CORS_ALLOWED_ORIGINS=http://localhost:%FRONTEND_PORT%,http://127.0.0.1:%FRONTEND_PORT%'; $sanctum='SANCTUM_STATEFUL_DOMAINS=localhost,localhost:%FRONTEND_PORT%,127.0.0.1,127.0.0.1:%FRONTEND_PORT%,localhost:%BACKEND_PORT%,127.0.0.1:%BACKEND_PORT%'; $lines=@(); if (Test-Path $path) { $lines=Get-Content $path }; $lines=@($lines | Where-Object { $_ -notmatch '^FRONTEND_URL=' -and $_ -notmatch '^CORS_ALLOWED_ORIGINS=' -and $_ -notmatch '^SANCTUM_STATEFUL_DOMAINS=' }); $lines += $frontend; $lines += $cors; $lines += $sanctum; Set-Content -Path $path -Value $lines"

start "THLTW Backend" cmd /k "cd /d ""%ROOT%backend"" && php artisan serve --host=localhost --port=%BACKEND_PORT%"
start "THLTW Frontend" cmd /k "cd /d ""%ROOT%frontend"" && npm.cmd run dev -- --hostname localhost --port %FRONTEND_PORT%"
start "" "http://localhost:%FRONTEND_PORT%"

echo Da mo Backend:  http://localhost:%BACKEND_PORT%
echo Da mo Frontend: http://localhost:%FRONTEND_PORT%
echo Dependency, migration va storage da san sang.
echo Dong cua so Backend/Frontend de dung project.
echo.
pause

exit /b 0

:port_in_use
netstat -ano | findstr /R /C:":%~1 .*LISTENING" >nul
exit /b %ERRORLEVEL%
