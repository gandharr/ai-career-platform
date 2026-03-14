$ErrorActionPreference = "Stop"

Write-Host "Stopping containers and removing networks..." -ForegroundColor Yellow
docker compose down

Write-Host "Removing volumes (DB reset)..." -ForegroundColor Yellow
docker compose down -v

Write-Host "Cleanup complete. Fresh demo can be started with ./scripts/demo.ps1" -ForegroundColor Green
