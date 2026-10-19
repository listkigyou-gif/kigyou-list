@echo off
chcp 65001 > nul
echo ======================================================================
echo   TIẾN TRÌNH LÀM GIÀU DỮ LIỆU MỞ 47 TỈNH THÀNH (LOCAL SSD NVME)
echo   Chuyên môn: Giấy phép Xây dựng (建設業許可) & BĐS (宅建)
echo ======================================================================
echo [1/2] Đang kiểm tra và nhập dữ liệu Giấy phép Tokyo...
python scripts\import_prefecture_licenses.py %*
echo.
echo ======================================================================
echo   HOÀN TẤT LÀM GIÀU DỮ LIỆU MỞ TRÊN MÁY TÍNH LOCAL
echo ======================================================================
pause
