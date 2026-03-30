@echo off
echo Starting Tally Integration Application...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd /d %~dp0.. && npm run dev"

echo Starting Frontend...
timeout /t 3 /nobreak >nul
start "Frontend" cmd /k "cd /d %~dp0..\frontend && npm start"

echo.
echo Both servers are starting in separate windows.
echo Backend: http://localhost:3000 (or check console for actual port)
echo Frontend: http://localhost:3001 (default React port)
echo.
echo Close this window to keep servers running.
echo Press any key to stop all servers...
pause >nul

echo.
echo Stopping servers...
taskkill /f /im node.exe /t 2>nul
echo All servers stopped.
