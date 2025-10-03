#!/usr/bin/env python3
"""
Test script for the receiver functionality
"""

import sys
import json
from pathlib import Path

# Add receiver to path
sys.path.append('receiver')

def test_receiver():
    """Test the receiver with existing batch data"""
    print("🧪 Testing HealthMetric Receiver")
    print("=" * 50)
    
    # Import receiver components
    import importlib.util
    spec = importlib.util.spec_from_file_location("receiver", "receiver/receiver.py")
    receiver_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(receiver_module)
    
    # Create a test receiver instance (without GitHub token)
    receiver = receiver_module.HealthMetricReceiver.__new__(receiver_module.HealthMetricReceiver)
    receiver.logger = __import__('logging').getLogger('test')
    
    # Test processing the existing batch
    batch_file = "_storage/revit_slave_20251002_212526.json"
    
    if not Path(batch_file).exists():
        print(f"❌ Batch file not found: {batch_file}")
        return
    
    print(f"📁 Processing batch file: {batch_file}")
    
    with open(batch_file, 'rb') as f:
        content = f.read()
    
    print("🔄 Processing batch payload...")
    result = receiver.process_batch_payload(content, 'revit_slave_20251002_212526.json')
    
    if 'error' in result:
        print(f"❌ Error: {result['error']}")
        return
    
    print("✅ Processing completed!")
    print()
    
    # Show results
    extraction_folder = result.get('extraction_folder', 'Not specified')
    extraction_results = result['extraction_results']
    
    print("📊 Extraction Results:")
    print(f"  Folder: {extraction_folder}")
    print(f"  Total files: {extraction_results['total_files']}")
    print(f"  Successful: {extraction_results['successful_extractions']}")
    print(f"  Failed: {extraction_results['failed_extractions']}")
    print()
    
    print("📁 Extracted Files:")
    for file_info in extraction_results['extracted_files']:
        status = "✅" if file_info['status'] == 'success' else "❌"
        print(f"  {status} {file_info['filename']}")
        if file_info['status'] == 'success':
            print(f"     Saved to: {file_info['saved_to']}")
        else:
            print(f"     Error: {file_info.get('error', 'Unknown')}")
    
    print()
    
    # Check if folder was created
    if Path(extraction_folder).exists():
        print(f"✅ Extraction folder created: {extraction_folder}")
        files_in_folder = list(Path(extraction_folder).iterdir())
        print(f"📁 Files in folder: {len(files_in_folder)}")
        for file_path in files_in_folder:
            print(f"  - {file_path.name}")
    else:
        print(f"❌ Extraction folder not found: {extraction_folder}")

if __name__ == "__main__":
    test_receiver()
