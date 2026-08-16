@echo off
color 0A
echo ==============================================
echo       COLLEGE SALES DASHBOARD STARTUP
echo ==============================================
echo.
echo Starting the development server...
echo Please wait a moment while the server boots up!
echo.

:: Navigate to the Dashboard directory
cd /d "%~dp0"

:: Wait 2 seconds then open the browser in the background
start "" /b cmd /c "timeout /t 2 >nul & start http://localhost:5173/"

:: Start the Vite server
npm run dev

pause
