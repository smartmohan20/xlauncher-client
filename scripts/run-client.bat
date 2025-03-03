@echo off
setlocal enabledelayedexpansion

:: XLauncher Client React Vite Application Runner
:: Place this file in the scripts directory

echo =======================================================
echo XLauncher Client - React Vite Application Runner
echo =======================================================

:: Check if we're in the right directory
if not exist ..\package.json (
    echo Error: This script should be run from the scripts directory.
    echo Current directory is not within the project root.
    exit /b 1
)

:: Navigate to parent directory (project root)
cd ..

:: Parse command line arguments
set "command=%~1"
set "env=%~2"
if "!env!"=="" set "env=development"

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js v16.0.0 or higher.
    exit /b 1
)

:: Check Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node version: !NODE_VERSION!

:: Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: npm is not installed or not in PATH.
    echo Please install npm v7.0.0 or higher.
    exit /b 1
)

:: Show help if no command or help command
if "!command!"=="" goto :show_help
if /i "!command!"=="help" goto :show_help

:: Process commands
if /i "!command!"=="setup" goto :setup
if /i "!command!"=="dev" goto :dev
if /i "!command!"=="build" goto :build
if /i "!command!"=="preview" goto :preview
if /i "!command!"=="lint" goto :lint
if /i "!command!"=="test" goto :test
if /i "!command!"=="clean" goto :clean
if /i "!command!"=="env" goto :show_help

echo Unknown command: !command!
goto :show_help

:show_help
echo.
echo Usage: run-vite.bat [command] [environment]
echo.
echo Available commands:
echo   setup    - Install dependencies only (no env file generation)
echo   dev      - Run development server
echo   build    - Build for production
echo   preview  - Preview production build
echo   lint     - Run linter
echo   test     - Run tests
echo   clean    - Clean up build artifacts and node_modules
echo   help     - Show this help message
echo.
echo Available environments:
echo   development (default)
echo   staging
echo   production
echo.
exit /b 0

:setup
echo.
echo === Setting up the project ===
echo.
echo Installing dependencies...
call npm install
echo Setup completed.
exit /b 0

:dev
echo.
echo === Starting development server (Environment: !env!) ===
echo.
if /i "!env!"=="development" (
    call npm run dev -- --host
) else (
    call npm run dev -- --mode !env!
)
exit /b 0

:build
echo.
echo === Building for !env! ===
echo.
if /i "!env!"=="development" (
    call npm run build
) else (
    call npm run build -- --mode !env!
)
exit /b 0

:preview
echo.
echo === Previewing production build ===
echo.
call npm run preview
exit /b 0

:lint
echo.
echo === Running linter ===
echo.
call npm run lint
exit /b 0

:test
echo.
echo === Running tests ===
echo.
call npm run test
exit /b 0

:clean
echo.
echo === Cleaning project ===
echo.
echo Removing node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo node_modules removed.
) else (
    echo node_modules not found.
)

echo Removing dist folder...
if exist dist (
    rmdir /s /q dist
    echo dist folder removed.
) else (
    echo dist folder not found.
)

echo Removing package-lock.json...
if exist package-lock.json (
    del /f package-lock.json
    echo package-lock.json removed.
) else (
    echo package-lock.json not found.
)

echo Cleaning complete.
exit /b 0