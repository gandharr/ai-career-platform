$ErrorActionPreference = "Stop"

function Invoke-Step {
    param(
        [string]$Command,
        [string]$FailureMessage
    )

    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host $FailureMessage -ForegroundColor Red
        exit 1
    }
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker CLI not found. Install Docker Desktop and re-open PowerShell." -ForegroundColor Red
    exit 1
}

Write-Host "[1/6] Building and starting containers..." -ForegroundColor Cyan
Invoke-Step "docker compose up -d --build" "Failed to build/start containers."

Write-Host "[2/6] Waiting for backend health..." -ForegroundColor Cyan
$maxAttempts = 30
$attempt = 0
$healthy = $false

while ($attempt -lt $maxAttempts) {
    $attempt += 1
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
        if ($health.status -eq "ok") {
            $healthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $healthy) {
    Write-Host "Backend did not become healthy in time. Check logs: docker compose logs backend" -ForegroundColor Red
    exit 1
}

Write-Host "[3/6] Installing backend dependencies in container (safe re-run)..." -ForegroundColor Cyan
Invoke-Step "docker compose exec -T backend pip install -r requirements.txt" "Failed to install backend dependencies in container."

Write-Host "[4/6] Seeding demo data..." -ForegroundColor Cyan
Invoke-Step "docker compose exec -T backend python scripts/seed_data.py" "Seeding failed."

Write-Host "[5/6] Running smoke test..." -ForegroundColor Cyan
Invoke-Step "docker compose exec -T backend python scripts/smoke_test.py" "Smoke test failed."

Write-Host "[6/6] Opening frontend and API docs..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"
Start-Process "http://localhost:8000/docs"

Write-Host "Demo environment is ready." -ForegroundColor Green
