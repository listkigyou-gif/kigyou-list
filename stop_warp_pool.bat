@echo off
echo ========================================================
echo  Kigyou-List: Dung toan bo WARP Containers de giai phong RAM
echo ========================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ids = docker ps -q -f 'name=^/warp-'; if ($ids) { docker stop $ids | Out-Null; Write-Host '[+] Da dung thanh cong toan bo WARP containers! RAM da duoc giai phong.' } else { Write-Host '[*] Hien khong co WARP container nao dang chay.' }"
pause
