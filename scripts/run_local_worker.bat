@echo off
chcp 65001 > nul
title Kigyou-List Form Campaign Local Worker (WARP)
echo ======================================================================
echo    Kigyou-List Local Campaign Worker Daemon (Cloudflare WARP)
echo ======================================================================
echo.
cd /d "%~dp0\.."
python scripts\form_dispatcher\local_campaign_worker.py %*
pause
