@echo off
chcp 65001 >nul
title Kigyou-List: Next.js Frontend Dev Server (Direct VPS Database)
echo =========================================================================
echo   [Kigyou-List] Đang kết nối TRỰC TIẾP 100% đến PostgreSQL VPS Server...
echo   VPS Host:   160.251.203.84:5432 (ConoHa VPS - Tokyo)
echo   Database:   kigyou_list (Production Data)
echo   Web URL:    http://localhost:3000
echo =========================================================================
echo [*] Dang khoi dong Next.js Frontend...
cd /d %~dp0frontend
npm run dev
pause
