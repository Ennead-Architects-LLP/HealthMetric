# GitHub Actions Workflow Architecture

## Overview

The HealthMetric project uses two separate, coordinated workflows to automate data processing and website updates. This architecture prevents race conditions and ensures reliable automated updates.

## Workflows

### 1. Data Merge and Scoring Workflow
**File**: `merge_data_daily.yml`  
**Schedule**: Midnight UTC (00:00 UTC) daily  
**Purpose**: Process new model data and calculate health scores

#### What It Does:
- Processes new `.sexyDuck` files from `_data_received/` directory
- Calculates health scores with proportional scaling based on file size
- Generates/updates `manifest.json` with latest model data and scores
- Commits changes to: `docs/asset/data/`, `_temp_storage/`, `_data_received/`

#### Commit Pattern:
```
chore: automated data merge from _data_received [YYYY-MM-DD HH:MM:SS]
```

### 2. Cache Bust Workflow
**File**: `cache_bust_daily.yml`  
**Schedule**: 2 AM UTC (02:00 UTC) daily  
**Purpose**: Force browser cache refresh for static assets

#### What It Does:
- Updates version numbers in HTML, CSS, and JS files
- Forces browser cache refresh to ensure users see latest data
- Commits changes to: `docs/*.html`, `docs/js/`, `docs/styles/`

#### Commit Pattern:
```
chore: daily cache bust - force browser refresh [YYYY-MM-DD HH:MM:SS]
```

## Race Condition Prevention

### 1. Time Separation
- **Data Merge**: 00:00 UTC (midnight)
- **Cache Bust**: 02:00 UTC (2 AM)
- **Gap**: 2-hour window ensures data merge completes before cache bust starts

### 2. File Path Isolation
- **Data Merge modifies**:
  - `docs/asset/data/` (data files)
  - `_temp_storage/` (processing logs)
  - `_data_received/` (cleanup)
- **Cache Bust modifies**:
  - `docs/*.html` (HTML files)
  - `docs/js/` (JavaScript files)
  - `docs/styles/` (CSS files)
- **No overlap**: Different file paths prevent merge conflicts

### 3. Concurrency Control
Both workflows use GitHub Actions concurrency groups:
```yaml
concurrency:
  group: workflow-name
  cancel-in-progress: false
```
- Prevents multiple instances of same workflow from running simultaneously
- Queues new runs if one is already in progress
- Does not cancel in-progress runs

### 4. Git Push Retry Logic
Both workflows include retry logic for git push operations:
```bash
MAX_RETRIES=3
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if git push origin main; then
    break
  else
    # Pull latest changes and retry
    git pull origin main --rebase
  fi
done
```
- Handles transient network issues
- Automatically resolves minor conflicts via rebase
- Prevents workflow failures due to timing issues

### 5. Latest Code Checkout
Cache bust workflow always pulls latest changes:
```yaml
- name: Checkout repository
  uses: actions/checkout@v4
  with:
    ref: main  # Always checkout latest main branch

- name: Pull latest changes
  run: git pull origin main --rebase
```
- Ensures cache bust works with latest data from data merge
- Prevents working on stale code

## Workflow Timing Diagram

```
00:00 UTC ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          │
          ▼
    ┌─────────────────────────────────────────────┐
    │  Data Merge and Scoring Workflow            │
    │  - Process new .sexyDuck files              │
    │  - Calculate health scores                  │
    │  - Update manifest.json                     │
    │  - Commit data changes                      │
    └─────────────────────────────────────────────┘
          │
          │ (typically completes in 5-15 minutes)
          │
          ▼
~00:15 UTC  Data merge completes and pushes
          │
          │ (2-hour safety buffer)
          │
02:00 UTC ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          │
          ▼
    ┌─────────────────────────────────────────────┐
    │  Cache Bust Workflow                        │
    │  - Pull latest changes (includes new data)  │
    │  - Update version numbers                   │
    │  - Commit cache bust changes                │
    └─────────────────────────────────────────────┘
          │
          │ (typically completes in 1-2 minutes)
          │
          ▼
~02:02 UTC  Cache bust completes and pushes
          │
          ▼
    Website now has latest data AND cache is busted
```

## Manual Triggers

Both workflows support manual triggering via GitHub Actions UI:
1. Go to **Actions** tab in GitHub repository
2. Select the workflow you want to run
3. Click **Run workflow** button
4. Select branch (usually `main`)
5. Click **Run workflow** to start

### When to Manually Trigger:

#### Data Merge Workflow:
- New data files added to `_data_received/`
- Need to recalculate scores
- Testing data processing pipeline

#### Cache Bust Workflow:
- Updated HTML/CSS/JS files
- Users reporting stale data in browser
- After major website updates

## Conflict Resolution

### If Workflows Conflict:
1. **Automatic Retry**: Both workflows retry push operations up to 3 times
2. **Rebase Strategy**: Pulls latest changes and rebases before retry
3. **Failure Notification**: GitHub will send notification if workflow fails after all retries

### Manual Resolution:
If both workflows fail:
1. Check workflow logs in GitHub Actions
2. Identify conflicting files
3. Manually resolve conflicts locally:
   ```bash
   git pull origin main
   # Resolve any conflicts
   git add .
   git commit -m "fix: resolve workflow conflicts"
   git push origin main
   ```
4. Re-run failed workflows manually

## Best Practices

### Adding New Workflows:
1. **Use unique concurrency group**: Prevent self-overlapping
2. **Schedule with time gaps**: Avoid simultaneous runs
3. **Limit file scope**: Only commit necessary files
4. **Add retry logic**: Handle transient failures
5. **Document timing**: Update this README

### Modifying Existing Workflows:
1. **Test locally first**: Use `act` or similar tools
2. **Consider timing**: Ensure 2-hour gap is sufficient
3. **Check file paths**: Maintain path isolation
4. **Update documentation**: Keep this README current

### Monitoring:
1. **Check workflow runs**: Review Actions tab regularly
2. **Review logs**: Investigate any failures
3. **Monitor timing**: Ensure workflows complete within expected time
4. **Validate data**: Verify website shows latest data

## Troubleshooting

### Data Merge Workflow Issues:

**Issue**: Workflow runs but no data processed  
**Solution**: Check if new files exist in `_data_received/`

**Issue**: Scoring fails  
**Solution**: Verify `.sexyDuck` files have required `model_file_size_bytes` in `job_metadata`

**Issue**: Push fails after retries  
**Solution**: Check for manual commits that conflict with automated changes

### Cache Bust Workflow Issues:

**Issue**: No version updates detected  
**Solution**: Check if HTML/CSS/JS files have version query parameters (e.g., `?v=123456`)

**Issue**: Push conflicts with data merge  
**Solution**: Increase time gap between workflows (modify cron schedule)

**Issue**: Stale cache persists  
**Solution**: Verify version numbers changed in committed files

### General Issues:

**Issue**: Both workflows running simultaneously  
**Solution**: Check concurrency groups are properly configured

**Issue**: Workflows not triggering on schedule  
**Solution**: Verify cron syntax and check GitHub Actions status

**Issue**: Too many workflow runs  
**Solution**: Check for duplicate schedules or manual triggers

## Architecture Benefits

1. **Separation of Concerns**: Each workflow has single, clear responsibility
2. **Race Condition Prevention**: Time gaps and file isolation prevent conflicts
3. **Reliability**: Retry logic handles transient failures
4. **Maintainability**: Easy to understand, modify, and debug
5. **Scalability**: Can add more workflows without conflicts
6. **Auditability**: Clear commit messages track automated changes

## Future Improvements

Potential enhancements:
- [ ] Add workflow dependency (cache bust waits for data merge completion)
- [ ] Implement workflow status notifications (Slack, email, etc.)
- [ ] Add health checks before committing changes
- [ ] Create rollback mechanism for failed updates
- [ ] Add metrics collection for workflow performance
