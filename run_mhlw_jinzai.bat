@echo off
chcp 65001 > nul
echo =====================================================================
echo   KIGYOU-LIST: MHLW JINZAI (HAKKEN & JINZAI SHOKAI) NATIONWIDE EXPANDER
echo   Target: Ministry of Health, Labour and Welfare (厚生労働省)
echo =====================================================================
echo.
cd /d "%~dp0"
python scripts\expand_mhlw_jinzai.py %*
pause
