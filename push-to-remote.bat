@echo off
setlocal
cd /d "%~dp0"
set "GIT=C:\Users\zhouyouxin\.workbuddy\binaries\PortableGit\versions\1.2.0\cmd\git.exe"

if "%~1"=="" goto usage

echo [1/4] setting remote origin...
"%GIT%" remote remove origin 1>nul 2>nul
"%GIT%" remote add origin %~1

echo [2/4] renaming branch to main...
"%GIT%" branch -M main

echo [3/4] pushing to remote...
"%GIT%" push -u origin main

echo [4/4] result: ExitCode=%ERRORLEVEL%
echo.
echo If it asks for username/password: username = your account name,
echo password = your Personal Access Token (NOT your login password).
echo.
pause
exit /b 0

:usage
echo Usage: push-to-remote.bat ^<remote-repo-url^>
echo.
echo Example (GitHub):
echo   push-to-remote.bat https://github.com/yourname/project-portal.git
echo Example (Gitee):
echo   push-to-remote.bat https://gitee.com/yourname/project-portal.git
echo.
echo Tip: you can also just send me the repo URL and I will push it for you.
echo.
pause
exit /b 1
