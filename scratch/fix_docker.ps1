Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " FIXING STUCK DOCKER DESKTOP ON WINDOWS" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Force kill all Docker Desktop related processes
Write-Host "[1/5] Stopping all Docker processes..." -ForegroundColor Yellow
$procNames = @("Docker Desktop", "com.docker.backend", "vpnkit", "com.docker.proxy", "docker")
foreach ($name in $procNames) {
    Stop-Process -Name $name -Force -ErrorAction SilentlyContinue
}

# Stop Docker Windows Service
Stop-Service -Name "com.docker.service" -Force -ErrorAction SilentlyContinue

# 2. Shutdown WSL to reset the virtual machine
Write-Host "[2/5] Resetting WSL VM (wsl --shutdown)..." -ForegroundColor Yellow
wsl --shutdown
Start-Sleep -Seconds 3

# 3. Start Docker Desktop Service and Executable
Write-Host "[3/5] Starting Docker service and executable..." -ForegroundColor Yellow
try {
    Start-Service "com.docker.service" -ErrorAction Stop
} catch {
    Write-Warning "Could not start service directly: $_"
}

$dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (Test-Path $dockerPath) {
    Start-Process $dockerPath
    Write-Host "[+] Docker Desktop launcher started." -ForegroundColor Green
} else {
    Write-Error "[-] Docker Desktop executable not found."
}

# 4. Wait for Docker Daemon to be fully online and responsive
$timeout = 120
$elapsed = 0
$dockerrunning = $false
Write-Host "[4/5] Waiting for Docker daemon to become responsive..." -ForegroundColor Yellow
while ($elapsed -lt $timeout) {
    $test = & docker ps 2>&1
    if ($LASTEXITCODE -eq 0 -and $test -notlike "*500 Internal Server Error*") {
        $dockerrunning = $true
        break
    }
    Start-Sleep -Seconds 5
    $elapsed += 5
    Write-Host "     Waiting for Docker... ($elapsed s / $timeout s)"
}

if (-not $dockerrunning) {
    Write-Error "[-] ERROR: Docker Daemon not ready after $timeout seconds."
    exit 1
}
Write-Host "[+] Docker Daemon is running normally!" -ForegroundColor Green

# 5. Start containers
Write-Host "[5/5] Starting PostgreSQL and SOCKS5 Proxies..." -ForegroundColor Yellow
& docker start kigyou-postgres
Start-Sleep -Seconds 2

# Start docker-compose proxy services
$ProjectRoot = Resolve-Path "$PSScriptRoot\.."
Set-Location $ProjectRoot
& docker compose -f crawlers/yahoo/docker-compose.yml up -d

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " DOCKER AND CONTAINERS RESTARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
