@echo off
REM ========================================================
REM Kigyou-list Automated Daily IndexNow Runner
REM Submits up to 1,000 unindexed companies to Bing & IndexNow
REM ========================================================
chcp 65001 >nul
echo [%date% %time%] Starting automated IndexNow daily submission... >> c:\kigyou-list\scripts\indexnow_history.log

python c:\kigyou-list\scripts\auto_indexnow_submitter.py --batch-size 5000 >> c:\kigyou-list\scripts\indexnow_history.log 2>&1

echo [%date% %time%] Finished IndexNow daily submission. >> c:\kigyou-list\scripts\indexnow_history.log
