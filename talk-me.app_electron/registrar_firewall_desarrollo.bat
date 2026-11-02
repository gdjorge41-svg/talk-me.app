@echo off
:: Solicitar privilegios de administrador si no se tienen
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Por favor, ejecuta este script como ADMINISTRADOR (clic derecho -> Ejecutar como administrador).
    pause
    exit /b
)

echo === REGISTRANDO REGLA DE FIREWALL PARA DESARROLLO/TEST ===
set "EXE_PATH=%~dp0dist_final\win-unpacked\Talk-me.exe"

if not exist "%EXE_PATH%" (
    echo [ERROR] No se encontro el ejecutable en: %EXE_PATH%
    echo Por favor, compila el proyecto primero ejecutando: npm run build:win
    pause
    exit /b
)

echo Autorizando programa en el Firewall: %EXE_PATH%
netsh advfirewall firewall delete rule name="Talk.me Test" >nul 2>&1
netsh advfirewall firewall add rule name="Talk.me Test" dir=in action=allow program="%EXE_PATH%" enable=yes

if %errorLevel% equ 0 (
    echo ✅ Regla registrada con exito. Puedes ejecutar win-unpacked\Talk-me.exe sin prompts de permisos.
) else (
    echo ❌ Hubo un error al registrar la regla de firewall.
)
pause
