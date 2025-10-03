@echo off
REM HealthMetric RevitSlaveData Sender
REM This script sends all files from the RevitSlaveData folder to GitHub

echo ========================================
echo HealthMetric RevitSlaveData Sender
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python and try again
    pause
    exit /b 1
)

REM Check if GITHUB_TOKEN is set
if "%GITHUB_TOKEN%"=="" (
    echo WARNING: GITHUB_TOKEN environment variable is not set
    echo Please set your GitHub token:
    echo set GITHUB_TOKEN=your_token_here
    echo.
    echo Or run with token parameter:
    echo python sender\sender.py --revit-slave --token your_token_here
    echo.
    pause
    exit /b 1
)

echo Sending RevitSlaveData...
echo.

REM Send RevitSlaveData
python sender\sender.py --revit-slave

echo.
echo ========================================
echo Process completed!
echo ========================================
pause
