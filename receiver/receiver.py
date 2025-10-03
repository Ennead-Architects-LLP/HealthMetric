#!/usr/bin/env python3
"""
HealthMetric Data Receiver
Processes incoming data and saves it to the _storage folder
"""

import json
import os
import sys
import time
import base64
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

try:
    import requests
    from github import Github, Auth
except ImportError:
    print("Required packages not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "PyGithub"])
    import requests
    from github import Github, Auth


class HealthMetricReceiver:
    """Handles receiving and processing data from GitHub repository"""
    
    def __init__(self, token: Optional[str] = None, repo_name: str = "ennead-architects-llp/HealthMetric"):
        """
        Initialize the receiver
        
        Args:
            token: GitHub personal access token (defaults to GITHUB_TOKEN env var)
            repo_name: Repository name in format 'owner/repo'
        """
        self.token = token or os.getenv('GITHUB_TOKEN')
        if not self.token:
            raise ValueError("GitHub token is required. Set GITHUB_TOKEN environment variable or pass token parameter.")
        
        self.repo_name = repo_name
        self.github = Github(auth=Auth.Token(self.token))
        self.repo = self.github.get_repo(self.repo_name)
        
        # Setup logging
        self.setup_logging()
        
        self.logger.info(f"✅ Connected to repository: {self.repo_name}")
    
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('receiver.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger('HealthMetricReceiver')
    
    def get_storage_contents(self) -> List[Dict[str, Any]]:
        """
        Get all contents from the _storage folder
        
        Returns:
            List of file information dictionaries
        """
        try:
            # Check if _storage directory exists, create if not
            try:
                storage_contents = self.repo.get_contents("_storage")
            except Exception as e:
                if "404" in str(e) or "Not Found" in str(e):
                    self.logger.info("_storage directory not found, creating...")
                    # Create _storage directory with a .gitkeep file
                    try:
                        self.repo.create_file(
                            path="_storage/.gitkeep",
                            message="Create _storage directory",
                            content="# HealthMetric Storage Directory\n# This directory stores processed data files\n"
                        )
                        self.logger.info("✅ Created _storage directory")
                        return []  # Return empty list since directory was just created
                    except Exception as create_error:
                        self.logger.error(f"Error creating _storage directory: {str(create_error)}")
                        return []
                else:
                    raise e
            
            files = []
            
            for content in storage_contents:
                if content.type == "file" and not content.name.startswith('.'):
                    files.append({
                        'name': content.name,
                        'path': content.path,
                        'size': content.size,
                        'sha': content.sha,
                        'download_url': content.download_url,
                        'last_modified': content.last_modified
                    })
            
            self.logger.info(f"Found {len(files)} files in _storage")
            return files
            
        except Exception as e:
            self.logger.error(f"Error getting storage contents: {str(e)}")
            return []
    
    def download_file(self, file_info: Dict[str, Any]) -> Optional[bytes]:
        """
        Download a file from the repository
        
        Args:
            file_info: File information dictionary
            
        Returns:
            File content as bytes or None if failed
        """
        try:
            response = requests.get(file_info['download_url'])
            response.raise_for_status()
            
            self.logger.info(f"Downloaded file: {file_info['name']} ({len(response.content)} bytes)")
            return response.content
            
        except Exception as e:
            self.logger.error(f"Error downloading file {file_info['name']}: {str(e)}")
            return None
    
    def process_batch_payload(self, content: bytes, filename: str) -> Dict[str, Any]:
        """
        Process batch payload and extract individual files to organized folders
        
        Args:
            content: File content as bytes
            filename: Name of the batch file
            
        Returns:
            Processed batch data dictionary
        """
        try:
            # Decode content
            if isinstance(content, bytes):
                content_str = content.decode('utf-8')
            else:
                content_str = content
            
            # Parse JSON
            batch_data = json.loads(content_str)
            
            # Check if this is a batch payload
            if 'batch_metadata' not in batch_data or 'files' not in batch_data:
                # Regular JSON file, process normally
                return self.process_json_data(content, filename)
            
            batch_metadata = batch_data['batch_metadata']
            files_data = batch_data['files']
            
            # Create folder name from batch filename (remove .json extension)
            batch_folder_name = Path(filename).stem
            batch_folder = Path("_storage") / batch_folder_name
            
            self.logger.info(f"Processing batch payload: {batch_metadata.get('total_files', 0)} files")
            self.logger.info(f"Extracting to folder: {batch_folder}")
            
            # Extract and save individual files to the batch folder
            extracted_files = []
            for file_name, file_info in files_data.items():
                try:
                    # Decode file content
                    file_content = base64.b64decode(file_info['content'])
                    
                    # Prefer relative_path from payload to reconstruct folders
                    relative_path = file_info.get('relative_path', file_name)

                    # Save individual file to batch folder preserving structure
                    success = self.save_individual_file(
                        file_content, 
                        relative_path, 
                        file_info.get('content_type', 'application/octet-stream'),
                        batch_folder
                    )
                    
                    if success:
                        extracted_files.append({
                            'filename': relative_path,
                            'size': file_info.get('size', len(file_content)),
                            'extension': file_info.get('extension', ''),
                            'content_type': file_info.get('content_type', 'application/octet-stream'),
                            'status': 'success',
                            'saved_to': str(batch_folder / relative_path)
                        })
                    else:
                        extracted_files.append({
                            'filename': relative_path,
                            'size': file_info.get('size', len(file_content)),
                            'extension': file_info.get('extension', ''),
                            'status': 'failed'
                        })
                        
                except Exception as e:
                    self.logger.error(f"Error extracting file {file_name}: {str(e)}")
                    extracted_files.append({
                        'filename': file_name,
                        'status': 'failed',
                        'error': str(e)
                    })
            
            # Create batch processing summary
            processed_batch = {
                'batch_metadata': batch_metadata,
                'extraction_folder': str(batch_folder),
                'extraction_results': {
                    'total_files': len(files_data),
                    'successful_extractions': len([f for f in extracted_files if f['status'] == 'success']),
                    'failed_extractions': len([f for f in extracted_files if f['status'] == 'failed']),
                    'extracted_files': extracted_files
                },
                'metadata': {
                    'original_batch_file': filename,
                    'processed_at': datetime.now().isoformat(),
                    'processor': 'HealthMetricReceiver',
                    'version': '1.0.0',
                    'processing_type': 'batch_extraction_to_folders'
                }
            }
            
            # Save processing summary to the batch folder
            summary_file = batch_folder / "processing_summary.json"
            try:
                with open(summary_file, 'w', encoding='utf-8') as f:
                    json.dump(processed_batch, f, indent=2, ensure_ascii=False)
                self.logger.info(f"Saved processing summary: {summary_file}")
            except Exception as e:
                self.logger.error(f"Error saving processing summary: {str(e)}")
            
            successful_count = len([f for f in extracted_files if f['status'] == 'success'])
            self.logger.info(f"Batch processing complete: {successful_count}/{len(files_data)} files extracted to {batch_folder}")
            
            return processed_batch
            
        except Exception as e:
            self.logger.error(f"Error processing batch payload {filename}: {str(e)}")
            return {
                'error': f"Batch processing error: {str(e)}",
                'metadata': {
                    'filename': filename,
                    'processed_at': datetime.now().isoformat(),
                    'processor': 'HealthMetricReceiver',
                    'version': '1.0.0'
                }
            }
    
    def save_individual_file(self, content: bytes, filename: str, content_type: str, batch_folder: Path) -> bool:
        """
        Save an individual file to the batch folder in its original format
        
        Args:
            content: File content as bytes
            filename: Original filename
            content_type: MIME content type
            batch_folder: Target folder for this batch
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Ensure batch folder exists
            batch_folder.mkdir(parents=True, exist_ok=True)
            
            # Use original relative path (may include subfolders)
            output_path = batch_folder / filename

            # Ensure nested directories exist for relative paths
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write file content in original format
            with open(output_path, 'wb') as f:
                f.write(content)
            
            self.logger.info(f"Saved file: {filename} to {batch_folder} ({len(content)} bytes)")
            return True
            
        except Exception as e:
            self.logger.error(f"Error saving file {filename}: {str(e)}")
            return False
    
    def _create_safe_filename(self, filename: str) -> str:
        """Create a safe filename with timestamp to avoid conflicts"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = Path(filename).stem
        extension = Path(filename).suffix
        
        # Add timestamp to avoid conflicts
        safe_filename = f"{base_name}_{timestamp}{extension}"
        
        return safe_filename
    
    def process_json_data(self, content: bytes, filename: str) -> Dict[str, Any]:
        """
        Process JSON data and add metadata
        
        Args:
            content: File content as bytes
            filename: Name of the file
            
        Returns:
            Processed data dictionary
        """
        try:
            # Decode content
            if isinstance(content, bytes):
                content_str = content.decode('utf-8')
            else:
                content_str = content
            
            # Parse JSON
            data = json.loads(content_str)
            
            # Add processing metadata
            processed_data = {
                'original_data': data,
                'metadata': {
                    'filename': filename,
                    'processed_at': datetime.now().isoformat(),
                    'processor': 'HealthMetricReceiver',
                    'version': '1.0.0'
                }
            }
            
            self.logger.info(f"Processed JSON data from {filename}")
            return processed_data
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in {filename}: {str(e)}")
            return {
                'error': f"Invalid JSON: {str(e)}",
                'metadata': {
                    'filename': filename,
                    'processed_at': datetime.now().isoformat(),
                    'processor': 'HealthMetricReceiver',
                    'version': '1.0.0'
                }
            }
        except Exception as e:
            self.logger.error(f"Error processing {filename}: {str(e)}")
            return {
                'error': f"Processing error: {str(e)}",
                'metadata': {
                    'filename': filename,
                    'processed_at': datetime.now().isoformat(),
                    'processor': 'HealthMetricReceiver',
                    'version': '1.0.0'
                }
            }
    
    def save_processed_data(self, processed_data: Dict[str, Any], filename: str) -> bool:
        """
        Save processed data to local storage
        
        Args:
            processed_data: Processed data dictionary
            filename: Original filename
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Create processed filename
            base_name = Path(filename).stem
            processed_filename = f"{base_name}_processed_{int(time.time())}.json"
            
            # Ensure _storage directory exists locally
            storage_dir = Path("_storage")
            storage_dir.mkdir(exist_ok=True)
            
            # Save to local storage
            output_path = storage_dir / processed_filename
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(processed_data, f, indent=2, ensure_ascii=False)
            
            self.logger.info(f"Saved processed data to: {output_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error saving processed data: {str(e)}")
            return False
    
    def process_all_files(self) -> Dict[str, Any]:
        """
        Process all files in the _storage folder
        
        Returns:
            Summary of processing results
        """
        self.logger.info("Starting to process all files in _storage")
        
        files = self.get_storage_contents()
        results = {
            'processed_files': [],
            'failed_files': [],
            'total_files': len(files),
            'processed_at': datetime.now().isoformat()
        }
        
        for file_info in files:
            filename = file_info['name']
            
            # Skip trigger files
            if filename.startswith('.'):
                continue
            
            self.logger.info(f"Processing file: {filename}")
            
            # Download file
            content = self.download_file(file_info)
            if content is None:
                results['failed_files'].append({
                    'filename': filename,
                    'error': 'Failed to download'
                })
                continue
            
            # Process data
            if filename.endswith('.json'):
                # Try batch processing first, fallback to regular JSON processing
                processed_data = self.process_batch_payload(content, filename)
            else:
                # For non-JSON files, create a simple wrapper
                processed_data = {
                    'original_data': base64.b64encode(content).decode('utf-8'),
                    'metadata': {
                        'filename': filename,
                        'processed_at': datetime.now().isoformat(),
                        'processor': 'HealthMetricReceiver',
                        'version': '1.0.0',
                        'file_type': 'binary'
                    }
                }
            
            # Save processed data
            if self.save_processed_data(processed_data, filename):
                results['processed_files'].append({
                    'filename': filename,
                    'processed_filename': f"{Path(filename).stem}_processed_{int(time.time())}.json",
                    'size': len(content),
                    'status': 'success'
                })
            else:
                results['failed_files'].append({
                    'filename': filename,
                    'error': 'Failed to save processed data'
                })
        
        self.logger.info(f"Processing complete. Processed: {len(results['processed_files'])}, Failed: {len(results['failed_files'])}")
        return results
    
    def cleanup_trigger_files(self):
        """Remove trigger files after processing"""
        try:
            # Check if _storage directory exists first
            try:
                storage_contents = self.repo.get_contents("_storage")
            except Exception as e:
                if "404" in str(e) or "Not Found" in str(e):
                    self.logger.info("_storage directory not found, nothing to cleanup")
                    return
                else:
                    raise e
            
            for content in storage_contents:
                if content.name.startswith('.') and content.name in ['.trigger', '.gitkeep']:
                    continue
                
                if content.name.startswith('.'):
                    self.repo.delete_file(
                        path=content.path,
                        message="Cleanup trigger file",
                        sha=content.sha
                    )
                    self.logger.info(f"Cleaned up trigger file: {content.name}")
                    
        except Exception as e:
            self.logger.error(f"Error cleaning up trigger files: {str(e)}")
    
    def run(self):
        """Main processing loop"""
        try:
            self.logger.info("HealthMetric Receiver starting...")
            
            # Process all files
            results = self.process_all_files()
            
            # Save processing summary
            summary_filename = f"processing_summary_{int(time.time())}.json"
            summary_path = Path("_storage") / summary_filename
            
            # Ensure _storage directory exists locally
            summary_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(summary_path, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            
            self.logger.info(f"Processing summary saved to: {summary_path}")
            
            # Cleanup trigger files
            self.cleanup_trigger_files()
            
            self.logger.info("HealthMetric Receiver completed successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Error in main processing loop: {str(e)}")
            return False


def main():
    """Main function for command-line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description="HealthMetric Data Receiver")
    parser.add_argument("--token", help="GitHub token")
    parser.add_argument("--repo", default="ennead-architects-llp/HealthMetric", help="Repository name")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        receiver = HealthMetricReceiver(token=args.token, repo_name=args.repo)
        success = receiver.run()
        
        if success:
            print("✅ Data processing completed successfully!")
            return 0
        else:
            print("❌ Data processing failed")
            return 1
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
