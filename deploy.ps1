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
$ServerBackendDir = "/home/ubuntu/et3am/backend"
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
    
    Write-Host "Checking if frontend already deployed..."
    $lastCommit = node -e "
        const { initializeApp } = require('firebase/app');
        const { getFirestore, doc, getDoc } = require('firebase/firestore');
        const config = {
          apiKey: 'AIzaSyD6L3_dHbWGYi6S_OOAitj69PLvdx2jjsI',
          authDomain: 'et3am26.firebaseapp.com',
          projectId: 'et3am26',
          storageBucket: 'et3am26.firebasestorage.app',
          messagingSenderId: '119582207501',
          appId: '1:119582207501:web:38dc0c5e6af37acd092f44',
        };
        const app = initializeApp(config);
        const db = getFirestore(app);
        getDoc(doc(db, 'deployments', 'frontend')).then(snap => {
          if (snap.exists()) console.log(snap.data().commit || '');
          else console.log('');
        }).catch(() => console.log(''));
    " 2>$null
    
    if ($lastCommit -eq $commitHash) {
        Write-Host "Frontend already deployed at commit: $commitHash" -ForegroundColor Green
        return
    }
    
    Push-Location $FrontendDir
    
    Write-Host "Building frontend..."
    npm run build
    
    Write-Host "Deploying to Firebase Hosting..."
    npx firebase deploy --only hosting --project et3am26
    
    Write-Host "Updating deployment record..."
    node -e "
        const { initializeApp } = require('firebase/app');
        const { getFirestore, doc, setDoc } = require('firebase/firestore');
        const config = {
          apiKey: 'AIzaSyD6L3_dHbWGYi6S_OOAitj69PLvdx2jjsI',
          authDomain: 'et3am26.firebaseapp.com',
          projectId: 'et3am26',
          storageBucket: 'et3am26.firebasestorage.app',
          messagingSenderId: '119582207501',
          appId: '1:119582207501:web:38dc0c5e6af37acd092f44',
        };
        const app = initializeApp(config);
        const db = getFirestore(app);
        setDoc(doc(db, 'deployments', 'frontend'), { commit: '$commitHash', deployedAt: Date.now() }, { merge: true }).catch(() => {});
    "
    
    Pop-Location
    
    Write-Host "Frontend deployed successfully!" -ForegroundColor Green
    Write-Host "Frontend URL: https://et3am26.web.app" -ForegroundColor Green
}

function Deploy-Backend {
    Write-Host "`n=== Deploying Backend to Server ===" -ForegroundColor Yellow
    
    # Build backend
    Write-Host "Building backend..."
    Push-Location $BackendDir
    npm run build
    Pop-Location
    
    # Sync files to server
    Write-Host "Syncing files to server..."
    $backendFiles = @("src", "dist", "package.json", "package-lock.json", "tsconfig.json", "ecosystem.config.js", "vitest.config.ts")
    
    foreach ($file in $backendFiles) {
        if (Test-Path "$BackendDir\$file") {
            scp -r -o StrictHostKeyChecking=no "$BackendDir\$file" "$ServerHost`:$ServerBackendDir/"
        }
    }
    
    # Copy ecosystem config
    if (Test-Path "et3am-ecosystem.config.js") {
        Write-Host "Copying ecosystem config..."
        scp -o StrictHostKeyChecking=no "et3am-ecosystem.config.js" "$ServerHost`:/home/ubuntu/et3am/"
    }
    
    # Install dependencies and restart on server
    Write-Host "Installing dependencies and restarting backend..."
    ssh -o StrictHostKeyChecking=no $ServerHost @"
        cd $ServerBackendDir
        npm install --omit=dev
        pm2 restart et3am-backend || pm2 start ecosystem.config.js
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