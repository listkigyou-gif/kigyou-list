# install_stripe_cli.ps1
# This script automatically downloads the latest Stripe CLI for Windows, extracts it into the scratch folder, and verifies it.

$ErrorActionPreference = "Stop"

$workspaceDir = "c:\TUHOCLAPTRINH\kigyou-list"
$scratchDir = Join-Path $workspaceDir "scratch"
$destFolder = Join-Path $scratchDir "stripe-cli"
$zipFile = Join-Path $scratchDir "stripe_cli_windows.zip"

Write-Host "Creating stripe-cli directory if not exists: $destFolder"
if (!(Test-Path $destFolder)) {
    New-Item -ItemType Directory -Path $destFolder -Force | Out-Null
}

Write-Host "Fetching the latest release info from GitHub API..."
$releaseUrl = "https://api.github.com/repos/stripe/stripe-cli/releases/latest"
# Force security protocol for TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
try {
    $latestRelease = Invoke-RestMethod -Uri $releaseUrl -Headers @{"User-Agent"="StripeCLI-Installer"}
} catch {
    Write-Error "Failed to fetch latest release from GitHub API. Please check your internet connection."
}

# Find the asset that ends with windows_x86_64.zip
$downloadUrl = $latestRelease.assets | Where-Object { $_.name -like "*_windows_x86_64.zip" } | Select-Object -ExpandProperty browser_download_url

if (!$downloadUrl) {
    Write-Error "Could not find a suitable windows_x86_64.zip asset in the latest release."
}

Write-Host "Downloading Stripe CLI from: $downloadUrl"
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile -Headers @{"User-Agent"="StripeCLI-Installer"}
} catch {
    Write-Error "Failed to download zip file."
}

Write-Host "Extracting zip file..."
try {
    Expand-Archive -Path $zipFile -DestinationPath $destFolder -Force
} catch {
    Write-Error "Failed to extract zip file."
} finally {
    if (Test-Path $zipFile) {
        Remove-Item -Path $zipFile -Force
    }
}

$stripeExe = Join-Path $destFolder "stripe.exe"
if (Test-Path $stripeExe) {
    Write-Host "Stripe CLI successfully installed!"
    $version = & $stripeExe version
    Write-Host "Installed version: $version"
} else {
    Write-Error "stripe.exe was not found in the extraction path."
}
