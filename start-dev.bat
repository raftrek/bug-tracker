@echo off
setlocal
cd /d "%~dp0"
start "Bug Tracker Backend" cmd /k "npm run server"
start "Bug Tracker Frontend" cmd /k "npm run dev"
endlocal
