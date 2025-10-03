# HealthMetric Sender Standalone Build Script
# This script builds a standalone executable using PyInstaller and moves it to the destination

param(
    [string]$DestinationPath = "C:\Users\szhang\github\EnneadTab-OS\Apps\lib\ExeProducts"
)

# Set error handling
$ErrorActionPreference = "Stop"

# Script configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SenderDir = Join-Path $ScriptDir "sender"
$SpecFile = "HealthMetricSender_standalone.spec"
$OutputName = "HealthMetricSender.exe"
$BuildDir = Join-Path $SenderDir "dist"
$ExePath = Join-Path $BuildDir $OutputName

Write-Host "=== HealthMetric Sender Standalone Build Script ===" -ForegroundColor Green
Write-Host "Script Directory: $ScriptDir" -ForegroundColor Yellow
Write-Host "Sender Directory: $SenderDir" -ForegroundColor Yellow
Write-Host "Destination: $DestinationPath" -ForegroundColor Yellow
Write-Host ""

try {
    # Check for running HealthMetric processes and warn user
    $runningProcesses = Get-Process | Where-Object {$_.ProcessName -like "*HealthMetric*"}
    if ($runningProcesses) {
        Write-Host "⚠️  WARNING: Found running HealthMetric processes that may interfere with the build:" -ForegroundColor Yellow
        $runningProcesses | ForEach-Object { Write-Host "  - PID $($_.Id): $($_.ProcessName)" -ForegroundColor Yellow }
        Write-Host "Consider closing these processes before building." -ForegroundColor Yellow
        Write-Host ""
    }

    # Check if we're in the correct directory
    if (-not (Test-Path $SenderDir)) {
        throw "Sender directory not found: $SenderDir"
    }

    # Check if spec file exists
    $SpecFilePath = Join-Path $SenderDir $SpecFile
    if (-not (Test-Path $SpecFilePath)) {
        throw "Spec file not found: $SpecFilePath"
    }

    # Change to sender directory
    Write-Host "Changing to sender directory..." -ForegroundColor Cyan
    Set-Location $SenderDir

    # Clean previous builds
    Write-Host "Cleaning previous builds..." -ForegroundColor Cyan
    if (Test-Path "build") {
        try {
            Remove-Item -Path "build" -Recurse -Force -ErrorAction Stop
        } catch {
            Write-Host "⚠️  Warning: Could not fully clean build directory. Some files may be locked." -ForegroundColor Yellow
            Write-Host "   This is usually not a problem and the build will continue." -ForegroundColor Yellow
        }
    }
    if (Test-Path "dist") {
        try {
            Remove-Item -Path "dist" -Recurse -Force -ErrorAction Stop
        } catch {
            Write-Host "⚠️  Warning: Could not fully clean dist directory. Some files may be locked." -ForegroundColor Yellow
            Write-Host "   This is usually not a problem and the build will continue." -ForegroundColor Yellow
        }
    }

    # Install/update requirements
    Write-Host "Installing/updating requirements..." -ForegroundColor Cyan
    if (Test-Path "requirements.txt") {
        pip install -r requirements.txt --quiet
    }

    # Build the standalone executable
    Write-Host "Building standalone executable with PyInstaller..." -ForegroundColor Cyan
    Write-Host "Using spec file: $SpecFile" -ForegroundColor Yellow
    
    $buildArgs = @(
        "-m", "PyInstaller",
        $SpecFile,
        "--clean",
        "--noconfirm"
    )
    
    $maxRetries = 3
    $retryCount = 0
    $buildSuccess = $false
    
    do {
        $retryCount++
        if ($retryCount -gt 1) {
            Write-Host "Retry attempt $retryCount of $maxRetries..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
        
        $process = Start-Process -FilePath "python" -ArgumentList $buildArgs -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -eq 0) {
            $buildSuccess = $true
        } else {
            Write-Host "Build attempt $retryCount failed with exit code: $($process.ExitCode)" -ForegroundColor Red
        }
    } while (-not $buildSuccess -and $retryCount -lt $maxRetries)
    
    if (-not $buildSuccess) {
        throw "PyInstaller build failed after $maxRetries attempts"
    }

    # Check if the executable was created
    if (-not (Test-Path $ExePath)) {
        throw "Executable not found after build: $ExePath"
    }

    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "Executable created: $ExePath" -ForegroundColor Yellow

    # Create destination directory if it doesn't exist
    if (-not (Test-Path $DestinationPath)) {
        Write-Host "Creating destination directory: $DestinationPath" -ForegroundColor Cyan
        New-Item -Path $DestinationPath -ItemType Directory -Force | Out-Null
    }

    # Move the executable to destination
    $DestinationExe = Join-Path $DestinationPath $OutputName
    Write-Host "Moving executable to destination..." -ForegroundColor Cyan
    Write-Host "From: $ExePath" -ForegroundColor Yellow
    Write-Host "To: $DestinationExe" -ForegroundColor Yellow

    # Remove existing file if it exists
    if (Test-Path $DestinationExe) {
        Remove-Item -Path $DestinationExe -Force
    }

    Move-Item -Path $ExePath -Destination $DestinationExe -Force

    # Verify the move was successful
    if (Test-Path $DestinationExe) {
        $fileSize = (Get-Item $DestinationExe).Length
        Write-Host "✅ SUCCESS: Executable moved successfully!" -ForegroundColor Green
        Write-Host "Final location: $DestinationExe" -ForegroundColor Green
        Write-Host "File size: $([math]::Round($fileSize / 1MB, 2)) MB" -ForegroundColor Green
    } else {
        throw "Failed to move executable to destination"
    }

    # Clean up build artifacts (optional)
    Write-Host "Cleaning up build artifacts..." -ForegroundColor Cyan
    if (Test-Path "build") {
        Remove-Item -Path "build" -Recurse -Force
    }
    if (Test-Path "dist") {
        Remove-Item -Path "dist" -Recurse -Force
    }

    Write-Host ""
    Write-Host "=== Build Process Completed Successfully ===" -ForegroundColor Green
    Write-Host "Standalone executable is ready at: $DestinationExe" -ForegroundColor Green

} catch {
    Write-Host ""
    Write-Host "❌ ERROR: Build failed!" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Make sure Python and PyInstaller are installed" -ForegroundColor Yellow
    Write-Host "2. Check that all dependencies are available" -ForegroundColor Yellow
    Write-Host "3. Verify the destination path is accessible" -ForegroundColor Yellow
    Write-Host "4. Run this script as Administrator if needed" -ForegroundColor Yellow
    exit 1
} finally {
    # Return to original directory
    Set-Location $ScriptDir
}
