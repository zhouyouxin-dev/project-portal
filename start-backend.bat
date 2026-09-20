@echo off
chcp 65001 >nul
title Backend - Spring Boot (8080)
set JAVA_HOME=%~dp0tools\jdk-17.0.2
set SERVER_PORT=8080
cd /d %~dp0server
echo Starting backend on http://localhost:8080 ...
call "%~dp0tools\apache-maven-3.9.9\bin\mvn.cmd" -s "%~dp0tools\maven-settings.xml" spring-boot:run
pause
