@echo off
echo ===================================================
echo INICIANDO WEB RENTIAROOM (Next.js)
echo ===================================================
echo.
echo INSTALANDO O ACTUALIZANDO DEPENDENCIAS...
call npm install
echo.
echo ===================================================
echo INICIANDO SERVIDOR EN PUERTO 4500 (Seguro fuera del rango 3000-4000)
echo ===================================================
echo.
call npm run dev
pause
