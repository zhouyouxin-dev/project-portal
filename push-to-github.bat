@echo off
setlocal
cd /d "%~dp0"
set "GIT=%~dp0tools\MinGit\cmd\git.exe"

echo ================================================
echo  Pushing to GitHub: zhouyouxin-dev/project-portal
echo  A browser window may open - please sign in and
echo  click the green Authorize button.
echo ================================================
echo.

"%GIT%" -c credential.helper=manager push -u origin main

echo.
echo ==== Exit code: %ERRORLEVEL% ====
echo (0 means success)
pause
