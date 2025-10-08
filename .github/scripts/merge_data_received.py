#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Merge Data Received Script
This script processes revit_slave_xxxx folders from _data_received directory,
validates and copies JSON files to docs/asset/data, then cleans up.
"""

import os
import json
import shutil
import sys
from pathlib import Path

# Set UTF-8 encoding for console output
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Import scoring module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "docs" / "ref"))
from scoring import score_file


def print_step(step_num, total_steps, message):
    """Print a formatted step message."""
    print(f"\n{'='*80}")
    print(f"STEP {step_num}/{total_steps}: {message}")
    print('='*80)


def print_substep(message, indent=1):
    """Print a formatted substep message."""
    prefix = "  " * indent + "> "
    print(f"{prefix}{message}")


def is_valid_json(file_path):
    """
    Check if a file contains valid JSON data and has no errors.
    
    Args:
        file_path: Path to the file to validate
        
    Returns:
        bool: True if valid JSON without errors, False otherwise
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if not content.strip():
                print_substep(f"✗ File is empty: {file_path.name}", 2)
                return False
            data = json.loads(content)
        
        # Check status field
        status = data.get('status', '').lower()
        if status == 'failed':
            print_substep(f"✗ Skipping - Status is 'failed': {file_path.name}", 2)
            return False
        
        # Check for error_occurred flag
        result_data = data.get('result_data', {})
        debug_info = result_data.get('debug_info', {})
        if debug_info.get('error_occurred', False):
            print_substep(f"✗ Skipping - Error occurred during processing: {file_path.name}", 2)
            return False
        
        # Check for mock_mode (indicates real data collection failed)
        if result_data.get('mock_mode', False):
            print_substep(f"✗ Skipping - Mock mode (real data failed): {file_path.name}", 2)
            return False
        
        print_substep(f"✓ Valid JSON without errors: {file_path.name}", 2)
        return True
    except json.JSONDecodeError as e:
        print_substep(f"✗ Invalid JSON in {file_path.name}: {str(e)[:50]}...", 2)
        return False
    except Exception as e:
        print_substep(f"✗ Error reading {file_path.name}: {e}", 2)
        return False


def extract_metadata_from_filename(filename):
    """
    Extract metadata from sexyDuck filename.
    Format: YYYY-MM_HubName_ProjectNumber_ProjectName_ModelName.sexyDuck
    
    Args:
        filename: Name of the sexyDuck file
        
    Returns:
        dict: Extracted metadata
    """
    try:
        # Remove extension (lowercase only - standardized)
        name_without_ext = filename.replace('.sexyDuck', '')
        
        # Split by underscore
        parts = name_without_ext.split('_')
        
        if len(parts) >= 4:
            return {
                'date': parts[0],
                'hub': parts[1],
                'project_number': parts[2],
                'project_name': '_'.join(parts[3:-1]) if len(parts) > 4 else parts[3],
                'model_name': parts[-1] if len(parts) > 3 else 'Unknown'
            }
        else:
            return {
                'date': 'Unknown',
                'hub': 'Unknown',
                'project_number': 'Unknown',
                'project_name': 'Unknown',
                'model_name': filename
            }
    except Exception as e:
        print_substep(f"Warning: Could not parse filename {filename}: {e}", 2)
        return {
            'date': 'Unknown',
            'hub': 'Unknown',
            'project_number': 'Unknown',
            'project_name': 'Unknown',
            'model_name': filename
        }


def process_revit_slave_folder(folder_path, destination_dir, folder_num, total_folders):
    """
    Process a single revit_slave_xxxx folder.
    
    Args:
        folder_path: Path to the revit_slave_xxxx folder
        destination_dir: Destination directory for valid files
        folder_num: Current folder number being processed
        total_folders: Total number of folders to process
        
    Returns:
        tuple: (files_processed, files_skipped)
    """
    print(f"\n{'-'*80}")
    print(f"PROCESSING FOLDER {folder_num}/{total_folders}: {folder_path.name}")
    print('-'*80)
    
    # Step 1: Check for task_output folder
    print_substep("Step 1: Looking for task_output folder...", 0)
    task_output_dir = folder_path / "task_output"
    
    if not task_output_dir.exists():
        print_substep(f"✗ No task_output folder found", 1)
        return 0, 0
    
    print_substep(f"✓ Found task_output folder: {task_output_dir}", 1)
    
    # Step 2: List all files
    print_substep("Step 2: Scanning for files in task_output...", 0)
    files = list(task_output_dir.glob("*"))
    files = [f for f in files if f.is_file()]
    
    if not files:
        print_substep("✗ No files found in task_output", 1)
        return 0, 0
    
    print_substep(f"✓ Found {len(files)} file(s) to process", 1)
    for i, f in enumerate(files, 1):
        print_substep(f"File {i}: {f.name}", 2)
    
    # Step 3: Process each file
    print_substep("Step 3: Validating files (checking for errors, mock data) and copying...", 0)
    files_processed = 0
    files_skipped = 0
    
    for i, file_path in enumerate(files, 1):
        print_substep(f"Processing file {i}/{len(files)}: {file_path.name}", 1)
        
        # Validate JSON
        if is_valid_json(file_path):
            # Copy to destination
            dest_file = destination_dir / file_path.name
            try:
                # Check if file exists and will be overwritten
                if dest_file.exists():
                    print_substep(f"⚠ File exists, will overwrite: {dest_file.name}", 2)
                
                shutil.copy2(file_path, dest_file)
                print_substep(f"✓ Successfully copied to: {dest_file}", 2)
                files_processed += 1
            except Exception as e:
                print_substep(f"✗ Error copying file: {e}", 2)
                files_skipped += 1
        else:
            print_substep(f"✗ Skipping invalid file", 2)
            files_skipped += 1
    
    print_substep(f"Summary: {files_processed} copied, {files_skipped} skipped", 1)
    return files_processed, files_skipped


def generate_manifest(destination_dir):
    """
    Generate manifest.json file listing all sexyDuck files in the destination directory.
    
    Args:
        destination_dir: Directory containing the sexyDuck files
        
    Returns:
        int: Number of files added to manifest
    """
    print_substep("Generating manifest.json...", 0)
    
    # Find all .sexyDuck files (standardized lowercase extension)
    sexy_duck_files = []
    for file_path in destination_dir.iterdir():
        if file_path.is_file() and file_path.suffix == '.sexyDuck':
            sexy_duck_files.append(file_path)
    
    if not sexy_duck_files:
        print_substep("⚠ No sexyDuck files found to add to manifest", 1)
        return 0
    
    # Build manifest data
    manifest_files = []
    for file_path in sorted(sexy_duck_files):
        metadata = extract_metadata_from_filename(file_path.name)
        
        # Get file size and modification time
        file_stat = file_path.stat()
        
        manifest_files.append({
            'filename': file_path.name,
            'hub': metadata['hub'],
            'project': metadata['project_name'],
            'project_number': metadata['project_number'],
            'model': metadata['model_name'],
            'timestamp': metadata['date'],
            'filesize': file_stat.st_size,
            'last_modified': file_stat.st_mtime
        })
    
    # Create manifest structure
    import datetime
    manifest = {
        'version': '1.0',
        'generated_at': datetime.datetime.now().isoformat(),
        'total_files': len(manifest_files),
        'files': manifest_files
    }
    
    # Write manifest file
    manifest_path = destination_dir / 'manifest.json'
    try:
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        print_substep(f"✓ Manifest created with {len(manifest_files)} file(s)", 1)
        print_substep(f"✓ Manifest saved to: {manifest_path}", 1)
        return len(manifest_files)
    except Exception as e:
        print_substep(f"✗ Error writing manifest: {e}", 1)
        return 0


def score_all_files(destination_dir):
    """
    Score all sexyDuck files in the destination directory.
    
    Args:
        destination_dir: Directory containing the sexyDuck files
        
    Returns:
        tuple: (files_scored, files_failed)
    """
    print_substep("Scoring all sexyDuck files...", 0)
    
    # Find all .sexyDuck files (standardized lowercase extension)
    sexy_duck_files = []
    for file_path in destination_dir.iterdir():
        if file_path.is_file() and file_path.suffix == '.sexyDuck':
            sexy_duck_files.append(file_path)
    
    if not sexy_duck_files:
        print_substep("⚠ No sexyDuck files found to score", 1)
        return 0, 0
    
    print_substep(f"Found {len(sexy_duck_files)} file(s) to score", 1)
    
    files_scored = 0
    files_failed = 0
    
    for i, file_path in enumerate(sorted(sexy_duck_files), 1):
        print_substep(f"Scoring file {i}/{len(sexy_duck_files)}: {file_path.name}", 1)
        try:
            score_file(str(file_path))
            print_substep(f"✓ Successfully scored: {file_path.name}", 2)
            files_scored += 1
        except Exception as e:
            print_substep(f"✗ Error scoring file: {e}", 2)
            files_failed += 1
    
    print_substep(f"Summary: {files_scored} scored, {files_failed} failed", 1)
    return files_scored, files_failed


def main():
    """
    Main function to process all revit_slave_xxxx folders.
    """
    print("\n" + "="*80)
    print("HEALTHMETRIC DATA MERGE SCRIPT")
    print("="*80)
    
    # STEP 1: Initialize paths
    print_step(1, 7, "Initialize Paths and Directories")
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent.parent
    data_received_dir = project_root / "_data_received"
    destination_dir = project_root / "docs" / "asset" / "data"
    
    print_substep(f"Project Root: {project_root}", 0)
    print_substep(f"Source Directory: {data_received_dir}", 0)
    print_substep(f"Destination Directory: {destination_dir}", 0)
    
    # Check if source directory exists
    if not data_received_dir.exists():
        print_substep(f"✗ ERROR: _data_received directory not found!", 0)
        sys.exit(1)
    print_substep("✓ Source directory exists", 0)
    
    # Ensure destination directory exists
    if not destination_dir.exists():
        print_substep("Creating destination directory...", 0)
        destination_dir.mkdir(parents=True, exist_ok=True)
        print_substep("✓ Destination directory created", 1)
    else:
        print_substep("✓ Destination directory exists", 0)
    
    # STEP 2: Find all revit_slave folders
    print_step(2, 7, "Scan for revit_slave_* Folders")
    revit_slave_folders = sorted([
        d for d in data_received_dir.iterdir() 
        if d.is_dir() and d.name.startswith("revit_slave_")
    ])
    
    if not revit_slave_folders:
        print_substep("✗ No revit_slave_* folders found in _data_received", 0)
        print("\nNothing to process. Exiting.")
        return
    
    print_substep(f"✓ Found {len(revit_slave_folders)} folder(s) to process:", 0)
    for i, folder in enumerate(revit_slave_folders, 1):
        print_substep(f"Folder {i}: {folder.name}", 1)
    
    # STEP 3: Process each folder
    print_step(3, 7, "Process Each Folder")
    total_files_processed = 0
    total_files_skipped = 0
    
    for i, folder in enumerate(revit_slave_folders, 1):
        files_processed, files_skipped = process_revit_slave_folder(
            folder, destination_dir, i, len(revit_slave_folders)
        )
        total_files_processed += files_processed
        total_files_skipped += files_skipped
    
    # STEP 4: Generate manifest file
    print_step(4, 7, "Generate Manifest File for Website")
    manifest_file_count = generate_manifest(destination_dir)
    
    # STEP 5: Score all files
    print_step(5, 7, "Calculate Health Scores for All Models")
    files_scored, files_score_failed = score_all_files(destination_dir)
    
    # STEP 6: Delete processed folders
    print_step(6, 7, "Clean Up - Delete Processed Folders")
    folders_deleted = 0
    folders_failed = 0
    
    for i, folder in enumerate(revit_slave_folders, 1):
        print_substep(f"Deleting folder {i}/{len(revit_slave_folders)}: {folder.name}", 0)
        try:
            shutil.rmtree(folder)
            print_substep(f"✓ Successfully deleted: {folder.name}", 1)
            folders_deleted += 1
        except Exception as e:
            print_substep(f"✗ Error deleting folder: {e}", 1)
            folders_failed += 1
    
    # STEP 7: Final Summary
    print_step(7, 7, "Final Summary")
    print_substep(f"Folders found: {len(revit_slave_folders)}", 0)
    print_substep(f"Files copied successfully: {total_files_processed}", 0)
    print_substep(f"Files skipped (invalid): {total_files_skipped}", 0)
    print_substep(f"Manifest file entries: {manifest_file_count}", 0)
    print_substep(f"Files scored successfully: {files_scored}", 0)
    if files_score_failed > 0:
        print_substep(f"Files failed to score: {files_score_failed}", 0)
    print_substep(f"Folders deleted: {folders_deleted}", 0)
    if folders_failed > 0:
        print_substep(f"Folders failed to delete: {folders_failed}", 0)
    
    print("\n" + "="*80)
    if total_files_processed > 0:
        print("✓ SCRIPT COMPLETED SUCCESSFULLY")
    else:
        print("⚠ SCRIPT COMPLETED WITH NO FILES PROCESSED")
    print("="*80 + "\n")


if __name__ == "__main__":
    main()

