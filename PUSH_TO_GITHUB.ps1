# DREAM3DFORGE - Push to GitHub
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  DREAM3DFORGE - Push to GitHub" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "E:\god folder\DREAM3DFORGE"

Write-Host "Adding remote..." -ForegroundColor Yellow
git remote add origin https://github.com/weemadscotsman/dream3dforge-ai-game-studio.git 2>$null

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "  SUCCESS! DREAM3DFORGE is now live!" -ForegroundColor Green
    Write-Host "  https://github.com/weemadscotsman/dream3dforge-ai-game-studio" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "  ERROR: Push failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Make sure you:" -ForegroundColor Yellow
    Write-Host "  1. Created the repo at github.com/new" -ForegroundColor Yellow
    Write-Host "  2. Are logged into Git" -ForegroundColor Yellow
    Write-Host "  3. Have internet connection" -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Red
}

Read-Host "Press Enter to exit"
