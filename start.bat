@echo off
echo.
echo ================================================
echo   🎉 UNDANGAN DIGITAL KHITANAN AHMAD
echo ================================================
echo.

echo 📦 Installing dependencies...
call npm install

echo.
echo 🔨 Building JavaScript bundles...
call npx esbuild js/*.js --bundle --outdir=dist

echo.
echo 🚀 Starting development server...
echo.
echo ✅ Server akan berjalan di:
echo    - Main invitation: http://localhost:3001
echo    - Guest generator: http://localhost:3001/generate.html
echo    - Simple version:  http://localhost:3001/simple.html
echo.
echo 🛑 Tekan Ctrl+C untuk menghentikan server
echo.

call npm run dev

pause
