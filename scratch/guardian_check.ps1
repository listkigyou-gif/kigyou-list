# scratch/guardian_check.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " GUARDIAN STATUS CHECK" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Count Python processes
$pythonCount = @(Get-CimInstance Win32_Process -Filter "name LIKE 'python%'").Count
if ($pythonCount -ge 53) { $pColor = "Green" } else { $pColor = "Red" }
Write-Host "Python processes running: $pythonCount" -ForegroundColor $pColor

# Count running warp containers
$warpCount = @(docker ps --filter "name=warp-" --filter "status=running" -q).Count
if ($warpCount -eq 50) { $wColor = "Green" } else { $wColor = "Red" }
Write-Host "Warp containers running: $warpCount" -ForegroundColor $wColor

# Check Postgres status
$postgresStatus = docker ps --filter "name=kigyou-postgres" --format "{{.Status}}"
if ($postgresStatus -like "*Up*") { $dbColor = "Green" } else { $dbColor = "Red" }
Write-Host "kigyou-postgres status: $postgresStatus" -ForegroundColor $dbColor

Write-Host "-----------------------------------------" -ForegroundColor Cyan
Write-Host "DOCKER CONTAINERS DETAIL:" -ForegroundColor Cyan
docker ps --filter name=warp- --filter name=kigyou-postgres --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
