@echo off
REM HealthMetric Sender Standalone Build Script
REM This script builds a standalone executable using PyInstaller and moves it to the destination

setlocal enabledelayedexpansion

REM Optional arg handling: pass "run" to launch the exe after build
set "RUN_AFTER_BUILD=0"
if /I "%~1"=="run" set "RUN_AFTER_BUILD=1"

REM Configuration
set "DESTINATION_PATH=C:\Users\szhang\github\EnneadTab-OS\Apps\lib\ExeProducts"
set "SENDER_DIR=%~dp0sender"
set "SPEC_FILE=HealthMetricSender.spec"
set "OUTPUT_NAME=HealthMetricSender.exe"

echo === HealthMetric Sender Standalone Build Script ===
echo Sender Directory: %SENDER_DIR%
echo Destination: %DESTINATION_PATH%
echo.

REM Check if sender directory exists
if not exist "%SENDER_DIR%" (
    echo ERROR: Sender directory not found: %SENDER_DIR%
    exit /b 1
)

REM Check if spec file exists
if not exist "%SENDER_DIR%\%SPEC_FILE%" (
    echo ERROR: Spec file not found: %SENDER_DIR%\%SPEC_FILE%
    exit /b 1
)

REM Change to sender directory
echo Changing to sender directory...
cd /d "%SENDER_DIR%"

REM Clean previous builds
echo Cleaning previous builds...
if exist "build" rmdir /s /q "build" 2>nul
if exist "dist" rmdir /s /q "dist" 2>nul

REM Install/update requirements
echo Installing/updating requirements...
if exist "requirements.txt" (
    pip install -r requirements.txt --quiet
)

REM Build the standalone executable
echo Building standalone executable with PyInstaller...
echo Using spec file: %SPEC_FILE%

python -m PyInstaller %SPEC_FILE% --clean --noconfirm
if errorlevel 1 (
    echo ERROR: PyInstaller build failed!
    exit /b 1
)

REM Check if the executable was created
set "EXE_PATH=dist\%OUTPUT_NAME%"
if not exist "%EXE_PATH%" (
    echo ERROR: Executable not found after build: %EXE_PATH%
    exit /b 1
)

echo Build completed successfully!
echo Executable created: %EXE_PATH%

REM Create destination directory if it doesn't exist
if not exist "%DESTINATION_PATH%" (
    echo Creating destination directory: %DESTINATION_PATH%
    mkdir "%DESTINATION_PATH%"
)

REM Move the executable to destination
set "DESTINATION_EXE=%DESTINATION_PATH%\%OUTPUT_NAME%"
echo Moving executable to destination...
echo From: %EXE_PATH%
echo To: %DESTINATION_EXE%

REM Remove existing file if it exists
if exist "%DESTINATION_EXE%" del "%DESTINATION_EXE%"

move "%EXE_PATH%" "%DESTINATION_EXE%"
if errorlevel 1 (
    echo ERROR: Failed to move executable to destination
    exit /b 1
)

REM Verify the move was successful
if exist "%DESTINATION_EXE%" (
    echo SUCCESS: Executable moved successfully!
    echo Final location: %DESTINATION_EXE%
) else (
    echo ERROR: Failed to move executable to destination
    exit /b 1
)

REM Clean up build artifacts
echo Cleaning up build artifacts...
if exist "build" rmdir /s /q "build" 2>nul
if exist "dist" rmdir /s /q "dist" 2>nul

echo.
echo === Build Process Completed Successfully ===
echo Standalone executable is ready at: %DESTINATION_EXE%
echo.

REM Optionally run the executable after build
if "%RUN_AFTER_BUILD%"=="1" (
    echo Launching executable...
    start "" "%DESTINATION_EXE%"
)
