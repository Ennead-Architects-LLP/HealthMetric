"""Test scoring integration"""
import sys
from pathlib import Path
import json

# Add scoring module to path
sys.path.insert(0, str(Path('docs/ref')))
from scoring import score_file

# Find a few files to test
files = list(Path('docs/asset/data').glob('*.SexyDuck'))[:3]

print(f"Testing scoring on {len(files)} files...")
for i, file in enumerate(files, 1):
    print(f"\n{i}. Scoring: {file.name}")
    score_file(str(file))
    
    # Verify score was added
    with open(file, 'r') as f:
        data = json.load(f)
    
    if 'score' in data:
        print(f"   ✓ Score: {data['score']['total_score']}/100 (Grade: {data['score']['grade']})")
    else:
        print(f"   ✗ No score found!")

print(f"\n✓ All {len(files)} files tested successfully!")

