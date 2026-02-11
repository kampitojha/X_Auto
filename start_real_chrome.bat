@echo off
echo ===================================================
echo 🛑 CLOSING CHROME (Save your work first!)
echo ===================================================
timeout /t 3
taskkill /F /IM chrome.exe /T >nul 2>&1

echo.
echo 🚀 Starting Chrome using YOUR Real Profile...
echo (You will already be logged in!)
echo.

start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Users\91991\AppData\Local\Google\Chrome\User Data"

echo ✅ Chrome Started on Port 9222.
echo 👉 Now run 'node browser_monitor.js' in the terminal.
pause
