#!/usr/bin/env bash
set -e

echo "======================================================================"
echo "          AGRICIRCLE - NEN TANG NONG NGHIEP TUAN HOAN THCS"
echo "======================================================================"

if ! command -v node >/dev/null 2>&1; then
    echo "[LOI] Khong tim thay Node.js tren may tinh!"
    echo "Vui long cai dat Node.js (v20 hoac v22) tu: https://nodejs.org"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[1/3] Dang cai dat thu vien ban do Leaflet..."
    npm install
fi

echo "[2/3] Dang khoi dong may chu AgriCircle..."
echo "Dia chi truy cap tren may: http://localhost:3000"
echo "Dia chi mang LAN:"
hostname -I 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "  http://" $2 ":3000"}' || true

echo "[3/3] Khoi chay he thong..."
node src/server/index.js

