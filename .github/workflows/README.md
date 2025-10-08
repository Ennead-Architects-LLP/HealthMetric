# GitHub Actions Workflows

## Merge Data Received Daily

**File:** `merge_data_daily.yml`

### Purpose
Automatically processes and merges data from `_data_received` folder daily at midnight UTC.

### What it does:
1. **Finds** all `revit_slave_*` folders in `_data_received`
2. **Validates** each `.sexyDuck` file as valid JSON
3. **Copies** valid files to `docs/asset/data/` (overwrites if exists)
4. **Deletes** processed `revit_slave_*` folders
5. **Commits** changes to the repository if any new files were added

### Schedule
- **Automatic:** Runs daily at 00:00 UTC (midnight)
- **Manual:** Can be triggered manually from GitHub Actions UI

### How to manually trigger:
1. Go to **Actions** tab in GitHub
2. Select **Merge Data Received Daily** workflow
3. Click **Run workflow** button
4. Confirm by clicking **Run workflow**

### Configuration
- **Commit Author:** github-actions[bot]
- **Commit Message Format:** `chore: automated data merge from _data_received [YYYY-MM-DD HH:MM:SS]`
- **Target Files:** Only files in `docs/asset/data/` are committed

### Requirements
- Python 3.11
- No external dependencies (uses standard library only)

### Permissions
Uses default `GITHUB_TOKEN` with permissions to:
- Read repository contents
- Write/push commits to the repository

### Script Location
The workflow executes: `.github/scripts/merge_data_received.py`

### Monitoring
Check the **Actions** tab to see:
- Run history
- Success/failure status
- Detailed logs with step-by-step processing
- Summary of files processed

### Troubleshooting

**Issue:** Workflow fails with "nothing to commit"
- **Solution:** This is normal if no new data was received

**Issue:** Permission denied errors
- **Solution:** Check repository settings > Actions > General > Workflow permissions
- Ensure "Read and write permissions" is enabled

**Issue:** Script errors
- **Solution:** Check the workflow logs for detailed error messages
- Test the script locally: `python .github/scripts/merge_data_received.py`

