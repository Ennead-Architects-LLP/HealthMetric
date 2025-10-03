#!/usr/bin/env python3
"""
Test script for the HealthMetric batch system
"""

import os
import sys
import json
from pathlib import Path

# Add sender and receiver to path
sys.path.append('sender')
sys.path.append('receiver')

def test_sender_batch_creation():
    """Test the sender's batch payload creation"""
    print("🧪 Testing sender batch payload creation...")
    
    try:
        from sender.sender import HealthMetricSender
        
        # Create sender instance (without token for testing)
        sender = HealthMetricSender.__new__(HealthMetricSender)
        
        # Test batch payload creation
        example_folder = Path("example_data")
        if example_folder.exists():
            payload = sender.create_batch_payload(str(example_folder))
            
            print(f"✅ Batch payload created successfully!")
            print(f"   - Total files: {payload['batch_metadata']['total_files']}")
            print(f"   - Files processed:")
            
            for file_info in payload['batch_metadata']['files']:
                print(f"     * {file_info['filename']} ({file_info['size']} bytes)")
            
            # Save payload for inspection
            with open("test_batch_payload.json", "w") as f:
                json.dump(payload, f, indent=2)
            
            print(f"✅ Test payload saved to: test_batch_payload.json")
            return True
        else:
            print(f"❌ Example data folder not found: {example_folder}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing sender: {str(e)}")
        return False

def test_receiver_batch_processing():
    """Test the receiver's batch processing"""
    print("\n🧪 Testing receiver batch processing...")
    
    try:
        from receiver.receiver import HealthMetricReceiver
        
        # Create receiver instance (without token for testing)
        receiver = HealthMetricReceiver.__new__(HealthMetricReceiver)
        
        # Load test payload
        test_payload_path = Path("test_batch_payload.json")
        if test_payload_path.exists():
            with open(test_payload_path, "r") as f:
                payload_data = json.load(f)
            
            # Convert to bytes for testing
            payload_bytes = json.dumps(payload_data).encode('utf-8')
            
            # Test batch processing
            result = receiver.process_batch_payload(payload_bytes, "test_batch.json")
            
            if 'extraction_results' in result:
                print(f"✅ Batch processing test successful!")
                print(f"   - Total files: {result['extraction_results']['total_files']}")
                print(f"   - Successful extractions: {result['extraction_results']['successful_extractions']}")
                print(f"   - Failed extractions: {result['extraction_results']['failed_extractions']}")
                
                # Save result for inspection
                with open("test_batch_result.json", "w") as f:
                    json.dump(result, f, indent=2)
                
                print(f"✅ Test result saved to: test_batch_result.json")
                return True
            else:
                print(f"❌ Batch processing failed: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Test payload not found: {test_payload_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing receiver: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 HealthMetric Batch System Test Suite")
    print("=" * 50)
    
    # Test sender
    sender_success = test_sender_batch_creation()
    
    # Test receiver
    receiver_success = test_receiver_batch_processing()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"   Sender: {'✅ PASS' if sender_success else '❌ FAIL'}")
    print(f"   Receiver: {'✅ PASS' if receiver_success else '❌ FAIL'}")
    
    if sender_success and receiver_success:
        print("\n🎉 All tests passed! The batch system is working correctly.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
