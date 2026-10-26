@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "PHP_BIN="
if /I "%~1"=="/quiet" set "QUIET=1"

if not exist "%BACKEND%\artisan" (
  echo Khong tim thay backend\artisan.
  if not defined QUIET pause
  exit /b 1
)
if not exist "%BACKEND%\.env.example" (
  echo Khong tim thay backend\.env.example.
  if not defined QUIET pause
  exit /b 1
)

for /f "delims=" %%P in ('where php 2^>nul') do if not defined PHP_BIN set "PHP_BIN=%%P"
if not defined PHP_BIN for /f "delims=" %%P in ('dir /b /s /o-n "C:\laragon\bin\php\php-*\php.exe" 2^>nul') do if not defined PHP_BIN set "PHP_BIN=%%P"
if not defined PHP_BIN (
  echo Khong tim thay PHP. Hay cai Laragon hoac them PHP vao PATH.
  if not defined QUIET pause
  exit /b 1
)

"%PHP_BIN%" -r "try { new PDO('mysql:host=127.0.0.1;port=3306', 'root', ''); exit(0); } catch (Throwable $e) { exit(1); }"
if errorlevel 1 (
  echo Khong ket noi duoc MySQL. Hay mo Laragon va bam Start All.
  if not defined QUIET pause
  exit /b 1
)

if not exist "%BACKEND%\.env" (
  copy "%BACKEND%\.env.example" "%BACKEND%\.env" >nul
  if errorlevel 1 (echo Khong the tao backend\.env tu file mau.& if not defined QUIET pause & exit /b 1)
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$path='%BACKEND%\.env'; $values=@{DB_CONNECTION='mysql';DB_HOST='127.0.0.1';DB_PORT='3306';DB_DATABASE='ecommerce_thltw';DB_USERNAME='root';DB_PASSWORD=''}; $lines=Get-Content -LiteralPath $path; foreach($key in $values.Keys){$pattern='^'+[regex]::Escape($key)+'='; $lines=@($lines | Where-Object {$_ -notmatch $pattern}); $lines += ($key+'='+$values[$key])}; Set-Content -LiteralPath $path -Value $lines -Encoding utf8"
  if errorlevel 1 (echo Khong the khoi tao cau hinh backend\.env.& if not defined QUIET pause & exit /b 1)
  echo Da tao backend\.env tu file mau.
) else (
  echo Giu nguyen backend\.env hien co.
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$path='%BACKEND%\.env'; $db=@{}; Get-Content -LiteralPath $path | ForEach-Object {if($_ -match '^\s*(DB_CONNECTION|DB_HOST|DB_PORT|DB_DATABASE|DB_USERNAME)\s*=\s*(.*?)\s*$'){$db[$matches[1]]=$matches[2].Trim().Trim([char]34).Trim([char]39)}}; if($db['DB_CONNECTION'] -ne 'mysql' -or $db['DB_HOST'] -ne '127.0.0.1' -or $db['DB_PORT'] -ne '3306' -or $db['DB_DATABASE'] -ne 'ecommerce_thltw' -or $db['DB_USERNAME'] -ne 'root'){Write-Error 'backend\.env does not target the expected local ecommerce_thltw database'; exit 1}"
if errorlevel 1 (
  echo Cau hinh backend\.env khong tro toi MySQL ecommerce_thltw tren localhost; da dung truoc khi thay doi database.
  if not defined QUIET pause
  exit /b 1
)

"%PHP_BIN%" -r "try { $pdo = new PDO('mysql:host=127.0.0.1;port=3306', 'root', ''); $pdo->exec('CREATE DATABASE IF NOT EXISTS ecommerce_thltw CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'); exit(0); } catch (Throwable $e) { fwrite(STDERR, $e->getMessage()); exit(1); }"
if errorlevel 1 (
  echo Khong the tao database ecommerce_thltw.
  if not defined QUIET pause
  exit /b 1
)

if not exist "%BACKEND%\vendor\autoload.php" (
  where composer >nul 2>&1 || (echo Khong tim thay Composer.& pause & exit /b 1)
  pushd "%BACKEND%"
  call composer install --no-interaction --prefer-dist
  if errorlevel 1 (popd & echo Cai dependency backend that bai. & if not defined QUIET pause & exit /b 1)
  popd
)

pushd "%BACKEND%"
"%PHP_BIN%" artisan config:clear
findstr /r /c:"^APP_KEY=$" .env >nul && "%PHP_BIN%" artisan key:generate --force --no-interaction
"%PHP_BIN%" artisan migrate --no-interaction
if errorlevel 1 (popd & echo Migration that bai. Khong co du lieu nao bi xoa. & if not defined QUIET pause & exit /b 1)
"%PHP_BIN%" artisan db:seed --no-interaction
if errorlevel 1 (popd & echo Seed that bai. & if not defined QUIET pause & exit /b 1)
"%PHP_BIN%" artisan route:list --path=api
popd

echo.
echo OK: Da chay setup cho database ecommerce_thltw voi utf8mb4.
echo backend\.env hien co duoc giu nguyen; neu khong dung cau hinh local mong doi, setup se dung truoc khi chay migration.
echo Migration va seed co the chay lai an toan, khong dung migrate:fresh.
if not defined QUIET pause
