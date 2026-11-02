@echo off
title Talk-Me Pre-Launch Launcher V70
cd /d "%~dp0"
cd ..

echo [STABILIZER] Limpiando sesiones previas y liberando puerto 3000...
taskkill /f /im whisper-server.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
del /q /f "storage\message-history.json" 2>nul

echo Detectando IP...
set "MYIP=localhost"
for /f "delims=" %%a in ('powershell -command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' }).IPAddress | Select-Object -First 1"') do set "MYIP=%%a"

echo IP: %MYIP%
echo URL de Control: http://%MYIP%:3000

echo Abriendo navegador en Cabina de Mando Pre-Launch...
start http://%MYIP%:3000

echo Iniciando Launchpad Pre-Launch...
node pre-launch/launcher-server.js

echo.
echo [STABILIZER] Limpiando procesos y cache al salir...
taskkill /f /im whisper-server.exe >nul 2>&1
del /q /f "storage\media\images\*.*" 2>nul
del /q /f "storage\media\recordings\*.*" 2>nul
del /q /f "storage\message-history.json" 2>nul

echo Hecho.
pause
