#!/usr/bin/env python3
"""
HealthMetric Data Receiver
Processes incoming data and extracts it to the local _data_received folder
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
    
    # Removed legacy _storage listing; receiver works solely with _temp_storage → _data_received
    
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
            batch_folder = Path("_data_received") / batch_folder_name
            
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
                    # Normalize separators and sanitize path components
                    relative_path = relative_path.replace('\\', '/')
                    safe_parts = []
                    for part in Path(relative_path).parts:
                        if part in ('', '.', '..'):
                            continue
                        safe_parts.append(part)
                    relative_path = str(Path(*safe_parts))

                    # Save individual file to batch folder preserving structure
                    self.logger.info(f"Extracting file: name={file_name}, rel={relative_path}, size={len(file_content)} bytes")
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
            
            # Skip writing per-batch processing summary files
            
            successful_count = len([f for f in extracted_files if f['status'] == 'success'])
            # Ensure job folder is committed even if empty by adding a temporary .gitkeep
            try:
                if successful_count == 0:
                    keep_file = batch_folder / ".gitkeep"
                    keep_file.parent.mkdir(parents=True, exist_ok=True)
                    if not keep_file.exists():
                        keep_file.write_text("", encoding="utf-8")
                        self.logger.info(f"Wrote placeholder: {keep_file}")
            except Exception as keep_err:
                self.logger.error(f"Failed to write .gitkeep: {str(keep_err)}")

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
            storage_dir = Path("_storage_meta")
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
    
    def get_triggers(self) -> List[Dict[str, Any]]:
        """List trigger files from the repository (.github/triggers)"""
        try:
            trigger_dir = ".github/triggers"
            try:
                contents = self.repo.get_contents(trigger_dir)
            except Exception as e:
                if "404" in str(e) or "Not Found" in str(e):
                    self.logger.info(f"{trigger_dir} not found, nothing to process")
                    contents = []
                else:
                    raise

            triggers: List[Dict[str, Any]] = []
            for content in contents:
                if content.type == "file" and content.name.endswith('.json'):
                    triggers.append({
                        'name': content.name,
                        'path': content.path,
                        'sha': content.sha,
                        'download_url': content.download_url,
                        'last_modified': getattr(content, 'last_modified', None)
                    })

            # Fallback: also include any triggers present in local workspace checkout
            try:
                from pathlib import Path as _Path
                for p in _Path(trigger_dir).glob("*.json"):
                    # Avoid duplicates by name
                    if any(t['name'] == p.name for t in triggers):
                        continue
                    triggers.append({
                        'name': p.name,
                        'path': f"{trigger_dir}/{p.name}",
                        'sha': None,
                        'download_url': None,
                        'local_path': str(p),
                        'last_modified': None
                    })
            except Exception as _:
                pass

            return triggers
        except Exception as e:
            self.logger.error(f"Error listing triggers: {str(e)}")
            return []

    def _download_by_url(self, url: str) -> Optional[bytes]:
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.content
        except Exception as e:
            self.logger.error(f"Error downloading url {url}: {str(e)}")
            return None

    def _load_trigger_payload(self, trigger_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if trigger_info.get('download_url'):
            content = self._download_by_url(trigger_info['download_url'])
        else:
            try:
                lp = trigger_info.get('local_path') or trigger_info.get('path')
                with open(lp, 'rb') as f:
                    content = f.read()
            except Exception as e:
                self.logger.error(f"Error reading local trigger {trigger_info.get('name')}: {str(e)}")
                content = None
        if content is None:
            return None
        try:
            return json.loads(content.decode('utf-8'))
        except Exception as e:
            self.logger.error(f"Invalid trigger JSON {trigger_info['name']}: {str(e)}")
            return None

    def _download_repo_file(self, path: str) -> Optional[bytes]:
        try:
            file_obj = self.repo.get_contents(path)
            if hasattr(file_obj, 'download_url') and file_obj.download_url:
                return self._download_by_url(file_obj.download_url)
            # Fallback to decoded_content if available
            data = getattr(file_obj, 'decoded_content', None)
            if data is not None:
                return data
            return None
        except Exception as e:
            self.logger.error(f"Error fetching repo file {path}: {str(e)}")
            return None

    def _delete_repo_file(self, path: str, sha: str, message: str) -> bool:
        try:
            self.repo.delete_file(path=path, message=message, sha=sha)
            return True
        except Exception as e:
            self.logger.error(f"Error deleting {path}: {str(e)}")
            return False

    def _move_trigger_to_processed(self, trigger_info: Dict[str, Any], content_bytes: bytes) -> None:
        try:
            processed_dir = ".github/triggers_processed"
            # Ensure directory exists by creating a placeholder if needed (GitHub API creates parent dirs automatically on file create)
            processed_path = f"{processed_dir}/{trigger_info['name']}"
            self.repo.create_file(
                path=processed_path,
                message=f"Archive trigger {trigger_info['name']}",
                content=content_bytes.decode('utf-8')
            )
            # Delete original trigger
            self._delete_repo_file(path=trigger_info['path'], sha=trigger_info['sha'], message="Remove processed trigger")
        except Exception as e:
            self.logger.error(f"Error archiving trigger {trigger_info['name']}: {str(e)}")

    def _retain_temp_storage(self, days: int = 10) -> None:
        try:
            cutoff = datetime.utcnow().timestamp() - days * 86400
            try:
                contents = self.repo.get_contents("_temp_storage")
            except Exception as e:
                if "404" in str(e) or "Not Found" in str(e):
                    return
                raise
            for content in contents:
                try:
                    # Prefer last_modified header when available
                    last_mod = getattr(content, 'last_modified', None)
                    if last_mod:
                        try:
                            # last_modified is RFC 2822 via GitHub API headers; use repo file API timestamp as fallback
                            # If not parseable, skip retention based on this field.
                            ts = datetime.strptime(last_mod, "%a, %d %b %Y %H:%M:%S %Z").timestamp()
                        except Exception:
                            ts = None
                    else:
                        ts = None
                    if ts is None:
                        # Fallback: keep if unknown
                        continue
                    if ts < cutoff:
                        self._delete_repo_file(path=content.path, sha=content.sha, message="Retention: delete old temp package")
                except Exception as inner:
                    self.logger.error(f"Retention check failed for {getattr(content, 'path', '?')}: {str(inner)}")
        except Exception as e:
            self.logger.error(f"Error enforcing retention: {str(e)}")

    def process_triggers(self) -> Dict[str, Any]:
        """Process all triggers: unpack raw payloads into _data_received and clean up"""
        results = {
            'processed_jobs': [],
            'failed_jobs': [],
            'processed_at': datetime.now().isoformat()
        }

        triggers = self.get_triggers()
        self.logger.info(f"Discovered {len(triggers)} trigger(s) to process")
        for trig in triggers:
            self.logger.info(f"Processing trigger: {trig.get('name')} (path={trig.get('path')}, local={trig.get('local_path', '')})")
            trig_bytes = self._download_by_url(trig['download_url'])
            if trig_bytes is None:
                # Try local path fallback
                lp = trig.get('local_path') or trig.get('path')
                try:
                    with open(lp, 'rb') as f:
                        trig_bytes = f.read()
                except Exception:
                    results['failed_jobs'].append({'trigger': trig['name'], 'error': 'Failed to download trigger'})
                continue
            trig_payload = self._load_trigger_payload(trig)
            if trig_payload is None:
                results['failed_jobs'].append({'trigger': trig['name'], 'error': 'Invalid trigger payload'})
                continue

            job_name = trig_payload.get('job_name') or Path(trig['name']).stem
            raw_path = trig_payload.get('raw_path')
            if not raw_path:
                results['failed_jobs'].append({'trigger': trig['name'], 'error': 'Missing raw_path'})
                continue

            # Download raw payload from repo with small retry for eventual consistency
            raw_bytes = None
            for attempt in range(5):
                raw_bytes = self._download_repo_file(raw_path)
                if raw_bytes is not None:
                    break
                time.sleep(2)
            if raw_bytes is None:
                results['failed_jobs'].append({'trigger': trig['name'], 'error': f'Failed to download {raw_path} after retries'})
                continue

            # Process batch into _data_received/job_name
            processed = self.process_batch_payload(raw_bytes, f"{job_name}.json")
            self.logger.info(f"Wrote extraction for job {job_name} into _data_received/{job_name}")

            # Skip writing job summaries to _storage_meta

            # Optional deletion of raw package from repo (disabled by default to preserve temp storage)
            keep_temp = os.getenv('KEEP_TEMP_STORAGE', '1').lower() in ('1', 'true', 'yes')
            if not keep_temp:
                try:
                    raw_obj = self.repo.get_contents(raw_path)
                    self._delete_repo_file(path=raw_obj.path, sha=raw_obj.sha, message=f"Processed {job_name}: remove temp package")
                except Exception as e:
                    self.logger.error(f"Error deleting raw package {raw_path}: {str(e)}")
            else:
                self.logger.info(f"KEEP_TEMP_STORAGE enabled; retaining raw package {raw_path}")

            # Archive/delete trigger
            self._move_trigger_to_processed(trig, trig_bytes)

            results['processed_jobs'].append({'job_name': job_name, 'raw_path': raw_path})

        # Retention policy for _temp_storage disabled by default; guard by env var
        enforce_retention = os.getenv('ENFORCE_TEMP_RETENTION', '0').lower() in ('1', 'true', 'yes')
        if enforce_retention:
            self._retain_temp_storage(days=10)

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

            # Process triggers-driven pipeline
            results = self.process_triggers()

            # Skip writing run summary to disk
            self.logger.info("HealthMetric Receiver completed successfully")
            return True

        except Exception as e:
            self.logger.error(f"Error in main processing loop: {str(e)}")
            return False


def _run_local_mode() -> bool:
    """Process triggers and payloads locally without GitHub API.

    - Reads triggers from .github/triggers
    - Unpacks raw payloads from _temp_storage into _data_received/<job_name>/
    - Archives triggers to .github/triggers_processed
    """
    try:
        from pathlib import Path
        import json
        import shutil
        # Reuse local unpack helper
        try:
            from receiver.local_unpack import extract_job  # type: ignore
        except Exception:
            # Fallback: minimal inline extractor
            import base64

            def extract_job(json_path: Path, out_root: Path) -> Path:
                data = json.loads(json_path.read_text(encoding="utf-8"))
                job_dir = out_root / json_path.stem
                job_dir.mkdir(parents=True, exist_ok=True)
                files = data.get("files", {})
                for rel, info in files.items():
                    b64 = info.get("content")
                    if not b64:
                        continue
                    content = base64.b64decode(b64)
                    dest = job_dir / rel
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    dest.write_bytes(content)
                return job_dir

        trigger_dir = Path(".github/triggers")
        processed_dir = Path(".github/triggers_processed")
        processed_dir.mkdir(parents=True, exist_ok=True)
        out_root = Path("_data_received")
        out_root.mkdir(exist_ok=True)

        if not trigger_dir.exists():
            print("No local triggers found.")
            return True

        triggers = sorted(trigger_dir.glob("*.json"))
        if not triggers:
            print("No local triggers found.")
            return True

        for trig_path in triggers:
            try:
                payload = json.loads(trig_path.read_text(encoding="utf-8"))
                raw_path = payload.get("raw_path")
                job_name = payload.get("job_name") or trig_path.stem
                if not raw_path:
                    print(f"Skip {trig_path.name}: missing raw_path")
                    continue
                raw_json = Path(raw_path)
                if not raw_json.exists():
                    print(f"Skip {trig_path.name}: raw payload not found {raw_path}")
                    continue
                # Extract
                job_dir = extract_job(raw_json, out_root)
                # Archive trigger
                dest = processed_dir / trig_path.name
                shutil.move(str(trig_path), str(dest))
                print(f"Processed {job_name} -> {job_dir}")
            except Exception as inner:
                print(f"Error processing {trig_path.name}: {inner}")
        return True
    except Exception as e:
        print(f"Local mode failed: {e}")
        return False


def main():
    """Main function for command-line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description="HealthMetric Data Receiver")
    parser.add_argument("--token", help="GitHub token")
    parser.add_argument("--repo", default="ennead-architects-llp/HealthMetric", help="Repository name")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--local", action="store_true", help="Run in local mode without GitHub API")
    
    args = parser.parse_args()
    
    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Local mode: no GitHub required
    if args.local or not (args.token or os.getenv('GITHUB_TOKEN')):
        success = _run_local_mode()
        print("✅ Data processing completed successfully!" if success else "❌ Data processing failed")
        return 0 if success else 1
    
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
