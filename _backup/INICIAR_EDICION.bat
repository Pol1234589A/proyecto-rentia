@echo off
echo ===================================================
echo PREPARANDO ENTORNO DE DESARROLLO - WEB RENTIAROOM
echo ===================================================
echo.
echo INSTALANDO O ACTUALIZANDO DEPENDENCIAS...
call npm install
echo.
echo ===================================================
echo INICIANDO SERVIDOR...
echo El navegador se abrira automaticamente.
echo Si editas el codigo, la web se actualizara INSTANTANEAMENTE (Hot Reload).
echo Puerto configurado: 4500 (Seguro fuera del rango 3000-4000)
echo ===================================================
echo.
call npm run dev
pause
