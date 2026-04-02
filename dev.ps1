Write-Host "Starting Et3am Development Servers..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend running on http://localhost:3001" -ForegroundColor Green
Write-Host "Frontend running on http://localhost:5173" -ForegroundColor Green
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"
