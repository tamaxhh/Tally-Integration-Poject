@echo off
title Tally Remote Fetcher - Standalone Builder
color 0A
echo.
echo  ===============================================
echo    🏗️  Tally Standalone Builder
echo  ===============================================
echo.
echo  📦 Building standalone executable...
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

REM Check if pkg is installed
npm list -g pkg >nul 2>&1
if %errorlevel% neq 0 (
    echo  📦 Installing pkg...
    npm install -g pkg
)

echo  🚀 Building standalone version...
echo.

REM Run build script
node build.js

echo.
if exist "dist\tally-remote-fetcher.exe" (
    echo  ✅ Build successful!
    echo  📁 Executable: dist\tally-remote-fetcher.exe
    
    REM Show file size
    for %%I in ("dist\tally-remote-fetcher.exe") do set size=%%~zI
    set /a sizeMB=!size!~1024!
    set /a sizeMB=!size!/1024!
    echo  📏 Size: !sizeMB! MB
) else (
    echo  ❌ Build failed!
    echo  Check the error messages above.
)

echo.
echo  📋 To distribute:
echo    Copy entire 'standalone' folder to users
echo    Users run: tally-remote-fetcher.exe
echo.
pause
