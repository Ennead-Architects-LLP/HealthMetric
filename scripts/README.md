# Scripts for Local Testing

## ⚠️ LOCAL TESTING ONLY

These scripts are **for local development and testing purposes only**. Do NOT use them in production workflows.

---

## Cache Busting Scripts

### 🧪 `local_test_cache_bust.py`
**Purpose:** Manually update version numbers in static assets to force browser cache refresh

**Usage:**
```bash
# From project root
python scripts/local_test_cache_bust.py
```

### 🧪 `local_test_cache_bust.bat` (Windows)
**Purpose:** Windows wrapper for the Python cache busting script

**Usage:**
```cmd
# From project root
scripts\local_test_cache_bust.bat
```

---

## Production Cache Busting

For production, cache busting is handled automatically by GitHub Actions:

**Workflow:** `.github/workflows/cache_bust_daily.yml`
- **Schedule:** Runs daily at 2 AM UTC
- **Trigger:** Automatic (no manual intervention needed)
- **Commit Prefix:** `%%% Workflow: daily cache bust - force browser refresh [timestamp]`

---

## When to Use Local Scripts

Use these local testing scripts when:
- ✅ Testing cache busting logic locally
- ✅ Developing new features that require cache refresh
- ✅ Debugging version number issues
- ✅ Need immediate cache refresh without waiting for workflow

Do NOT use when:
- ❌ Deploying to production
- ❌ In automated workflows
- ❌ Committing automated changes

---

## Files Affected

These scripts update version numbers in:
- `docs/index.html`
- `docs/dashboard.html`
- All `*.css` files in `docs/styles/`
- All `*.js` files in `docs/js/`

Version format: `v=YYYYMMDD_HHMMSS` (e.g., `v=20251011_120345`)

---

## Notes

- These scripts work identically to the production workflow
- Use them to test changes before pushing to production
- Always verify changes with `git diff` before committing
- The production workflow will override any manual cache busting

