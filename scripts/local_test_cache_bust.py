#!/usr/bin/env python3
"""
🧪 LOCAL TESTING ONLY - Manual Cache Busting Script
====================================================

⚠️  WARNING: This script is for LOCAL TESTING purposes only!

For production, the automated GitHub Actions workflow handles cache busting:
    .github/workflows/cache_bust_daily.yml (runs at 2 AM UTC daily)

This script is useful for:
    - Local development and testing
    - Manual cache refresh during development
    - Testing cache busting logic before deployment
    
DO NOT use this in production workflows!

Usage:
    python scripts/local_test_cache_bust.py
    OR
    scripts\local_test_cache_bust.bat (Windows)
"""

import os
import re
import datetime
from pathlib import Path

def update_version_numbers():
    """Update version numbers in all HTML, CSS, and JS files"""
    
    # Get current timestamp for version
    now = datetime.datetime.now()
    version = f"{now.strftime('%Y%m%d')}_{now.strftime('%H%M%S')}"
    
    print(f"🔄 Starting cache bust process...")
    print(f"📅 Version: {version}")
    
    # Define the docs directory
    docs_dir = Path("docs")
    
    # Files to update
    files_to_update = [
        "dashboard.html",
        "index.html"
    ]
    
    # Directories to search for CSS/JS files
    search_dirs = [
        "styles",
        "js"
    ]
    
    updated_files = []
    
    # Update HTML files
    print("📄 Updating HTML files...")
    for filename in files_to_update:
        filepath = docs_dir / filename
        if filepath.exists():
            updated = update_file_versions(filepath, version)
            if updated:
                updated_files.append(str(filepath))
                print(f"  ✅ Updated: {filename}")
            else:
                print(f"  ℹ️  No changes needed: {filename}")
    
    # Update CSS and JS files
    for search_dir in search_dirs:
        search_path = docs_dir / search_dir
        if search_path.exists():
            print(f"🔍 Searching in {search_dir}/...")
            for file_path in search_path.rglob("*"):
                if file_path.is_file() and file_path.suffix in ['.css', '.js']:
                    updated = update_file_versions(file_path, version)
                    if updated:
                        updated_files.append(str(file_path))
                        print(f"  ✅ Updated: {file_path.relative_to(docs_dir)}")
    
    print(f"\n🎉 Cache busting completed!")
    print(f"📊 Files updated: {len(updated_files)}")
    
    if updated_files:
        print("\n📝 Updated files:")
        for file in updated_files:
            print(f"  - {file}")
    
    return len(updated_files) > 0

def update_file_versions(filepath, version):
    """Update version numbers in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern to match version numbers like v=1.0, v=2.3, etc.
        version_pattern = r'v=(\d+\.\d+)'
        
        # Replace all version numbers with the new version
        new_content = re.sub(version_pattern, f'v={version}', content)
        
        # Only write if content changed
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        
        return False
        
    except Exception as e:
        print(f"  ❌ Error updating {filepath}: {e}")
        return False

def main():
    """Main function"""
    print("=" * 70)
    print("🧪 LOCAL TESTING ONLY - Manual Cache Busting Script")
    print("=" * 70)
    print("⚠️  WARNING: For local testing/development only!")
    print("    Production uses: .github/workflows/cache_bust_daily.yml")
    print("=" * 70)
    print()
    
    # Check if we're in the right directory
    if not Path("docs").exists():
        print("❌ Error: docs/ directory not found!")
        print("Please run this script from the project root directory.")
        return 1
    
    # Update version numbers
    has_changes = update_version_numbers()
    
    if has_changes:
        print("\n✅ Cache busting completed successfully!")
        print("🔄 All static assets will be reloaded by browsers")
        print("\n💡 Next steps:")
        print("  1. Commit the changes: git add . && git commit -m 'chore: cache bust'")
        print("  2. Push to repository: git push")
        print("  3. Browsers will automatically reload with new versions")
    else:
        print("\nℹ️  No changes needed - all files already up to date")
    
    return 0

if __name__ == "__main__":
    exit(main())
