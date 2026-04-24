# Coinché — local development (Windows PowerShell)
# Prerequisites: Node 18 LTS, PostgreSQL + Redis + RabbitMQ reachable (see docker-compose.infra.yml)

$ErrorActionPreference = "Stop"

$nvmNode = Join-Path $env:APPDATA "nvm\v18.20.3\node.exe"
if (Test-Path $nvmNode) {
  $nodeDir = Split-Path $nvmNode -Parent
  $env:Path = "$nodeDir;$env:Path"
  Write-Host "Using Node from: $nodeDir"
} else {
  Write-Host "Using Node from PATH (ensure Node 18 LTS if npm fails on Node 24+)"
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path "$root\backend\node_modules")) {
  Set-Location "$root\backend"
  npm install
  Set-Location $root
}
if (-not (Test-Path "$root\frontend\node_modules")) {
  Set-Location "$root\frontend"
  npm install
  Set-Location $root
}

Write-Host ""
Write-Host "Starting API on http://localhost:3001 (new window)..."
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "Set-Location '$root\backend'; npm run start:dev"
)

Start-Sleep -Seconds 3

Write-Host "Starting Next.js on http://localhost:3000 (new window)..."
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "Set-Location '$root\frontend'; npm run dev"
)

Write-Host ""
Write-Host "Opened two terminals. If the API exits immediately, start infrastructure:"
Write-Host "  docker compose -f docker-compose.infra.yml up -d"
Write-Host ""
