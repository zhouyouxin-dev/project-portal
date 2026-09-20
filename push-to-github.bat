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

set TRY=1
:PUSH
echo ---- Attempt %TRY% of 6 ----
"%GIT%" -c credential.helper=manager -c http.version=HTTP/1.1 -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=30 push -u origin main
if %ERRORLEVEL%==0 goto OK
if %TRY%==6 goto FAIL
set /a TRY+=1
echo Push failed - network may be blocked. Retrying in 20 seconds...
echo (Tip: if it keeps failing, GitHub is unreachable right now.
echo  Wait a few minutes and double-click this file again,
echo  or ask XiaoZhou to set up a Gitee backup repo.)
timeout /t 20 /nobreak >nul
goto PUSH

:OK
echo.
echo ==== Exit code: 0 ====
echo SUCCESS! Code is on GitHub.
echo You can close this window now.
pause
exit /b 0

:FAIL
echo.
echo ==== Exit code: 128 ====
echo FAILED after 6 attempts - GitHub is unreachable from
echo your network right now. This is temporary. Try again
echo in 10-30 minutes, or ask XiaoZhou for the Gitee plan.
pause
