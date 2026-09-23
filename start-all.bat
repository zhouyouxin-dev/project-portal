@echo off
chcp 65001 >nul
title Project Portal - One Click Start
cd /d %~dp0

echo ==========================================
echo   Project Portal - One Click Start
echo ==========================================
echo.

netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo [1/3] Backend  : NOT running -^> starting on 8080 ...
    start "Backend - Spring Boot 8080" cmd /k ""%~dp0start-backend.bat""
) else (
    echo [1/3] Backend  : already running on 8080, skip.
)

netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo [2/3] Frontend : NOT running -^> starting on 5173 ...
    start "Frontend - Vite 5173" cmd /k ""%~dp0start-frontend.bat""
) else (
    echo [2/3] Frontend : already running on 5173, skip.
)

echo [3/3] Waiting for the servers, then opening the browser ...
timeout /t 12 /nobreak >nul
start "" http://localhost:5173/

echo.
echo ------------------------------------------
echo Done.  Site   : http://localhost:5173
echo        Admin  : http://localhost:5173/admin
echo        Login  : admin / admin123
echo.
echo KEEP the Backend and Frontend windows OPEN.
echo Closing them stops the servers and the site breaks again.
echo ------------------------------------------
pause
