@echo off
REM HealthMetric Sender - Silent Batch Launcher
REM This batch file runs the Python script without showing any console windows

REM Set environment variables
set PYTHONIOENCODING=utf-8
set PYTHONUNBUFFERED=1

REM Run the Python script silently
python sender.py > nul 2>&1

REM Exit with the same code as Python
exit /b %ERRORLEVEL%
