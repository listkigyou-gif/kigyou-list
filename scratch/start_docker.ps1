Write-Host "Attempting to start Docker Desktop Service..."
try {
    Start-Service 'com.docker.service' -ErrorAction Stop
    Write-Host "Service com.docker.service started."
} catch {
    Write-Warning "Could not start com.docker.service directly. Attempting to start Docker Desktop executable..."
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
    } else {
        Write-Error "Docker Desktop executable not found."
    }
}

$timeout = 90
$elapsed = 0
$dockerrunning = $false
while ($elapsed -lt $timeout) {
    # Run docker ps and check the exit code
    & docker ps > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerrunning = $true
        break
    }
    Start-Sleep -Seconds 3
    $elapsed += 3
    Write-Host "Waiting for Docker daemon... ($elapsed s / $timeout s)"
}

if ($dockerrunning) {
    Write-Host "Docker daemon is running! Starting kigyou-postgres container..."
    docker start kigyou-postgres
} else {
    Write-Error "Docker daemon failed to start."
}
