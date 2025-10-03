#!/usr/bin/env python3
"""
Test script to examine batch data structure
"""

import json
import base64
from pathlib import Path

def test_batch_data():
    """Test the existing batch data structure"""
    batch_file = "_storage/revit_slave_20251002_212526.json"
    
    if not Path(batch_file).exists():
        print(f"❌ Batch file not found: {batch_file}")
        return
    
    print("🔍 Examining batch data structure...")
    print("=" * 50)
    
    with open(batch_file, 'r') as f:
        data = json.load(f)
    
    print("📊 Batch Metadata:")
    batch_meta = data['batch_metadata']
    print(f"  Total files: {batch_meta['total_files']}")
    print(f"  Source folder: {batch_meta['source_folder']}")
    print(f"  Timestamp: {batch_meta['timestamp']}")
    print()
    
    print("📁 Files to extract:")
    for filename, file_info in data['files'].items():
        size = file_info['size']
        ext = file_info['extension']
        content_type = file_info['content_type']
        
        print(f"  📄 {filename}")
        print(f"     Size: {size} bytes")
        print(f"     Extension: {ext}")
        print(f"     Content Type: {content_type}")
        
        # Decode and show preview
        try:
            content = base64.b64decode(file_info['content']).decode('utf-8')
            preview = content[:100].replace('\n', '\\n')
            print(f"     Preview: {preview}...")
        except Exception as e:
            print(f"     Preview: [Binary data - {e}]")
        
        print()
    
    print("✅ Batch data structure is valid!")
    print("Ready for receiver processing...")

if __name__ == "__main__":
    test_batch_data()
