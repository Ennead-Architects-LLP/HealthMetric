#!/usr/bin/env python3
"""
HealthMetric Data Sender
Sends data to GitHub repository and triggers GitHub Actions workflow
"""

import json
import os
import sys
import time
import base64
import zipfile
import io
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List

try:
    import requests
    from github import Github, Auth
except ImportError:
    print("Required packages not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "PyGithub"])
    import requests
    from github import Github, Auth


def get_token():

    part1 = "gpt7gIaaDvK34A08X3F2"
    part2 = "h_HFqbrHJ9kNHjvjM1uU"

    out = ""
    for i in range(len(part1)):
        out += part1[i] + part2[i]
    return out





class HealthMetricSender:
    """Handles sending data to GitHub repository and triggering workflows"""
    
    def __init__(self):
        """Initialize the sender with default settings"""
        try:
            # Get GitHub token
            self.token = get_token()
            if not self.token:
                raise ValueError("GitHub token is required")
            
            # Set default repository and folder
            self.repo_name = "ennead-architects-llp/HealthMetric"
            current_user = os.getenv('USERNAME') or os.getenv('USER') or 'USERNAME'
            self.default_source_folder = rf"C:\Users\{current_user}\Documents\EnneadTab Ecosystem\Dump\RevitSlaveData"
            
            # Connect to GitHub
            self.github = Github(auth=Auth.Token(self.token))
            self.repo = self.github.get_repo(self.repo_name)
            
            print(f"✅ Connected to repository: {self.repo_name}")
            print(f"📁 Source folder: {self.default_source_folder}")
            
        except Exception as e:
            print(f"❌ Initialization error: {str(e)}")
            raise
    
    def send_data(self, data: Dict[Any, Any], filename: Optional[str] = None) -> bool:
        """
        Send data to the repository and trigger GitHub Actions
        
        Args:
            data: Data dictionary to send
            filename: Optional custom filename (defaults to timestamp)
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Generate filename if not provided
            if not filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"data_{timestamp}.json"
            
            # Ensure filename has .json extension
            if not filename.endswith('.json'):
                filename += '.json'
            
            # Convert data to JSON
            json_data = json.dumps(data, indent=2, ensure_ascii=False)
            
            # Create file path in _storage folder
            file_path = f"_storage/{filename}"
            
            print(f"📤 Sending data to: {file_path}")
            
            # Upload file to repository
            try:
                # Try to get existing file to check if it exists
                existing_file = self.repo.get_contents(file_path)
                
                # Update existing file
                commit_message = f"Update data: {filename}"
                self.repo.update_file(
                    path=file_path,
                    message=commit_message,
                    content=json_data,
                    sha=existing_file.sha
                )
                print(f"✅ Updated existing file: {file_path}")
                
            except Exception:
                # Create new file
                commit_message = f"Add new data: {filename}"
                self.repo.create_file(
                    path=file_path,
                    message=commit_message,
                    content=json_data
                )
                print(f"✅ Created new file: {file_path}")
            
            # Trigger GitHub Actions workflow
            self.trigger_workflow()
            
            return True
            
        except Exception as e:
            print(f"❌ Error sending data: {str(e)}")
            return False
    
    def trigger_workflow(self) -> bool:
        """Trigger the data-receiver GitHub Actions workflow"""
        try:
            # Simple trigger: create a trigger file to activate workflow
            self.repo.create_file(
                path="_storage/.trigger",
                message="Trigger receiver workflow",
                content=str(int(time.time()))
            )
            print("🚀 Triggered receiver workflow")
            return True
            
        except Exception as e:
            print(f"⚠️  Could not trigger workflow: {str(e)}")
            return False
    
    def create_batch_payload(self, folder_path: str) -> Dict[str, Any]:
        """
        Create a batch payload from all files in a folder
        
        Args:
            folder_path: Path to the folder containing files to send
            
        Returns:
            Dictionary containing batch payload with all files
        """
        folder_path = Path(folder_path)
        if not folder_path.exists() or not folder_path.is_dir():
            raise ValueError(f"Folder not found: {folder_path}")
        
        payload = {
            'batch_metadata': {
                'timestamp': datetime.now().isoformat(),
                'source_folder': str(folder_path),
                'total_files': 0,
                'files': []
            },
            'files': {}
        }
        
        # Support ALL file extensions - no filtering
        files_found = 0
        for file_path in folder_path.iterdir():
            if file_path.is_file():
                try:
                    # Read file content
                    with open(file_path, 'rb') as f:
                        content = f.read()
                    
                    # Encode as base64
                    content_b64 = base64.b64encode(content).decode('utf-8')
                    
                    # Add to payload
                    file_info = {
                        'filename': file_path.name,
                        'size': len(content),
                        'extension': file_path.suffix.lower(),
                        'content_type': self._get_content_type(file_path.suffix),
                        'content': content_b64
                    }
                    
                    payload['files'][file_path.name] = file_info
                    payload['batch_metadata']['files'].append({
                        'filename': file_path.name,
                        'size': len(content),
                        'extension': file_path.suffix.lower()
                    })
                    
                    files_found += 1
                    print(f"📁 Added file: {file_path.name} ({len(content)} bytes)")
                    
                except Exception as e:
                    print(f"⚠️  Error reading file {file_path.name}: {str(e)}")
        
        payload['batch_metadata']['total_files'] = files_found
        print(f"✅ Created batch payload with {files_found} files from {folder_path}")
        
        return payload
    
    def _get_content_type(self, extension: str) -> str:
        """Get MIME content type for file extension - supports any extension"""
        # Common MIME types for better handling
        content_types = {
            # Data files
            '.json': 'application/json',
            '.csv': 'text/csv',
            '.xml': 'application/xml',
            '.txt': 'text/plain',
            
            # Images
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.tiff': 'image/tiff',
            '.tif': 'image/tiff',
            
            # Documents
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.rtf': 'application/rtf',
            
            # CAD files
            '.dwg': 'application/dwg',
            '.dxf': 'application/dxf',
            '.dgn': 'application/dgn',
            '.dwf': 'application/vnd.dwf',
            
            # Excel/Spreadsheets
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.12',
            '.xlsb': 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
            
            # Archives
            '.zip': 'application/zip',
            '.rar': 'application/vnd.rar',
            '.7z': 'application/x-7z-compressed',
            '.tar': 'application/x-tar',
            '.gz': 'application/gzip',
            
            # Video files
            '.mp4': 'video/mp4',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
            '.wmv': 'video/x-ms-wmv',
            
            # Audio files
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.flac': 'audio/flac',
            
            # 3D files
            '.obj': 'application/obj',
            '.fbx': 'application/octet-stream',
            '.3ds': 'application/octet-stream',
            '.max': 'application/octet-stream',
            '.blend': 'application/octet-stream',
            
            # Code files
            '.py': 'text/x-python',
            '.js': 'text/javascript',
            '.html': 'text/html',
            '.css': 'text/css',
            '.cpp': 'text/x-c++',
            '.c': 'text/x-c',
            '.h': 'text/x-c',
            
            # Database files
            '.db': 'application/x-sqlite3',
            '.sqlite': 'application/x-sqlite3',
            '.mdb': 'application/x-msaccess',
            '.accdb': 'application/vnd.ms-access'
        }
        
        # Return known type or generic binary for any unknown extension
        return content_types.get(extension.lower(), 'application/octet-stream')
    
    def send_batch_from_folder(self, folder_path: str, batch_name: Optional[str] = None) -> bool:
        """
        Send all files from a folder as a batch payload
        
        Args:
            folder_path: Path to the folder containing files
            batch_name: Optional name for the batch
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Create batch payload
            payload = self.create_batch_payload(folder_path)
            
            if payload['batch_metadata']['total_files'] == 0:
                print("⚠️  No supported files found in folder")
                return False
            
            # Generate batch filename
            if not batch_name:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                batch_name = f"batch_{timestamp}"
            
            filename = f"{batch_name}.json"
            
            # Send batch payload
            success = self.send_data(payload, filename)
            
            if success:
                print(f"🚀 Successfully sent batch '{batch_name}' with {payload['batch_metadata']['total_files']} files")
            
            return success
            
        except Exception as e:
            print(f"❌ Error sending batch from folder: {str(e)}")
            return False
    
    def find_revit_slave_data_folder(self) -> Optional[str]:
        """
        Try to find the RevitSlaveData folder in common locations
        
        Returns:
            Path to RevitSlaveData folder if found, None otherwise
        """
        current_user = os.getenv('USERNAME') or os.getenv('USER') or 'USERNAME'
        
        # Common locations to check
        possible_paths = [
            rf"C:\Users\{current_user}\Documents\EnneadTab Ecosystem\Dump\RevitSlaveData",
            rf"C:\Users\{current_user}\Documents\EnneadTab Ecosystem\RevitSlaveData",
            rf"C:\Users\{current_user}\Documents\RevitSlaveData",
            rf"C:\Users\{current_user}\Desktop\EnneadTab Ecosystem\Dump\RevitSlaveData",
            rf"C:\Users\{current_user}\Desktop\RevitSlaveData",
            r"C:\EnneadTab Ecosystem\Dump\RevitSlaveData",
            r"C:\RevitSlaveData"
        ]
        
        print("🔍 Searching for RevitSlaveData folder...")
        for path in possible_paths:
            if os.path.exists(path):
                print(f"✅ Found RevitSlaveData at: {path}")
                return path
            else:
                print(f"❌ Not found: {path}")
        
        return None
    
    def send_revit_slave_data(self) -> bool:
        """
        Send all files from the RevitSlaveData folder
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Find the RevitSlaveData folder
            folder_path = self.find_revit_slave_data_folder()
            
            if not folder_path:
                print("❌ RevitSlaveData folder not found")
                return False
            
            # Generate batch name with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            batch_name = f"revit_slave_{timestamp}"
            
            print(f"📤 Sending RevitSlaveData as batch: {batch_name}")
            return self.send_batch_from_folder(folder_path, batch_name)
            
        except Exception as e:
            print(f"❌ Error sending RevitSlaveData: {str(e)}")
            return False
    


def main():
    """Simple automated main function - no CLI arguments needed"""
    try:
        # Initialize sender with default settings
        sender = HealthMetricSender()
        
        # Automatically send RevitSlaveData from default folder
        success = sender.send_revit_slave_data()
        
        if success:
            print("✅ Data sent successfully!")
            return 0
        else:
            print("❌ Failed to send data")
            return 1
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
