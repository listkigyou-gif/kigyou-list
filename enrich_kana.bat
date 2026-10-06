@echo off
chcp 65001 > nul
echo ===================================================
echo   TIẾN TRÌNH SUY LUẬN & BỔ SUNG FURIGANA (フリガナ)
echo ===================================================
python scripts\enrich_kana_batch.py %*
pause
