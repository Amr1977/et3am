# Et3am Deployment Script (Windows PowerShell)
# Deploys frontend to Firebase Hosting and backend to production server

param(
    [switch]$FrontendOnly,
    [switch]$BackendOnly
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Et3am Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Configuration
$BackendDir = "backend"
$FrontendDir = "frontend"
$ServerHost = "ubuntu@api.et3am.com"
$EnvFile = "$BackendDir\.env.production"

# Check if .env.production exists
if (-not (Test-Path $EnvFile)) {
    Write-Host "Error: $EnvFile not found!" -ForegroundColor Red
    exit 1
}

# Read SERVER_URL from .env
$envContent = Get-Content $EnvFile -Raw
$serverUrl = (($envContent -split 'SERVER_URL=')[1] -split "`n")[0]
Write-Host "Server URL: $serverUrl" -ForegroundColor Yellow

function Deploy-Frontend {
    Write-Host "`n=== Deploying Frontend to Firebase ===" -ForegroundColor Yellow
    
    $commitHash = git rev-parse HEAD
    Write-Host "Current commit: $commitHash" -ForegroundColor Cyan
    
    Push-Location $FrontendDir
    
    Write-Host "Building frontend..."
    npm run build
    
    Write-Host "Deploying to Firebase Hosting..."
    npx firebase deploy --only hosting --project et3am26
    
    Pop-Location
    
    Write-Host "Frontend deployed successfully!" -ForegroundColor Green
    Write-Host "Frontend URL: https://et3am26.web.app" -ForegroundColor Green
}

function Deploy-Backend {
    Write-Host "`n=== Deploying Backend to Server ===" -ForegroundColor Yellow
    
    $commitHash = git rev-parse HEAD
    Write-Host "Current commit: $commitHash" -ForegroundColor Cyan
    
    Write-Host "Building backend..."
    Push-Location $BackendDir
    npm run build
    Pop-Location
    
    Write-Host "Triggering git pull and restart on server..."
    ssh -o StrictHostKeyChecking=no $ServerHost @"
        cd /home/ubuntu/et3am
        git fetch origin master
        git reset --hard origin/master
        cd backend
        npm install --omit=dev
        pm2 restart et3am-backend
"@
    
    Write-Host "Backend deployed successfully!" -ForegroundColor Green
    Write-Host "Backend URL: $serverUrl" -ForegroundColor Green
}

# Deploy
if (-not $BackendOnly) {
    Deploy-Frontend
}

if (-not $FrontendOnly) {
    Deploy-Backend
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: https://et3am26.web.app" -ForegroundColor Cyan
Write-Host "Backend:  $serverUrl" -ForegroundColor Cyan