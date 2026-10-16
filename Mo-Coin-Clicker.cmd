@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 22.12 or newer, then try again.
  pause
  exit /b 1
)
if exist "dist\index.html" goto play
if not exist "node_modules\vite\bin\vite.js" (
  echo Installing project dependencies...
  call npm.cmd ci
  if errorlevel 1 goto failed
)
if not exist "dist\index.html" (
  echo Building Coin Clicker...
  call npm.cmd run build
  if errorlevel 1 goto failed
)
:play
node scripts\serve-local.mjs --open
if errorlevel 1 goto failed
exit /b 0
:failed
echo Could not start. Check the message above. Port 5173 may already be in use.
pause
exit /b 1
