@echo off
echo Stopping Tally Integration Servers...
echo.

echo Finding and stopping Node.js processes...
taskkill /f /im node.exe /t 2>nul

echo Checking for processes on common ports...
echo Stopping processes on port 3000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Killing process %%a on port 3000
    taskkill /f /pid %%a 2>nul
)

echo Stopping processes on port 3001 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
    echo Killing process %%a on port 3001
    taskkill /f /pid %%a 2>nul
)

echo Stopping processes on port 3002 (Alternative Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3002" ^| find "LISTENING"') do (
    echo Killing process %%a on port 3002
    taskkill /f /pid %%a 2>nul
)

echo.
echo Cleaning up any remaining Node processes...
wmic process where "name='node.exe'" delete 2>nul

echo.
echo All Tally Integration servers and associated processes have been stopped.
echo Ports 3000, 3001, and 3002 have been cleared.
echo.
pause
