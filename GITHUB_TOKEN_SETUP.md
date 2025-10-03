# GitHub Token Setup Guide

## 🔐 Getting Your GitHub Personal Access Token

### Step 1: Go to GitHub Settings
1. **Sign in** to your GitHub account
2. **Click** your profile picture in the top-right corner
3. **Select** "Settings" from the dropdown menu

### Step 2: Navigate to Developer Settings
1. **Scroll down** in the left sidebar
2. **Click** "Developer settings" (at the bottom)
3. **Click** "Personal access tokens"
4. **Select** "Tokens (classic)" or "Fine-grained tokens"

### Step 3: Generate New Token

#### Option A: Classic Token (Recommended)
1. **Click** "Generate new token" → "Generate new token (classic)"
2. **Add a note**: `HealthMetric Data Sender`
3. **Set expiration**: Choose appropriate duration (30 days, 90 days, or custom)
4. **Select scopes** (permissions):
   - ✅ **repo** (Full control of private repositories)
     - ✅ **repo:status** (Access commit status)
     - ✅ **repo_deployment** (Access deployment status)
     - ✅ **public_repo** (Access public repositories)
     - ✅ **repo:invite** (Access repository invitations)
   - ✅ **workflow** (Update GitHub Action workflows)
5. **Click** "Generate token"

#### Option B: Fine-grained Token (Advanced)
1. **Click** "Generate new token" → "Generate new token (fine-grained)"
2. **Select resource owner**: Choose your organization or personal account
3. **Add repository access**: Select the HealthMetric repository
4. **Set permissions**:
   - **Repository permissions**:
     - ✅ **Contents**: Read and write
     - ✅ **Actions**: Read and write
     - ✅ **Metadata**: Read
     - ✅ **Pull requests**: Read and write
5. **Click** "Generate token"

### Step 4: Copy and Save Token
1. **Copy** the generated token immediately (you won't see it again!)
2. **Save** it securely (password manager, secure note, etc.)

⚠️ **IMPORTANT**: The token is only shown once. If you lose it, you'll need to generate a new one.

## 🛠️ Setting Up the Token

### Windows (Command Prompt)
```cmd
set GITHUB_TOKEN=ghp_your_token_here
```

### Windows (PowerShell)
```powershell
$env:GITHUB_TOKEN="ghp_your_token_here"
```

### Linux/Mac (Bash)
```bash
export GITHUB_TOKEN="ghp_your_token_here"
```

### Make it Permanent

#### Windows
1. **Right-click** "This PC" → "Properties"
2. **Click** "Advanced system settings"
3. **Click** "Environment Variables"
4. **Click** "New" under "User variables"
5. **Variable name**: `GITHUB_TOKEN`
6. **Variable value**: `ghp_your_token_here`
7. **Click** "OK" to save

#### Linux/Mac
Add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):
```bash
echo 'export GITHUB_TOKEN="ghp_your_token_here"' >> ~/.bashrc
source ~/.bashrc
```

## 🧪 Testing Your Token

### Method 1: Test with HealthMetric Sender
```cmd
# Test with example data
python sender\sender.py --data '{"test": "token_working"}' --filename "token_test.json"
```

### Method 2: Test with GitHub API
```cmd
# Windows
curl -H "Authorization: token %GITHUB_TOKEN%" https://api.github.com/user

# Linux/Mac
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

### Method 3: Test RevitSlaveData Upload
```cmd
# If you have RevitSlaveData folder
python sender\sender.py --revit-slave --batch-name "token_test"
```

## 🔒 Security Best Practices

### Token Security
- ✅ **Never commit** tokens to code repositories
- ✅ **Use environment variables** instead of hardcoding
- ✅ **Set appropriate expiration** dates
- ✅ **Revoke unused tokens** regularly
- ✅ **Use fine-grained tokens** when possible

### Repository Security
- ✅ **Limit token scope** to necessary permissions only
- ✅ **Use private repositories** for sensitive data
- ✅ **Regularly audit** token usage in GitHub settings

## 🚨 Troubleshooting

### Token Not Working
```
❌ GitHub token is required. Set GITHUB_TOKEN environment variable or pass token parameter.
```
**Solutions**:
1. Check if token is set: `echo %GITHUB_TOKEN%` (Windows) or `echo $GITHUB_TOKEN` (Linux/Mac)
2. Verify token format starts with `ghp_`
3. Check token hasn't expired
4. Ensure token has correct permissions

### Permission Denied
```
❌ 403 Forbidden - Bad credentials
```
**Solutions**:
1. Check token permissions include `repo` and `workflow`
2. Verify repository access
3. Try regenerating the token

### Repository Not Found
```
❌ 404 Not Found - Repository not found
```
**Solutions**:
1. Check repository name is correct: `ennead-architects-llp/HealthMetric`
2. Verify you have access to the repository
3. Try with a different repository you own

## 📋 Quick Checklist

- [ ] Generated GitHub Personal Access Token
- [ ] Token has `repo` and `workflow` permissions
- [ ] Token is saved securely
- [ ] Environment variable `GITHUB_TOKEN` is set
- [ ] Token is tested and working
- [ ] RevitSlaveData folder path is correct

## 🆘 Need Help?

### Common Issues
1. **Token expired**: Generate a new one
2. **Wrong permissions**: Regenerate with correct scopes
3. **Environment variable not set**: Check your system settings
4. **Repository access**: Ensure you have push access

### Getting Support
- Check GitHub documentation: https://docs.github.com/en/authentication
- Review repository permissions in GitHub settings
- Test with a simple API call first

---

**Your token is ready! 🎉 Now you can send RevitSlaveData to GitHub.**
