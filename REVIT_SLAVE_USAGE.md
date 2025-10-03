# RevitSlaveData Sender - Quick Start Guide

## 🎯 Purpose
Send all files from the RevitSlaveData folder to the HealthMetric GitHub repository for processing.

## 📁 Default Folder Location
```
C:\Users\USERNAME\Documents\EnneadTab Ecosystem\Dump\RevitSlaveData
```

## 🚀 Quick Start

### Method 1: Batch Script (Windows)
```cmd
# Double-click or run:
send_revit_data.bat
```

### Method 2: Command Line
```cmd
# Set your GitHub token first
set GITHUB_TOKEN=your_github_token_here

# Send RevitSlaveData
python sender\sender.py --revit-slave

# Or with custom batch name
python sender\sender.py --revit-slave --batch-name "my_revit_data"
```

### Method 3: Interactive Mode
```cmd
python sender\sender.py
# Then select option 4: "Send RevitSlaveData (default folder)"
```

## 🔧 Configuration

### Custom Source Folder
If your RevitSlaveData is in a different location:
```cmd
python sender\sender.py --revit-slave --source-folder "C:\Your\Custom\Path\RevitSlaveData"
```

### Custom Repository
```cmd
python sender\sender.py --revit-slave --repo "your-org/your-repo"
```

## 📋 What Gets Sent

The system will automatically find and send:
- ✅ **JSON files** (`.json`)
- ✅ **Image files** (`.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`, `.svg`)
- ✅ **Text files** (`.txt`, `.csv`, `.xml`)

## 🔄 Processing Flow

1. **Sender** scans RevitSlaveData folder
2. **Packages** all supported files into a batch payload
3. **Uploads** to GitHub repository `_storage` folder
4. **Triggers** GitHub Actions workflow
5. **Receiver** processes the batch and extracts individual files
6. **Files** are saved to `_storage` with timestamped names

## 📊 Example Output

```
🔍 Looking for RevitSlaveData in: C:\Users\USERNAME\Documents\EnneadTab Ecosystem\Dump\RevitSlaveData
📁 Added file: data.json (1024 bytes)
📁 Added file: image.png (2048 bytes)
📁 Added file: report.txt (512 bytes)
✅ Created batch payload with 3 files from C:\Users\USERNAME\Documents\EnneadTab Ecosystem\Dump\RevitSlaveData
📤 Sending data to: _storage/revit_slave_20240115_143022.json
✅ Created new file: _storage/revit_slave_20240115_143022.json
🚀 Triggered receiver workflow
🚀 Successfully sent batch 'revit_slave_20240115_143022' with 3 files
✅ Data sent successfully!
```

## ⚠️ Troubleshooting

### Folder Not Found
```
❌ RevitSlaveData folder not found: C:\Users\USERNAME\Documents\EnneadTab Ecosystem\Dump\RevitSlaveData
💡 Please ensure the folder exists or set a custom path
```
**Solution**: Check the folder path or use `--source-folder` parameter

### No Files Found
```
⚠️ No supported files found in folder
```
**Solution**: Ensure the folder contains supported file types (JSON, images, text files)

### GitHub Token Issues
```
❌ GitHub token is required. Set GITHUB_TOKEN environment variable or pass token parameter.
```
**Solution**: Set your GitHub token:
```cmd
set GITHUB_TOKEN=your_token_here
```

## 🔐 GitHub Token Setup

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with these permissions:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
3. Copy the token and set it as environment variable:
   ```cmd
   set GITHUB_TOKEN=your_token_here
   ```

## 📈 Monitoring

After sending data:
1. Check GitHub repository `_storage` folder
2. Review GitHub Actions workflow logs
3. Look for processing summaries in `_storage/`

## 🎯 Use Cases

- **Daily Data Sync**: Send daily RevitSlaveData updates
- **Emergency Upload**: Quick data backup and processing
- **Batch Processing**: Handle multiple files at once
- **Automated Workflow**: Integrate with other tools

## 💡 Tips

- Use descriptive batch names for easier tracking
- Check GitHub Actions logs for processing status
- Files are automatically timestamped to avoid conflicts
- Processing happens asynchronously via GitHub Actions

---

**Ready to send your RevitSlaveData! 🚀**
