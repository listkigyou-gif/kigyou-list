@echo off
chcp 65001 >nul
title Kigyou-List: Ultra Multi-Process Website Scraper (8 CPU Cores - 200 Workers)
cd /d c:\kigyou-list
python crawlers\website\multi_scraper.py %*
pause
