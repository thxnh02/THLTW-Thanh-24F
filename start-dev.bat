@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

if not exist "%BACKEND%\artisan" (
  echo Khong tim thay backend\artisan.
  pause
  exit /b 1
)
if not exist "%FRONTEND%\package.json" (
  echo Khong tim thay frontend\package.json.
  pause
  exit /b 1
)

where npm.cmd >nul 2>&1 || (echo Khong tim thay Node.js/npm.& pause & exit /b 1)
call "%ROOT%setup-mysql.bat" /quiet
if errorlevel 1 exit /b 1

if not exist "%FRONTEND%\.env.local" copy "%FRONTEND%\.env.example" "%FRONTEND%\.env.local" >nul
if not exist "%FRONTEND%\node_modules" (
  pushd "%FRONTEND%"
  call npm.cmd install
  if errorlevel 1 (popd & echo Cai dependency frontend that bai. & pause & exit /b 1)
  popd
)

netstat -ano | findstr /r /c:":8000 .*LISTENING" >nul && (echo Port 8000 dang duoc su dung. Hay giai phong port truoc khi chay.& pause & exit /b 1)
netstat -ano | findstr /r /c:":3000 .*LISTENING" >nul && (echo Port 3000 dang duoc su dung. Hay giai phong port truoc khi chay.& pause & exit /b 1)

start "CT_24F Backend" cmd /k "cd /d ""%BACKEND%"" && php artisan serve --host=127.0.0.1 --port=8000"
start "CT_24F Frontend" cmd /k "cd /d ""%FRONTEND%"" && npm.cmd run dev -- --hostname 127.0.0.1 --port 3000"
start "" "http://127.0.0.1:3000"

echo Da mo Backend: http://127.0.0.1:8000/api
echo Da mo Frontend: http://127.0.0.1:3000
pause
