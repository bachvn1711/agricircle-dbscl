@echo off
chcp 65001 >nul
title AgriCircle - He Thong Trao Doi Phu Pham Nong Nghiep
cls

echo ======================================================================
echo           AGRICIRCLE - NEN TANG NONG NGHIEP TUAN HOAN THCS
echo ======================================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js tren may tinh!
    echo Vui long cai dat Node.js (v20 hoac v22) tu: https://nodejs.org
    echo.
    pause
    exit /b 1
)

if not exist node_modules (
    echo [1/3] Dang cai dat thu vien ban do Leaflet...
    call npm install
    echo.
)

echo [2/3] Dang khoi dong may chu AgriCircle...
echo.
echo Dia chi truy cap:
echo   - Tren may tinh nay: http://localhost:3000
echo   - Tren dien thoai di dong (chung mang Wi-Fi):
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    echo       http:%%a:3000
)
echo.
echo [3/3] Dang mo trinh duyet...
start http://localhost:3000

echo May chu dang chay. Nhan Ctrl + C de dung.
echo ======================================================================
echo.

node src/server/index.js
pause

