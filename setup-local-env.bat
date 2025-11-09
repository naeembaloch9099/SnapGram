@echo off
REM Get local IP address and create .env.local file
REM Run this from the FrontEnd directory to auto-configure

for /f "tokens=2 delims=: " %%a in ('ipconfig ^| findstr /c:"IPv4 Address" ^| findstr /v "127.0.0"') do (
    set LOCAL_IP=%%a
    goto found
)

:found
if defined LOCAL_IP (
    echo Found your local IP: %LOCAL_IP%
    echo Creating .env.local with VITE_API_URL=http://%LOCAL_IP%:4000/api
    (
        echo # Auto-generated local environment
        echo VITE_API_URL=http://%LOCAL_IP%:4000/api
    ) > .env.local
    echo ✓ Created .env.local
    echo.
    echo Access your app from:
    echo   - Localhost: http://localhost:5173
    echo   - Local Network: http://%LOCAL_IP%:5173
    echo   - Mobile/Other Device: http://%LOCAL_IP%:5173
) else (
    echo Could not find local IP address
    echo Please manually set VITE_API_URL in .env.local
)

pause
