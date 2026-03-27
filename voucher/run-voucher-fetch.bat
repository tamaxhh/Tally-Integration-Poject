@echo off
echo ========================================
echo   Tally Voucher Data Fetcher
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js found

REM Change to voucher directory
cd /d "%~dp0"

echo.
echo ≡ƒÜÇ Starting voucher data fetch...
echo.

REM Run the voucher fetcher
node fetch-voucher-data.js

echo.
echo ========================================
echo   Process completed!
echo ========================================
pause
