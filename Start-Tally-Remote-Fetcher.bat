@echo off
title Tally Remote Data Fetcher
color 0A
echo.
echo  ===============================================
echo    🌐 Tally Remote Data Fetcher
echo  ===============================================
echo.
echo  Starting application...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ❌ Node.js not found!
    echo.
    echo  Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo  ✅ Node.js found
echo  🚀 Starting web server...
echo.

REM Start the application
node tally-remote-fetcher-standalone.js

pause
