@echo off
chcp 65001 >nul
title Kigyou-List: SSH Tunnel to ConoHa VPS (160.251.203.84)
echo =========================================================================
echo   [Kigyou-List] Đang mở cổng bảo mật SSH Tunnel đến ConoHa VPS...
echo   IP Server: 160.251.203.84
echo   Cổng 5433 máy tính của bạn đã được kết nối với PostgreSQL trên VPS!
echo -------------------------------------------------------------------------
echo   Lưu ý: Hãy GIỮ CỬA SỔ NÀY MỞ trong khi bạn chạy "npm run dev"
echo   Để đóng kết nối: Hãy nhấn tổ hợp phím Ctrl + C hoặc tắt cửa sổ này.
echo =========================================================================
ssh -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 -o ServerAliveCountMax=6 -N -L 5433:localhost:5432 root@160.251.203.84
pause
