@echo off
title PR TIMES High-Concurrency Multi-WARP Crawler
chcp 65001 > nul
cd /d C:\kigyou-list

echo =======================================================
echo    PR TIMES HIGH-CONCURRENCY MULTI-WARP CRAWLER
echo       (35-40 Workers ^| 40 Cloudflare WARP Proxies)
echo =======================================================
echo.
echo Running Unified Pipeline: Harvest -^> Crawl -^> Enrich -^> Sync PG...
python crawlers\prtimes\main.py --mode all --limit 500 --workers 35 --warp-ports 40011-40050

echo.
echo =======================================================
echo [DONE] PR TIMES Enrichment completed successfully!
echo =======================================================
pause
