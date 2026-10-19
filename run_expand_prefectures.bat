@echo off
chcp 65001 > nul
echo ======================================================================
echo   TIẾN TRÌNH NHÂN RỘNG OPEN DATA 47 TỈNH THÀNH (LOCAL SSD NVME)
echo   Mở rộng: Osaka (大阪), Kanagawa (神奈川), Aichi (愛知), Saitama (埼玉)...
echo ======================================================================
echo [1/1] Đang kích hoạt Orchestrator nạp đa tỉnh thành...
python scripts\expand_top_prefectures.py %*
echo.
echo ======================================================================
echo   HOÀN TẤT TIẾN TRÌNH NHÂN RỘNG TRÊN MÁY TÍNH LOCAL
echo ======================================================================
pause
