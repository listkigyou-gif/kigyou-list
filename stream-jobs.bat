@echo off
chcp 65001 >nul
title Kigyou-List: HelloWork Live Stream
cd /d c:\kigyou-list
python -u scripts\stream_jobs.py
pause
