@echo off
chcp 65001 >nul
title Kigyou-List: Yahoo Searcher Multi-WARP Engine
cd /d c:\kigyou-list
python crawlers\yahoo\yahoo_searcher.py --input db %*
pause
