@echo off
echo 🚀 HealthMetric Cache Busting Script
echo ====================================

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python not found!
    echo Please install Python and try again.
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "docs" (
    echo ❌ Error: docs/ directory not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

echo 🔄 Running cache busting script...
python scripts/clear_cache.py

if errorlevel 1 (
    echo ❌ Cache busting failed!
    pause
    exit /b 1
)

echo.
echo ✅ Cache busting completed!
echo 💡 You can now commit and push the changes:
echo    git add .
echo    git commit -m "chore: cache bust"
echo    git push

pause
