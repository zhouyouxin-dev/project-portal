@echo off
chcp 65001 >nul
title Frontend - Vite 5173
cd /d %~dp0client

rem ---------------------------------------------------------------
rem  Locate a Node.js runtime (must be npm.cmd, not the sh script).
rem  1st choice : system install (C:\Program Files\nodejs)
rem  fallback   : WorkBuddy managed build under %USERPROFILE%\.workbuddy
rem ---------------------------------------------------------------
set "NPM="
set "NPM_VER="
set "NODE_VERSIONS=%USERPROFILE%\.workbuddy\binaries\node\versions"

for /f "delims=" %%i in ('where npm.cmd 2^>nul') do if not defined NPM set "NPM=%%i"

if not defined NPM (
    if exist "%NODE_VERSIONS%\current" set /p NPM_VER=<"%NODE_VERSIONS%\current"
    if defined NPM_VER if exist "%NODE_VERSIONS%\%NPM_VER%\npm.cmd" set "NPM=%NODE_VERSIONS%\%NPM_VER%\npm.cmd"
)

if not defined NPM (
    for /f "delims=" %%i in ('dir /b /ad /o-n "%NODE_VERSIONS%" 2^>nul') do (
        if not defined NPM if exist "%NODE_VERSIONS%\%%i\npm.cmd" set "NPM=%NODE_VERSIONS%\%%i\npm.cmd"
    )
)

if not defined NPM (
    echo.
    echo [ERROR] Node.js runtime not found.
    echo         Install Node.js 18+ from https://nodejs.org/en/download
    echo         then open a NEW terminal window and run this again.
    echo.
    pause
    exit /b 1
)

rem  Always put the node dir first on PATH so the vite shim finds "node".
for %%f in ("%NPM%") do set "NODE_DIR=%%~dpf"
set "PATH=%NODE_DIR%;%PATH%"

echo Using npm: %NPM%
echo.
echo Starting frontend on http://localhost:5173 ...
echo.
echo *** KEEP THIS WINDOW OPEN while you use the site. ***
echo *** Closing it stops the site.                     ***
echo.

call "%NPM%" run dev

echo.
echo [Frontend stopped] Copy the error above and send it to me if this was unexpected.
pause
