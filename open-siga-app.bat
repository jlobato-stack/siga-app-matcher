@echo off
setlocal

cd /d "%~dp0"

if not exist "node_modules" (
  echo Installing dependencies for the first run...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. Please check the error above.
    pause
    exit /b 1
  )
)

start "SIGA Dev Server" cmd /k "cd /d ""%~dp0"" && npm run dev"
powershell -NoProfile -Command "Start-Sleep -Seconds 5; Start-Process 'http://localhost:5173'"

exit /b 0
