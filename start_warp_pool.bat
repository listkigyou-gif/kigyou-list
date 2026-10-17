@echo off
echo ========================================================
echo  Kigyou-List: Khoi dong Cloudflare WARP Pool (15 Proxies)
echo ========================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "40001..40015 | ForEach-Object { $port = $_; $name = 'warp-' + $port; if (!(docker ps -q -f ('name=^/' + $name + '$'))) { docker start $name 2>$null; if ($LASTEXITCODE -ne 0) { docker run -d --privileged --restart unless-stopped --name $name -p ($port.ToString() + ':1080') caomingjun/warp | Out-Null } } }; Write-Host '[+] 15 WARP Proxies san sang tai ports 40001 - 40015!'"
pause
