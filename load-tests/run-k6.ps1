# MFILM k6 Load Test Runner for Windows PowerShell (via Docker)
param (
    [string]$TargetUrl = "http://host.docker.internal:4000/api/v1/events",
    [int]$VUs = 100,
    [string]$Duration = "30s"
)

Write-Host "🚀 Launching MFILM k6 Load Test against $TargetUrl with $VUs VUs for $Duration..." -ForegroundColor Cyan

docker run --rm -i `
    --network host `
    -v "${PWD}:/scripts" `
    -e TARGET_URL="$TargetUrl" `
    grafana/k6:latest run /scripts/k6-events-load-test.js --vus $VUs --duration $Duration
