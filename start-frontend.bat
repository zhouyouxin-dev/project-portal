@echo off
chcp 65001 >nul
title Frontend - Vite (5173)
cd /d %~dp0client
echo Starting frontend on http://localhost:5173 ...
call npm run dev
pause
