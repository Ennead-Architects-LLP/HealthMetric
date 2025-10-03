#!/usr/bin/env python3
"""
GitHub Token Validation Script
Tests if your GitHub token is working correctly
"""

import os
import sys

def test_token():
    """Test GitHub token setup"""
    print("🔐 GitHub Token Validation")
    print("=" * 40)
    
    # Check if token is set
    token = os.getenv('GITHUB_TOKEN')
    if not token:
        print("❌ GITHUB_TOKEN environment variable is not set")
        print("\n💡 To set it:")
        print("   Windows: set GITHUB_TOKEN=your_token_here")
        print("   Linux/Mac: export GITHUB_TOKEN=your_token_here")
        return False
    
    print(f"✅ Token found: {token[:10]}...{token[-4:]}")
    
    # Test token format
    if not token.startswith('ghp_'):
        print("⚠️  Warning: Token doesn't start with 'ghp_' - might not be a classic token")
    
    # Test GitHub API connection
    try:
        import requests
        
        headers = {'Authorization': f'token {token}'}
        response = requests.get('https://api.github.com/user', headers=headers)
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Token is valid!")
            print(f"   Authenticated as: {user_data.get('login', 'Unknown')}")
            print(f"   Name: {user_data.get('name', 'Not set')}")
            print(f"   Email: {user_data.get('email', 'Not set')}")
            
            # Test repository access
            repo_response = requests.get(
                'https://api.github.com/repos/ennead-architects-llp/HealthMetric',
                headers=headers
            )
            
            if repo_response.status_code == 200:
                repo_data = repo_response.json()
                print(f"✅ Repository access confirmed!")
                print(f"   Repository: {repo_data.get('full_name')}")
                print(f"   Private: {repo_data.get('private')}")
                
                # Check if user has push access
                if 'push' in repo_data.get('permissions', {}):
                    print(f"✅ Push permissions: {repo_data['permissions']['push']}")
                else:
                    print("⚠️  Push permissions: Not available")
                
            elif repo_response.status_code == 404:
                print("❌ Repository not found or no access")
                print("   Check if you have access to 'ennead-architects-llp/HealthMetric'")
            else:
                print(f"⚠️  Repository access issue: {repo_response.status_code}")
                
            return True
            
        elif response.status_code == 401:
            print("❌ Token is invalid or expired")
            print("   Please generate a new token")
            return False
        else:
            print(f"❌ API error: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except ImportError:
        print("❌ 'requests' library not installed")
        print("   Run: pip install requests")
        return False
    except Exception as e:
        print(f"❌ Error testing token: {str(e)}")
        return False

def test_revit_folder():
    """Test RevitSlaveData folder access"""
    print("\n📁 RevitSlaveData Folder Test")
    print("=" * 40)
    
    default_path = r"C:\Users\USERNAME\Documents\EnneadTab Ecosystem\Dump\RevitSlaveData"
    
    if os.path.exists(default_path):
        print(f"✅ RevitSlaveData folder found: {default_path}")
        
        # Count files
        try:
            files = [f for f in os.listdir(default_path) if os.path.isfile(os.path.join(default_path, f))]
            print(f"   Files found: {len(files)}")
            
            if files:
                print("   Sample files:")
                for file in files[:5]:  # Show first 5 files
                    file_path = os.path.join(default_path, file)
                    size = os.path.getsize(file_path)
                    print(f"     - {file} ({size} bytes)")
                if len(files) > 5:
                    print(f"     ... and {len(files) - 5} more files")
            else:
                print("   ⚠️  No files found in folder")
                
        except Exception as e:
            print(f"   ❌ Error reading folder: {str(e)}")
    else:
        print(f"❌ RevitSlaveData folder not found: {default_path}")
        print("   Please check the path or create the folder")
        print("   You can also use --source-folder parameter to specify a different path")

def main():
    """Main test function"""
    print("🧪 HealthMetric Token & Setup Test")
    print("=" * 50)
    
    # Test token
    token_ok = test_token()
    
    # Test folder
    test_revit_folder()
    
    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    print(f"   GitHub Token: {'✅ PASS' if token_ok else '❌ FAIL'}")
    
    if token_ok:
        print("\n🎉 Your setup looks good!")
        print("   You can now run: python sender\\sender.py --revit-slave")
    else:
        print("\n⚠️  Please fix the issues above before proceeding")
        print("   Check GITHUB_TOKEN_SETUP.md for detailed instructions")

if __name__ == "__main__":
    main()
