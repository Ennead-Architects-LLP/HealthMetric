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


def extract_project_name_from_filename(filename):
    """
    Extract project name from sexyDuck filename for legacy flat files.
    Format: YYYY-MM-DD_HubName_ProjectNumber_ProjectName_ModelName.sexyDuck
    
    Args:
        filename: Name of the sexyDuck file
        
    Returns:
        str: Project name (e.g., "1643_LHH", "2330_Studio 54")
    """
    try:
        # Remove extension
        name_without_ext = filename.replace('.sexyDuck', '')
        
        # Split by underscore
        parts = name_without_ext.split('_')
        
        if len(parts) >= 4:
            # Extract project identifier: ProjectNumber_ProjectName
            # Example: "2025-10-06_Ennead Architects LLP_1643_LHH_ModelA"
            # Parts: [0]="2025-10-06", [1]="Ennead", [2]="Architects", [3]="LLP", [4]="1643", [5]="LHH", [6]="ModelA"
            # We need to find the project number and name
            
            # Find the hub name (usually "Ennead Architects LLP")
            hub_parts = []
            project_start_idx = 1
            
            # Look for "Ennead" and collect hub parts
            for i, part in enumerate(parts[1:], 1):
                if part == "Ennead":
                    project_start_idx = i + 1  # Start after "LLP"
                    break
                hub_parts.append(part)
            
            # If we found the hub, extract project parts
            if project_start_idx < len(parts) - 1:  # Need at least project_number and model_name
                project_parts = parts[project_start_idx:-1]  # Everything except date, hub, and model
                if project_parts:
                    return '_'.join(project_parts)
            
            # Fallback: if we can't parse properly, use a default
            return "Unknown_Project"
        else:
            return "Unknown_Project"
    except Exception as e:
        print_substep(f"Warning: Could not extract project name from {filename}: {e}", 2)
        return "Unknown_Project"


def process_revit_slave_folder(folder_path, destination_dir, folder_num, total_folders):
    """
    Process a single revit_slave_xxxx folder with hybrid structure support.
    
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
    
    # Step 2: Scan for project folders and flat files
    print_substep("Step 2: Scanning for project folders and flat files...", 0)
    
    # Find all items in task_output
    all_items = list(task_output_dir.iterdir())
    project_folders = [item for item in all_items if item.is_dir()]
    flat_files = [item for item in all_items if item.is_file() and item.suffix == '.sexyDuck']
    
    print_substep(f"✓ Found {len(project_folders)} project folder(s) and {len(flat_files)} flat file(s)", 1)
    
    # List project folders
    if project_folders:
        print_substep("Project folders found:", 1)
        for i, folder in enumerate(project_folders, 1):
            print_substep(f"  {i}. {folder.name}", 2)
    
    # List flat files
    if flat_files:
        print_substep("Flat files found:", 1)
        for i, file in enumerate(flat_files, 1):
            print_substep(f"  {i}. {file.name}", 2)
    
    if not project_folders and not flat_files:
        print_substep("✗ No project folders or flat files found in task_output", 1)
        return 0, 0
    
    # Step 3: Process project folders (New Structure)
    files_processed = 0
    files_skipped = 0
    
    if project_folders:
        print_substep("Step 3: Processing project folders (New Structure)...", 0)
        for i, project_folder in enumerate(project_folders, 1):
            print_substep(f"Processing project folder {i}/{len(project_folders)}: {project_folder.name}", 1)
            
            # Create destination project folder
            dest_project_dir = destination_dir / project_folder.name
            if not dest_project_dir.exists():
                dest_project_dir.mkdir(parents=True, exist_ok=True)
                print_substep(f"✓ Created project folder: {dest_project_dir}", 2)
            
            # Process files in project folder
            project_files = list(project_folder.glob("*.sexyDuck"))
            print_substep(f"Found {len(project_files)} .sexyDuck file(s) in project folder", 2)
            
            for j, file_path in enumerate(project_files, 1):
                print_substep(f"Processing file {j}/{len(project_files)}: {file_path.name}", 2)
                
                if is_valid_json(file_path):
                    dest_file = dest_project_dir / file_path.name
                    try:
                        if dest_file.exists():
                            print_substep(f"⚠ File exists, will overwrite: {dest_file.name}", 3)
                        
                        shutil.copy2(file_path, dest_file)
                        print_substep(f"✓ Successfully copied to: {dest_file}", 3)
                        files_processed += 1
                    except Exception as e:
                        print_substep(f"✗ Error copying file: {e}", 3)
                        files_skipped += 1
                else:
                    print_substep(f"✗ Skipping invalid file", 3)
                    files_skipped += 1
    
    # Step 4: Process flat files (Legacy Structure)
    if flat_files:
        print_substep("Step 4: Processing flat files (Legacy Structure)...", 0)
        for i, file_path in enumerate(flat_files, 1):
            print_substep(f"Processing flat file {i}/{len(flat_files)}: {file_path.name}", 1)
            
            if is_valid_json(file_path):
                # Extract project name from filename
                project_name = extract_project_name_from_filename(file_path.name)
                print_substep(f"Extracted project name: {project_name}", 2)
                
                # Create destination project folder
                dest_project_dir = destination_dir / project_name
                if not dest_project_dir.exists():
                    dest_project_dir.mkdir(parents=True, exist_ok=True)
                    print_substep(f"✓ Created project folder: {dest_project_dir}", 2)
                
                # Copy file to project folder
                dest_file = dest_project_dir / file_path.name
                try:
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
    Generate hierarchical manifest.json file listing all sexyDuck files organized by project.
    
    Args:
        destination_dir: Directory containing the project folders and sexyDuck files
        
    Returns:
        int: Number of files added to manifest
    """
    print_substep("Generating hierarchical manifest.json...", 0)
    
    # Find all project folders and flat files
    projects = {}
    flat_files = []
    
    for item in destination_dir.iterdir():
        if item.is_dir() and item.name != '.git':  # Skip .git and other system folders
            # This is a project folder
            project_files = []
            for file_path in item.glob("*.sexyDuck"):
                if file_path.is_file():
                    project_files.append(file_path)
            
            if project_files:
                projects[item.name] = project_files
        elif item.is_file() and item.suffix == '.sexyDuck':
            # This is a flat file (legacy)
            flat_files.append(item)
    
    if not projects and not flat_files:
        print_substep("⚠ No sexyDuck files found to add to manifest", 1)
        return 0
    
    # Build hierarchical manifest data
    manifest_projects = []
    total_files = 0
    
    # Process project folders
    for project_name, project_files in sorted(projects.items()):
        project_models = []
        
        for file_path in sorted(project_files):
            metadata = extract_metadata_from_filename(file_path.name)
            file_stat = file_path.stat()
            
            project_models.append({
                'filename': file_path.name,
                'relative_path': f"{project_name}/{file_path.name}",
                'hub': metadata['hub'],
                'model': metadata['model_name'],
                'timestamp': metadata['date'],
                'filesize': file_stat.st_size,
                'last_modified': file_stat.st_mtime
            })
            total_files += 1
        
        manifest_projects.append({
            'project_folder': project_name,
            'project_name': project_name,
            'total_models': len(project_models),
            'models': project_models
        })
    
    # Process flat files (legacy) - group them by extracted project name
    if flat_files:
        flat_file_projects = {}
        for file_path in flat_files:
            project_name = extract_project_name_from_filename(file_path.name)
            if project_name not in flat_file_projects:
                flat_file_projects[project_name] = []
            flat_file_projects[project_name].append(file_path)
        
        # Add flat file projects to manifest
        for project_name, project_files in sorted(flat_file_projects.items()):
            project_models = []
            
            for file_path in sorted(project_files):
                metadata = extract_metadata_from_filename(file_path.name)
                file_stat = file_path.stat()
                
                project_models.append({
                    'filename': file_path.name,
                    'relative_path': f"{project_name}/{file_path.name}",
                    'hub': metadata['hub'],
                    'model': metadata['model_name'],
                    'timestamp': metadata['date'],
                    'filesize': file_stat.st_size,
                    'last_modified': file_stat.st_mtime
                })
                total_files += 1
            
            manifest_projects.append({
                'project_folder': project_name,
                'project_name': project_name,
                'total_models': len(project_models),
                'models': project_models
            })
    
    # Create hierarchical manifest structure
    import datetime
    manifest = {
        'version': '2.0',
        'generated_at': datetime.datetime.now().isoformat(),
        'total_projects': len(manifest_projects),
        'total_files': total_files,
        'projects': manifest_projects
    }
    
    # Write manifest file
    manifest_path = destination_dir / 'manifest.json'
    try:
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        print_substep(f"✓ Hierarchical manifest created with {len(manifest_projects)} project(s) and {total_files} file(s)", 1)
        print_substep(f"✓ Manifest saved to: {manifest_path}", 1)
        return total_files
    except Exception as e:
        print_substep(f"✗ Error writing manifest: {e}", 1)
        return 0


def score_all_files(destination_dir):
    """
    Score all sexyDuck files in the destination directory (recursively).
    
    Args:
        destination_dir: Directory containing the project folders and sexyDuck files
        
    Returns:
        tuple: (files_scored, files_failed)
    """
    print_substep("Scoring all sexyDuck files (recursively)...", 0)
    
    # Find all .sexyDuck files recursively
    sexy_duck_files = []
    
    # Find files in project folders
    for item in destination_dir.iterdir():
        if item.is_dir() and item.name != '.git':  # Skip .git and other system folders
            for file_path in item.glob("*.sexyDuck"):
                if file_path.is_file():
                    sexy_duck_files.append(file_path)
        elif item.is_file() and item.suffix == '.sexyDuck':
            # Flat files (legacy)
            sexy_duck_files.append(item)
    
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
    print_step(1, 8, "Initialize Paths and Directories")
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
    print_step(2, 8, "Scan for revit_slave_* Folders")
    
    # Find all revit_slave folders and sort by timestamp (oldest first)
    def extract_timestamp(folder_path):
        """Extract timestamp from folder name like 'revit_slave_20251008_122051'"""
        try:
            # Remove 'revit_slave_' prefix and split by underscore
            timestamp_part = folder_path.name.replace('revit_slave_', '')
            # Format: YYYYMMDD_HHMMSS
            return timestamp_part
        except:
            return folder_path.name  # Fallback to folder name if parsing fails
    
    revit_slave_folders = sorted([
        d for d in data_received_dir.iterdir() 
        if d.is_dir() and d.name.startswith("revit_slave_")
    ], key=extract_timestamp)  # Sort chronologically (oldest first)
    
    # Process folders in chronological order so newer data can override older data
    # This ensures the final version in docs/asset/data/ is the most recent
    
    if not revit_slave_folders:
        print_substep("✗ No revit_slave_* folders found in _data_received", 0)
        print_substep("✓ Will still regenerate manifest file with existing data", 1)
        # Continue to manifest generation even with no new files
    
    if revit_slave_folders:
        print_substep(f"✓ Found {len(revit_slave_folders)} folder(s) to process:", 0)
        for i, folder in enumerate(revit_slave_folders, 1):
            print_substep(f"Folder {i}: {folder.name}", 1)
        
        # STEP 3: Process each folder
        print_step(3, 8, "Process Each Folder (Hybrid: Project Folders + Flat Files)")
        total_files_processed = 0
        total_files_skipped = 0
        
        for i, folder in enumerate(revit_slave_folders, 1):
            files_processed, files_skipped = process_revit_slave_folder(
                folder, destination_dir, i, len(revit_slave_folders)
            )
            total_files_processed += files_processed
            total_files_skipped += files_skipped
    else:
        # No new folders to process, but we'll still regenerate manifest
        print_step(3, 8, "No New Folders to Process")
        total_files_processed = 0
        total_files_skipped = 0
    
    # STEP 4: Generate initial manifest file
    print_step(4, 8, "Generate Initial Hierarchical Manifest File for Website")
    manifest_file_count = generate_manifest(destination_dir)
    
    # STEP 5: Score all files
    print_step(5, 8, "Calculate Health Scores for All Models")
    files_scored, files_score_failed = score_all_files(destination_dir)
    
    # STEP 6: Regenerate manifest after scoring
    print_step(6, 8, "Regenerate Hierarchical Manifest with Updated Scores")
    manifest_file_count_updated = generate_manifest(destination_dir)
    
    # STEP 7: Delete processed folders (if any)
    print_step(7, 8, "Clean Up - Delete Processed Folders")
    folders_deleted = 0
    folders_failed = 0
    
    if revit_slave_folders:
        for i, folder in enumerate(revit_slave_folders, 1):
            print_substep(f"Deleting folder {i}/{len(revit_slave_folders)}: {folder.name}", 0)
            try:
                shutil.rmtree(folder)
                print_substep(f"✓ Successfully deleted: {folder.name}", 1)
                folders_deleted += 1
            except Exception as e:
                print_substep(f"✗ Error deleting folder: {e}", 1)
                folders_failed += 1
    else:
        print_substep("No folders to delete", 0)
    
    # STEP 8: Final Summary
    print_step(8, 8, "Final Summary")
    print_substep(f"Folders found: {len(revit_slave_folders)}", 0)
    print_substep(f"Files copied successfully: {total_files_processed}", 0)
    print_substep(f"Files skipped (invalid): {total_files_skipped}", 0)
    print_substep(f"Initial manifest file entries: {manifest_file_count}", 0)
    print_substep(f"Files scored successfully: {files_scored}", 0)
    print_substep(f"Updated manifest file entries: {manifest_file_count_updated}", 0)
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

