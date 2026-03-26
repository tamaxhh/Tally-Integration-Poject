@echo off
REM Docker Run Script for Tally Integration Project (Windows)
REM ==================================================
REM This script provides easy commands to run the Docker stack

setlocal enabledelayedexpansion

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="up" goto up
if "%1"=="down" goto down
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="app-logs" goto app_logs
if "%1"=="status" goto status
if "%1"=="clean" goto clean
if "%1"=="migrate" goto migrate
if "%1"=="dev-tools" goto dev_tools
goto help

:up
echo [INFO] Starting all services...
docker-compose -f docker/docker-compose.yml up -d
echo.
echo 🌐 API Server: http://localhost:3000
echo 🗄️  PostgreSQL: localhost:5433
echo 🔴 Redis: localhost:6379
echo.
echo Run 'run-docker.bat logs' to follow logs
goto end

:down
echo [INFO] Stopping all services...
docker-compose -f docker/docker-compose.yml down
echo [INFO] Services stopped!
goto end

:restart
echo [INFO] Restarting all services...
docker-compose -f docker/docker-compose.yml restart
echo [INFO] Services restarted!
goto end

:logs
echo [INFO] Following logs for all services...
docker-compose -f docker/docker-compose.yml logs -f
goto end

:app_logs
echo [INFO] Following logs for app service...
docker-compose -f docker/docker-compose.yml logs -f app
goto end

:status
echo [INFO] Service status:
docker-compose -f docker/docker-compose.yml ps
goto end

:clean
echo [WARN] This will remove ALL containers, networks, and volumes!
set /p confirm="Are you sure? (y/N): "
if /i "!confirm!"=="y" (
    echo [INFO] Removing everything...
    docker-compose -f docker/docker-compose.yml down -v --remove-orphans
    docker system prune -f
    echo [INFO] Cleanup complete!
) else (
    echo [INFO] Cleanup cancelled.
)
goto end

:migrate
echo [INFO] Running database migrations...
docker-compose -f docker/docker-compose.yml exec app node src/db/migrate.js up
goto end

:dev_tools
echo [INFO] Starting services with development tools...
docker-compose -f docker/docker-compose.yml --profile dev-tools up -d
echo.
echo 🌐 API Server: http://localhost:3000
echo 🗄️  PostgreSQL: localhost:5433
echo 🔴 Redis: localhost:6379
echo 🛠️  Redis Commander: http://localhost:8081
goto end

:help
echo Tally Integration Docker Commands:
echo.
echo Usage: run-docker.bat [COMMAND]
echo.
echo Commands:
echo   up         Start all services (app, redis, postgres)
echo   down       Stop all services
echo   restart    Restart all services
echo   logs       Show logs for all services
echo   app-logs  Show logs only for the app
echo   status     Show status of all services
echo   clean      Remove all containers, networks, and volumes
echo   migrate    Run database migrations
echo   dev-tools  Start with Redis Commander (cache UI)
echo   help       Show this help message
echo.
echo Examples:
echo   run-docker.bat up              # Start all services
echo   run-docker.bat dev-tools        # Start with Redis Commander
echo   run-docker.bat logs             # Follow all logs
echo   run-docker.bat migrate          # Run database migrations

:end
pause
