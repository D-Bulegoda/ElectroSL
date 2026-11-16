@echo off
title ElectroSL One-Click Launcher
color 0B
echo ==================================================
echo      Starting ElectroSL Full-Stack Environment
echo ==================================================
echo.

:: 1. Start XAMPP MySQL if not already running
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MySQL is already running.
) else (
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start "" /B "C:\xampp\mysql\bin\mysqld.exe"
        echo [OK] Started XAMPP MySQL Database.
    ) else (
        echo [!] XAMPP MySQL not found at C:\xampp\mysql\bin\mysqld.exe - start it manually if needed.
    )
)

:: 2. Start ASP.NET Core 8 Backend in a minimized window
if exist "%~dp0ElectroSL-Backend" (
    start "ElectroSL Backend" /MIN cmd /k "cd /d %~dp0ElectroSL-Backend && dotnet run"
    echo [OK] ASP.NET Core Backend launching...
) else (
    echo [!] Folder ElectroSL-Backend not found. Check folder name.
)

:: 3. Start React Vite Frontend in a minimized window
if exist "%~dp0ElectroSL-FrontEnd" (
    start "ElectroSL Frontend" /MIN cmd /k "cd /d %~dp0ElectroSL-FrontEnd && npm run dev"
    echo [OK] React Frontend launching...
) else (
    echo [!] Folder ElectroSL-FrontEnd not found. Check folder name.
)

:: 4. Wait 5 seconds for servers to initialize, then open browser
echo.
echo Opening http://localhost:5173 in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo ==================================================
echo   ElectroSL is running! Minimize this window.
echo ==================================================
pause