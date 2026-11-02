@echo off
title Talk-Me Installer
cd /d "%~dp0"

echo Instalando dependencias...
call npm install

echo Configurando modelos de IA...
node setup-model.js

echo Verificando carpetas...
if not exist "storage\media\recordings" mkdir "storage\media\recordings"
if not exist "storage\media\images" mkdir "storage\media\images"
if not exist "storage\models" mkdir "storage\models"

echo Proceso finalizado.
pause