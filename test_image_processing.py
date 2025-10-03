#!/usr/bin/env python3
"""
Test image processing in the receiver
"""

import sys
import json
import base64
from pathlib import Path

# Add receiver to path
sys.path.append('receiver')

def test_image_processing():
    """Test image processing with local batch data"""
    print("🖼️ Testing Image Processing")
    print("=" * 50)
    
    # Import receiver components
    import importlib.util
    spec = importlib.util.spec_from_file_location("receiver", "receiver/receiver.py")
    receiver_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(receiver_module)
    
    # Create a test receiver instance
    receiver = receiver_module.HealthMetricReceiver.__new__(receiver_module.HealthMetricReceiver)
    receiver.logger = __import__('logging').getLogger('test')
    
    # Test with the local image batch
    batch_file = "_storage/local_image_test.json"
    
    if not Path(batch_file).exists():
        print(f"❌ Batch file not found: {batch_file}")
        return
    
    print(f"📁 Processing batch file: {batch_file}")
    
    with open(batch_file, 'rb') as f:
        content = f.read()
    
    print("🔄 Processing batch payload...")
    result = receiver.process_batch_payload(content, 'local_image_test.json')
    
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
            
            # Check if it's an image file
            if file_info['filename'].lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                file_path = Path(file_info['saved_to'])
                if file_path.exists():
                    size = file_path.stat().st_size
                    print(f"     Image size: {size} bytes")
                    print(f"     ✅ Image file successfully extracted!")
                else:
                    print(f"     ❌ Image file not found at expected location")
        else:
            print(f"     Error: {file_info.get('error', 'Unknown')}")
    
    print()
    
    # Check if folder was created and verify images
    if Path(extraction_folder).exists():
        print(f"✅ Extraction folder created: {extraction_folder}")
        files_in_folder = list(Path(extraction_folder).iterdir())
        print(f"📁 Files in folder: {len(files_in_folder)}")
        for file_path in files_in_folder:
            if file_path.suffix.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.bmp']:
                print(f"  🖼️ {file_path.name} (IMAGE - {file_path.stat().st_size} bytes)")
            else:
                print(f"  📄 {file_path.name}")
    else:
        print(f"❌ Extraction folder not found: {extraction_folder}")

if __name__ == "__main__":
    test_image_processing()
