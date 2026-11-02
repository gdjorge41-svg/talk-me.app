@echo off
echo [1/6] Diagnosticando entorno C++...
node check-build-env.js
if %errorlevel% neq 0 (
    echo Fallo de entorno local.
    exit /b 1
)

echo [2/6] Limpiando procesos previos y carpetas...
taskkill /F /IM Talk-me.exe /T 2>NUL
taskkill /F /IM electron.exe /T 2>NUL
powershell -NoProfile -Command "Stop-Process -Name 'Talk-me','electron' -Force -ErrorAction SilentlyContinue; if (Test-Path 'dist_final') { Remove-Item -Path 'dist_final' -Recurse -Force -ErrorAction SilentlyContinue }" 2>NUL
powershell -NoProfile -Command "if (Test-Path 'app_build') { Remove-Item -Path 'app_build' -Recurse -Force }"
mkdir app_build

echo [3/6] Copiando archivos base del proyecto original...
xcopy /s /e /y /r /exclude:exclude-list.txt ..\config app_build\config\
xcopy /s /e /y /r /exclude:exclude-list.txt ..\modules app_build\modules\
xcopy /s /e /y /r /exclude:exclude-list.txt ..\pre-launch app_build\pre-launch\
xcopy /s /e /y /r /exclude:exclude-list.txt ..\public app_build\public\
xcopy /s /e /y /r /exclude:exclude-list.txt ..\storage app_build\storage\
xcopy /s /e /y /r /exclude:exclude-list.txt ..\views app_build\views\
if exist ..\triggers xcopy /s /e /y /r /exclude:exclude-list.txt ..\triggers app_build\triggers\
copy /y ..\server.js app_build\
copy /y ..\package.json app_build\
copy /y ..\package-lock.json app_build\
copy /y ..\server.key app_build\
copy /y ..\server.cert app_build\
if exist ..\vosk-model-small-es-0.42 xcopy /s /e /y /r ..\vosk-model-small-es-0.42 app_build\vosk-model-small-es-0.42\
if exist ..\vosk-model-small-en-us-0.15 xcopy /s /e /y /r ..\vosk-model-small-en-us-0.15 app_build\vosk-model-small-en-us-0.15\
if exist ..\bin\translate xcopy /s /e /y /r ..\bin\translate app_build\bin\translate\
REM Descarga On-Demand: No paquetizar los 2.75 GB de traduccion para mantener el instalador en ~400 MB
REM if exist ..\storage\models\translate xcopy /s /e /y /r ..\storage\models\translate app_build\storage\models\translate\
if exist ..\bin\tts xcopy /s /e /y /r ..\bin\tts app_build\bin\tts\
if exist ..\storage\models\tts xcopy /s /e /y /r ..\storage\models\tts app_build\storage\models\tts\
if exist ..\bin\whisper xcopy /s /e /y /r ..\bin\whisper app_build\bin\whisper\
if exist ..\storage\models\whisper xcopy /s /e /y /r ..\storage\models\whisper app_build\storage\models\whisper\

echo [3.5/6] Purgando artefactos intermedios y simbolos de depuracion en bin...
del /s /q app_build\bin\*.pdb 2>NUL
del /s /q app_build\bin\*.lib 2>NUL
del /s /q app_build\bin\*.exp 2>NUL
del /s /q app_build\bin\*.obj 2>NUL
del /s /q app_build\bin\*.iobj 2>NUL
del /s /q app_build\bin\*.ipdb 2>NUL

echo [4/6] Aplicando overrides de escritorio...
if exist overrides (
    xcopy /s /e /y /r overrides app_build\
)
copy /y main.js app_build\
copy /y preload.js app_build\
node -e "const fs=require('fs');const p1=JSON.parse(fs.readFileSync('./app_build/package.json','utf8'));const p2=JSON.parse(fs.readFileSync('./app_build/pre-launch/package.json','utf8'));p1.dependencies={...p1.dependencies,...p2.dependencies};p1.main='main.js';fs.writeFileSync('./app_build/package.json',JSON.stringify(p1,null,2),'utf8');"

echo [5/6] Instalando dependencias limpias de produccion en staging...
cd app_build
call npm install --omit=dev
cd ..
echo [6/6] Estructura app_build lista. Auditando integridad pre-empaquetado...
node check-build-integrity.js
if %errorlevel% neq 0 (
    echo Error de integridad en staging. Abortando.
    exit /b 1
)
echo [OK] Compilación lista para ejecutar electron-builder.
