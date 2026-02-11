@echo off
echo ==========================================
echo  DREAM3DFORGE - Push to GitHub
echo ==========================================
echo.

cd /d "E:\god folder\DREAM3DFORGE"

echo Adding remote...
git remote add origin https://github.com/weemadscotsman/dream3dforge-ai-game-studio.git 2>nul

echo.
echo Pushing to GitHub...
git push -u origin main

echo.
if %ERRORLEVEL% == 0 (
    echo ==========================================
    echo  SUCCESS! DREAM3DFORGE is now live!
    echo  https://github.com/weemadscotsman/dream3dforge-ai-game-studio
    echo ==========================================
) else (
    echo ==========================================
    echo  ERROR: Push failed!
    echo.
    echo  Make sure you:
    echo  1. Created the repo at github.com/new
    echo  2. Are logged into Git
    echo  3. Have internet connection
    echo ==========================================
)

pause
