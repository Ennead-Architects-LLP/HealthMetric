# HealthMetric Batch Data System

A comprehensive system for sending and receiving batch data files through GitHub Actions.

## 🚀 Overview

This system allows you to:
- **Sender**: Collect multiple files from a folder and send them as a batch payload
- **Receiver**: Process batch payloads and extract individual files to `_storage` folder
- **GitHub Actions**: Automatically trigger processing when new data arrives

## 📁 System Architecture

```
HealthMetric/
├── sender/
│   ├── sender.py          # Main sender script
│   └── requirements.txt   # Dependencies
├── receiver/
│   ├── receiver.py        # Main receiver script
│   └── requirements.txt   # Dependencies
├── example_data/          # Sample files for testing
├── _storage/              # Processed files destination
└── .github/workflows/
    └── data-receiver.yml  # GitHub Actions workflow
```

## 🛠️ Setup

### 1. Install Dependencies

```bash
# Install sender dependencies
cd sender
pip install -r requirements.txt

# Install receiver dependencies
cd ../receiver
pip install -r requirements.txt
```

### 2. GitHub Token Setup

Set up a GitHub Personal Access Token with the following permissions:
- `repo` (Full control of private repositories)
- `workflow` (Update GitHub Action workflows)

Set the token as an environment variable:
```bash
export GITHUB_TOKEN="your_github_token_here"
```

## 📤 Sender Usage

### Command Line Options

```bash
# Send batch from folder
python sender/sender.py --folder /path/to/data/folder --batch-name "my_batch"

# Send single file
python sender/sender.py --file /path/to/file.json

# Send JSON data directly
python sender/sender.py --data '{"key": "value"}'

# Interactive mode
python sender/sender.py
```

### Supported File Types

The sender supports these file types:
- **JSON**: `.json`
- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`, `.svg`
- **Text**: `.txt`, `.csv`, `.xml`

### Example Usage

```bash
# Send all files from example_data folder
python sender/sender.py --folder example_data --batch-name "test_batch"

# Send with custom repository
python sender/sender.py --folder data --repo "your-org/your-repo"
```

## 📥 Receiver Processing

The receiver automatically:
1. **Detects** batch payloads in `_storage` folder
2. **Extracts** individual files from batch payloads
3. **Saves** files to `_storage` with timestamped names
4. **Creates** processing summaries and logs
5. **Cleans up** trigger files

### Batch Processing Flow

```
Batch Payload → Extract Files → Save to _storage → Create Summary → Cleanup
```

## 🔄 GitHub Actions Integration

### Automatic Triggers

The workflow triggers on:
- **Push to `_storage/**`**: When new data files are added
- **Repository Dispatch**: When manually triggered
- **Workflow Dispatch**: Manual execution with parameters

### Workflow Features

- ✅ **Python 3.11** environment setup
- ✅ **Automatic dependency installation**
- ✅ **Data processing with logging**
- ✅ **Change detection and commits**
- ✅ **Processing summary creation**
- ✅ **Artifact upload for logs**
- ✅ **Commit comments on successful processing**

## 🧪 Testing

### Run Test Suite

```bash
# Run comprehensive tests
python test_batch_system.py
```

### Manual Testing

1. **Create test data**:
   ```bash
   mkdir test_data
   echo '{"test": "data"}' > test_data/test.json
   echo 'Hello World' > test_data/hello.txt
   ```

2. **Send batch**:
   ```bash
   python sender/sender.py --folder test_data --batch-name "test_run"
   ```

3. **Check results**:
   - Visit GitHub repository
   - Check `_storage` folder for processed files
   - Review GitHub Actions logs

## 📊 Batch Payload Structure

```json
{
  "batch_metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "source_folder": "/path/to/source",
    "total_files": 3,
    "files": [
      {
        "filename": "data.json",
        "size": 1024,
        "extension": ".json"
      }
    ]
  },
  "files": {
    "data.json": {
      "filename": "data.json",
      "size": 1024,
      "extension": ".json",
      "content_type": "application/json",
      "content": "base64_encoded_content"
    }
  }
}
```

## 🔧 Configuration

### Environment Variables

- `GITHUB_TOKEN`: Required for GitHub API access
- `GITHUB_REPOSITORY`: Repository name (default: auto-detected)

### Repository Settings

The system works with any GitHub repository. Default repository:
- `ennead-architects-llp/HealthMetric`

## 📝 Logging

### Sender Logs
- Console output with progress indicators
- Error messages for failed operations
- Success confirmations with file counts

### Receiver Logs
- Detailed processing logs in `receiver.log`
- Processing summaries in `_storage/`
- GitHub Actions workflow logs

## 🚨 Error Handling

### Common Issues

1. **GitHub Token Issues**:
   - Ensure token has proper permissions
   - Check token expiration
   - Verify repository access

2. **File Processing Errors**:
   - Check file permissions
   - Verify file formats are supported
   - Review error logs

3. **GitHub Actions Failures**:
   - Check workflow permissions
   - Review action logs
   - Verify repository settings

### Debug Mode

Run with verbose logging:
```bash
python receiver/receiver.py --verbose
```

## 🔄 Workflow Examples

### Daily Data Upload

```bash
# Create daily batch
python sender/sender.py --folder /daily/data --batch-name "daily_$(date +%Y%m%d)"
```

### Emergency Data Push

```bash
# Send urgent data
python sender/sender.py --folder /emergency/data --batch-name "urgent_$(date +%H%M%S)"
```

### Scheduled Processing

Set up a cron job for automated uploads:
```bash
# Add to crontab
0 9 * * * cd /path/to/HealthMetric && python sender/sender.py --folder /scheduled/data
```

## 📈 Performance

### File Size Limits

- **GitHub API**: 100MB per file
- **Batch Payload**: Recommended < 50MB total
- **Individual Files**: No limit (within GitHub constraints)

### Processing Speed

- **Small batches** (< 10 files): ~30 seconds
- **Medium batches** (10-50 files): ~2 minutes
- **Large batches** (50+ files): ~5+ minutes

## 🛡️ Security

### Data Protection

- All data is base64 encoded during transmission
- Files are stored securely in GitHub repository
- Processing logs exclude sensitive content
- Automatic cleanup of temporary files

### Access Control

- GitHub repository permissions control access
- Personal access tokens provide authentication
- Workflow permissions are minimal and secure

## 📞 Support

### Troubleshooting

1. Check GitHub Actions logs
2. Review receiver.log file
3. Verify file permissions and formats
4. Test with example_data folder

### Getting Help

- Review error messages in console output
- Check GitHub Actions workflow logs
- Examine processing summaries in `_storage/`
- Run test suite for validation

---

**Happy Data Processing! 🎉**
