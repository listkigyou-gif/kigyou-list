@echo off
chcp 65001 >nul
title Kigyou-List: Next.js Frontend Dev Server
echo =========================================================================
echo   [Kigyou-List] Đang khởi động máy chủ phát triển Next.js Frontend...
echo   URL: http://localhost:3000
echo =========================================================================
cd /d %~dp0frontend
npm run dev
pause
