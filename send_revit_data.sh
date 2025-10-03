#!/bin/bash
# HealthMetric RevitSlaveData Sender
# This script sends all files from the RevitSlaveData folder to GitHub

echo "========================================"
echo "HealthMetric RevitSlaveData Sender"
echo "========================================"
echo

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "ERROR: Python is not installed or not in PATH"
        echo "Please install Python and try again"
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "WARNING: GITHUB_TOKEN environment variable is not set"
    echo "Please set your GitHub token:"
    echo "export GITHUB_TOKEN=your_token_here"
    echo
    echo "Or run with token parameter:"
    echo "$PYTHON_CMD sender/sender.py --revit-slave --token your_token_here"
    echo
    exit 1
fi

echo "Sending RevitSlaveData..."
echo

# Send RevitSlaveData
$PYTHON_CMD sender/sender.py --revit-slave

echo
echo "========================================"
echo "Process completed!"
echo "========================================"
