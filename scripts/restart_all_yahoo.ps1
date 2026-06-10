# scripts/restart_all_yahoo.ps1
# Script tự động dọn dẹp và khởi chạy lại hệ thống cào dữ liệu Yahoo

# Đảm bảo thư mục làm việc là thư mục gốc của dự án
$ProjectRoot = Resolve-Path "$PSScriptRoot\.."
Set-Location $ProjectRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " KHỞI CHẠY LẠI HỆ THỐNG CÀO YAHOO MAPS" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Dọn dẹp các tiến trình cũ để tránh xung đột
Write-Host "[1/5] Đang dọn dẹp các tiến trình cũ bị treo..." -ForegroundColor Yellow
try {
    # Dọn dẹp Chrome headless shell mồ côi
    $chromes = Get-Process -Name "chrome-headless-shell" -ErrorAction SilentlyContinue
    if ($chromes) {
        Write-Host "     Phát hiện $($chromes.Count) tiến trình Chrome headless đang chạy. Đang dừng..."
        Stop-Process -Name "chrome-headless-shell" -Force -ErrorAction SilentlyContinue
    }
    
    # Dọn dẹp các container proxy cũ
    Write-Host "     Đang dừng các container proxy cũ..."
    docker compose -f crawlers/yahoo/docker-compose.yml down -v --remove-orphans > $null 2>&1
    
    # Dọn dẹp các tiến trình Python cũ chạy các script liên quan
    $pythonProcs = Get-CimInstance Win32_Process -Filter "name LIKE 'python%'" -ErrorAction SilentlyContinue
    foreach ($proc in $pythonProcs) {
        if ($proc.CommandLine -like "*run_yahoo_daemon.py*" -or $proc.CommandLine -like "*monitor_yahoo.py*" -or $proc.CommandLine -like "*yahoo_watchdog.py*" -or $proc.CommandLine -like "*yahoo_searcher.py*") {
            Write-Host "     Dừng tiến trình Python cũ: (PID: $($proc.ProcessId))"
            Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "[+] Đã dọn dẹp sạch sẽ các tiến trình cũ." -ForegroundColor Green
} catch {
    Write-Warning "[-] Có lỗi xảy ra khi dọn dẹp tiến trình: $_"
}

# 2. Khởi động Docker Desktop Service
Write-Host "[2/5] Đang kiểm tra và khởi động Docker..." -ForegroundColor Yellow
$dockerService = Get-Service -Name "com.docker.service" -ErrorAction SilentlyContinue
if ($dockerService -and $dockerService.Status -ne "Running") {
    try {
        Start-Service 'com.docker.service' -ErrorAction Stop
        Write-Host "[+] Đã khởi động dịch vụ Docker Desktop Service." -ForegroundColor Green
    } catch {
        Write-Warning "[-] Không thể khởi động Service trực tiếp. Thử chạy Docker Desktop.exe..."
        $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        if (Test-Path $dockerPath) {
            Start-Process $dockerPath
            Write-Host "[+] Đã kích hoạt ứng dụng Docker Desktop." -ForegroundColor Green
        } else {
            Write-Error "[-] Không tìm thấy Docker Desktop tại đường dẫn tiêu chuẩn."
        }
    }
} elseif ($dockerService -and $dockerService.Status -eq "Running") {
    Write-Host "[+] Dịch vụ Docker Desktop Service đã chạy sẵn." -ForegroundColor Green
} else {
    # Nếu không thấy service, thử chạy trực tiếp exe
    Write-Host "     Không tìm thấy service com.docker.service. Thử khởi chạy Docker Desktop.exe..."
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
        Write-Host "[+] Đã kích hoạt ứng dụng Docker Desktop." -ForegroundColor Green
    } else {
        Write-Warning "[-] Không tìm thấy Docker Desktop."
    }
}

# 3. Đợi Docker Daemon sẵn sàng
$timeout = 90
$elapsed = 0
$dockerrunning = $false
Write-Host "[3/5] Đang đợi Docker Daemon kết nối..." -ForegroundColor Yellow
while ($elapsed -lt $timeout) {
    & docker ps > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerrunning = $true
        break
    }
    Start-Sleep -Seconds 3
    $elapsed += 3
    Write-Host "     Đang kết nối tới Docker... ($elapsed s / $timeout s)"
}

if (-not $dockerrunning) {
    Write-Error "[-] LỖI: Docker Daemon không sẵn sàng sau $timeout giây. Vui lòng bật Docker Desktop thủ công."
    exit 1
}
Write-Host "[+] Docker Daemon đang hoạt động." -ForegroundColor Green

# 4. Khởi động PostgreSQL Container
Write-Host "[4/5] Đang khởi động container PostgreSQL (kigyou-postgres)..." -ForegroundColor Yellow
& docker start kigyou-postgres
if ($LASTEXITCODE -eq 0) {
    Write-Host "[+] Container kigyou-postgres đã chạy." -ForegroundColor Green
} else {
    Write-Error "[-] Không thể khởi động container kigyou-postgres."
    exit 1
}

# 5. Khởi chạy Daemon và Monitor trong các cửa sổ riêng biệt
Write-Host "[5/5] Đang khởi chạy Daemon và Monitor trong các cửa sổ Terminal mới..." -ForegroundColor Yellow

# Chạy run_yahoo_daemon.py
# ⚡ ĐIỀU CHỈNH SỐ LUỒNG TẠI ĐÂY:
#   - Mạng chậm / bình thường: --max-workers 15
#   - Mạng tốc độ cao:          --max-workers 50  (đổi lại khi mạng tốt)
$maxWorkers = 50
Start-Process -FilePath "C:\Users\admin\AppData\Local\Programs\Python\Python313\python.exe" -WorkingDirectory $ProjectRoot -ArgumentList "scripts/run_yahoo_daemon.py --max-workers $maxWorkers --thread-batch-size 1000" -WindowStyle Hidden
Write-Host "[+] Đã khởi chạy Daemon cào dữ liệu chạy ngầm ($maxWorkers workers)." -ForegroundColor Green

# Chạy monitor_yahoo.py
Start-Process -FilePath "C:\Users\admin\AppData\Local\Programs\Python\Python313\python.exe" -WorkingDirectory $ProjectRoot -ArgumentList "-u scripts/monitor_yahoo.py" -WindowStyle Hidden
Write-Host "[+] Đã khởi chạy Monitor cập nhật báo cáo chạy ngầm." -ForegroundColor Green

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " HOÀN THÀNH: Hệ thống cào Yahoo đang được khởi chạy lại!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
