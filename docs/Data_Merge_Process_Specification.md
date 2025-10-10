# Data Merge Process Specification

## Overview

This document outlines the data merging process for HealthMetric, supporting both legacy and new data package structures.

---

## Current (Legacy) Method

### Source Structure

```
_data_received/
├── revit_slave_20251008_122051/
│   └── task_output/
│       ├── 2025-10-06_Ennead Architects LLP_1643_LHH_ModelA.sexyDuck
│       ├── 2025-10-06_Ennead Architects LLP_2151_NYULI_ModelB.sexyDuck
│       └── 2025-10-06_Ennead Architects LLP_2330_Studio 54_ModelC.sexyDuck
├── revit_slave_20251008_122108/
│   └── task_output/
│       └── 2025-10-06_Ennead Architects LLP_1643_LHH_ModelD.sexyDuck
└── revit_slave_20251009_192549/
    └── task_output/
        └── 2025-10-06_Ennead Architects LLP_2412_SPARC_ModelE.sexyDuck
```

### Current Process

1. **Scan** `_data_received/` for all `revit_slave_*` folders
2. **Sort** folders chronologically (oldest first)
3. **For each folder**:
   - Look for `task_output/` subfolder
   - Find all `.sexyDuck` files inside `task_output/`
   - Validate each file (check for errors, mock data, valid JSON)
   - Copy valid files directly to `docs/asset/data/`
4. **Generate** `manifest.json` with flat file list
5. **Score** all files
6. **Delete** processed `revit_slave_*` folders

### Current Destination Structure

```
docs/asset/data/
├── 2025-10-06_Ennead Architects LLP_1643_LHH_ModelA.sexyDuck
├── 2025-10-06_Ennead Architects LLP_1643_LHH_ModelD.sexyDuck
├── 2025-10-06_Ennead Architects LLP_2151_NYULI_ModelB.sexyDuck
├── 2025-10-06_Ennead Architects LLP_2330_Studio 54_ModelC.sexyDuck
├── 2025-10-06_Ennead Architects LLP_2412_SPARC_ModelE.sexyDuck
└── manifest.json
```

**Issue**: All files are in one flat directory, losing project organization.

---

## New Method - Project-Organized Structure

### Actual Source Structure (Hybrid)

```
_data_received/
├── revit_slave_20251009_192549/        # Legacy folder
│   └── task_output/
│       ├── 1643_LHH/                   # 🟡 NEW: Project folder (any name)
│       │   ├── ModelA.sexyDuck
│       │   └── ModelB.sexyDuck
│       ├── 2330_Studio 54/             # 🟡 NEW: Project folder (any name)
│       │   └── ModelC.sexyDuck
│       ├── 2534_NYUL Long Island HQ/   # 🟡 NEW: Project folder (any name)
│       │   └── ModelD.sexyDuck
│       ├── MyCustomProject/            # 🟡 NEW: Project folder (any name)
│       │   └── ModelE.sexyDuck
│       ├── 2025-10-06_Ennead Architects LLP_1643_LHH_ModelF.sexyDuck  # 🔵 LEGACY: Flat file
│       ├── 2025-10-06_Ennead Architects LLP_1643_LHH_ModelG.sexyDuck  # 🔵 LEGACY: Flat file
│       └── 2025-10-06_Ennead Architects LLP_1643_LHH_ModelH.sexyDuck  # 🔵 LEGACY: Flat file
└── revit_slave_20251009_003315/        # Another legacy folder
    └── task_output/
        └── 2025-10-06_Ennead Architects LLP_2501_SAIF_ModelI.sexyDuck  # 🔵 LEGACY: Flat file
```

**Key Point**: Project folders can have **any name** - they are simply folders directly under `task_output/`

### New Expected Destination Structure

```
docs/asset/data/
├── 1643_LHH/                           # Project folder preserved (any name)
│   ├── ModelA.sexyDuck
│   ├── ModelB.sexyDuck
│   └── 2025-10-06_Ennead Architects LLP_1643_LHH_ModelF.sexyDuck  # From legacy
├── 2330_Studio 54/                     # Project folder preserved (any name)
│   ├── ModelC.sexyDuck
│   └── 2025-10-06_Ennead Architects LLP_1643_LHH_ModelG.sexyDuck  # From legacy
├── 2534_NYUL Long Island HQ/           # Project folder preserved (any name)
│   └── ModelD.sexyDuck
├── MyCustomProject/                    # Project folder preserved (any name)
│   └── ModelE.sexyDuck
├── 2501_SAIF/                          # From legacy filename parsing
│   └── 2025-10-06_Ennead Architects LLP_2501_SAIF_ModelI.sexyDuck
└── manifest.json
```

**Key Point**: Project folder names are preserved exactly as they appear in `task_output/`

---

## Proposed Merge Process (Supporting Both Methods)

### Step 1: Scan for Data Sources

#### 1A. Scan for Project-Organized Folders (New Method)

- Look for **any folders** directly under `task_output/` in each `revit_slave_*` folder
- **No naming pattern required** - any folder name is treated as a project folder
- Examples: `1643_LHH/`, `2330_Studio 54/`, `MyCustomProject/`, `2534_NYUL Long Island HQ/`

#### 1B. Scan for Legacy revit_slave Folders

- Look for folders matching pattern: `revit_slave_YYYYMMDD_HHMMSS/`
- These folders should have a `task_output/` subfolder inside

### Step 2: Process Project-Organized Folders (New Method)

For each project folder found in `task_output/`:

```
Input:  _data_received/revit_slave_*/task_output/1643_LHH/
        ├── ModelA.sexyDuck
        ├── ModelB.sexyDuck
        └── ModelC.sexyDuck

Output: docs/asset/data/1643_LHH/
        ├── ModelA.sexyDuck
        ├── ModelB.sexyDuck
        └── ModelC.sexyDuck
```

**Process**:

1. **Identify** any folders in `task_output/` (e.g., `1643_LHH/`, `2330_Studio 54/`, `MyCustomProject/`)
2. **Create** matching project folder in `docs/asset/data/` if it doesn't exist (preserve exact folder name)
3. **Scan** all `.sexyDuck` files in the project folder
4. **Validate** each file (check for errors, mock data, valid JSON)
5. **Copy** valid files to `docs/asset/data/{exact_folder_name}/`
   - If file already exists, overwrite with newer version
6. **Mark** project folder as processed (for cleanup later)

### Step 3: Process Legacy Flat Files

For each flat `.sexyDuck` file found directly in `task_output/`:

```
Input:  _data_received/revit_slave_*/task_output/
        └── 2025-10-06_Ennead Architects LLP_1643_LHH_ModelE.sexyDuck

Output: docs/asset/data/1643_LHH/
        └── 2025-10-06_Ennead Architects LLP_1643_LHH_ModelE.sexyDuck
```

**Process**:

1. **Scan** for `.sexyDuck` files directly in `task_output/` (not in project subfolders)
2. **For each** flat file:
   - **Parse** filename to extract project info
   - **Extract** project name from filename (no project number extraction)
     - Format: `YYYY-MM-DD_HubName_ProjectNumber_ProjectName_ModelName.sexyDuck`
     - Example: `2025-10-06_Ennead Architects LLP_1643_LHH_ModelE.sexyDuck`
     - Extracted project name: `1643_LHH` (use the project identifier from filename)
   - **Create** project folder `docs/asset/data/{project_name}/` if needed
   - **Validate** file
   - **Copy** valid file to the project-specific folder
3. **Mark** `revit_slave_*` folder for cleanup

### Step 4: Generate Manifest

Create `docs/asset/data/manifest.json` with hierarchical structure:

```json
{
  "version": "2.0",
  "generated_at": "2025-10-09T19:25:49.784161",
  "total_projects": 5,
  "total_files": 7,
  "projects": [
    {
      "project_folder": "1643_LHH",
      "project_name": "1643_LHH",
      "total_models": 3,
      "models": [
        {
          "filename": "2025-10-06_Ennead Architects LLP_1643_LHH_ModelA.sexyDuck",
          "relative_path": "1643_LHH/2025-10-06_Ennead Architects LLP_1643_LHH_ModelA.sexyDuck",
          "hub": "Ennead Architects LLP",
          "model": "ModelA",
          "timestamp": "2025-10-06",
          "filesize": 18143,
          "last_modified": 1728234567.123
        },
        {
          "filename": "2025-10-06_Ennead Architects LLP_1643_LHH_ModelD.sexyDuck",
          "relative_path": "1643_LHH/2025-10-06_Ennead Architects LLP_1643_LHH_ModelD.sexyDuck",
          "hub": "Ennead Architects LLP",
          "model": "ModelD",
          "timestamp": "2025-10-06",
          "filesize": 19880,
          "last_modified": 1728234568.456
        },
        {
          "filename": "2025-10-09_Ennead Architects LLP_1643_LHH_ModelA.sexyDuck",
          "relative_path": "1643_LHH/2025-10-09_Ennead Architects LLP_1643_LHH_ModelA.sexyDuck",
          "hub": "Ennead Architects LLP",
          "model": "ModelA",
          "timestamp": "2025-10-09",
          "filesize": 18200,
          "last_modified": 1728489567.789
        }
      ]
    },
    {
      "project_folder": "2151_NYULI",
      "project_name": "2151_NYULI",
      "total_models": 1,
      "models": [
        {
          "filename": "2025-10-06_Ennead Architects LLP_2151_NYULI_ModelB.sexyDuck",
          "relative_path": "2151_NYULI/2025-10-06_Ennead Architects LLP_2151_NYULI_ModelB.sexyDuck",
          "hub": "Ennead Architects LLP",
          "model": "ModelB",
          "timestamp": "2025-10-06",
          "filesize": 20150,
          "last_modified": 1728234569.012
        }
      ]
    }
  ]
}
```

### Step 5: Score All Files

- **Recursively scan** `docs/asset/data/` for all `.sexyDuck` files
- **Score** each file using `docs/ref/scoring.py`
- Files are updated in place with score data

### Step 6: Regenerate Manifest

- Regenerate manifest after scoring to include updated file metadata

### Step 7: Cleanup

#### 7A. Delete Processed Project Folders

- **Delete** project folders from `_data_received/` after successful copy
- Only delete if all files in the folder were successfully processed

#### 7B. Delete Legacy revit_slave Folders

- **Delete** `revit_slave_*` folders from `_data_received/` after processing
- Maintains backward compatibility with existing workflow

---

## File Validation Rules

Same validation rules apply to both methods:

1. **Valid JSON**: File must contain valid JSON
2. **No Errors**: `status != "failed"`
3. **No Error Flag**: `result_data.debug_info.error_occurred != true`
4. **No Mock Data**: `result_data.mock_mode != true`
5. **Not Empty**: File must have content

---

## Filename Parsing

### Expected Filename Format

```
YYYY-MM-DD_HubName_ProjectIdentifier_ModelName.sexyDuck
```

### Examples

- `2025-10-06_Ennead Architects LLP_1643_LHH_ModelA.sexyDuck`

  - Date: `2025-10-06`
  - Hub: `Ennead Architects LLP`
  - Project Identifier: `1643_LHH` (used as project name)
  - Model Name: `ModelA`
- `2025-10-06_Ennead Architects LLP_2330_Studio 54_Theater.sexyDuck`

  - Date: `2025-10-06`
  - Hub: `Ennead Architects LLP`
  - Project Identifier: `2330_Studio 54` (used as project name)
  - Model Name: `Theater`

### Project Folder Naming

- **No specific format required** - any folder name is valid
- Examples: `1643_LHH`, `2330_Studio 54`, `MyCustomProject`, `2534_NYUL Long Island HQ`
- **Key**: Folders are identified by being directly under `task_output/`, not by naming pattern

---

## Benefits of New Structure

### 1. **Logical Organization**

- Files grouped by project
- Easier to locate specific project data
- Better for team collaboration

### 2. **Improved Navigation**

- Dashboard can show project hierarchy
- Filter/search by project
- Project-level metrics aggregation

### 3. **Version Management**

- Multiple versions of same model in project folder
- Can show version history per project
- Easier to compare model changes over time

### 4. **Scalability**

- Thousands of files organized logically
- No single directory with hundreds of files
- Better file system performance

### 5. **Backward Compatibility**

- Legacy `revit_slave_*` folders still work
- Files from legacy are automatically organized
- Smooth transition period

---

## Migration Strategy

### Phase 1: Update Merge Script

- Implement new project-organized processing
- Keep legacy method active
- Update manifest format to v2.0 (hierarchical)

### Phase 2: Update Dashboard

- Update `DataLoader.js` to handle hierarchical manifest
- Keep backward compatibility with flat manifest
- Add project-level grouping in UI

### Phase 3: Update Sender

- Modify sender to create project-organized folders
- Keep sending to legacy folders as fallback
- Gradual rollout to users

### Phase 4: Full Transition

- All new data uses project-organized structure
- Legacy folders deprecated but still processed
- Eventually remove legacy support after 6 months

---

## Questions to Confirm

1. **Project Folder Naming**: ✅ **CONFIRMED** - Project folders can be any text. Do not assume having a project number in there. The entire name is the project name.

   - Examples: `1643_LHH`, `2330_Studio 54`, `MyCustomProject`, `2534_NYUL Long Island HQ`
2. **Data Received Structure**: ✅ **CONFIRMED** - We still receive `revit_slave_*` packages because there are many computers sending us packages. The `task_output/` folder inside `revit_slave_*` package is still true.

   ```
   _data_received/
   ├── revit_slave_20251009_192549/
   │   └── task_output/
   │       ├── 1643_LHH/              # Project folder (any name)
   │       ├── 2330_Studio 54/        # Project folder (any name)
   │       └── MyCustomProject/       # Project folder (any name)
   ├── revit_slave_20251009_003315/
   │   └── task_output/
   │       └── 2534_NYUL Long Island HQ/  # Project folder (any name)
   └── revit_slave_*/  (from multiple computers)
   ```
3. **File Overwriting**: ✅ **CONFIRMED** - Same name data files will be overwritten. No multiple versions kept.

4. **Cleanup Strategy**: ✅ **CONFIRMED** - After the entire package is processed, delete the package from `_data_received/`.

5. **Manifest Format**: ✅ **CONFIRMED** - Hierarchical JSON structure (v2.0) is good.
   - Grouped by projects
   - Contains relative paths
   - Includes project-level metadata

6. **Dashboard Compatibility**: Should the dashboard: 

   - Show project groupings in UI?
   - Allow filtering by project?
   - Display project-level health scores?

---

## Implementation Checklist

- [ ] Update `merge_data_received.py` to detect project folders
- [ ] Implement project folder creation in destination
- [ ] Update filename parsing for project extraction
- [ ] Modify manifest generation for hierarchical structure
- [ ] Update scoring to recursively process subfolders
- [ ] Update cleanup logic for both folder types
- [ ] Test with legacy `revit_slave_*` folders
- [ ] Test with new project-organized folders
- [ ] Update `DataLoader.js` for hierarchical manifest
- [ ] Update dashboard UI for project grouping
- [ ] Update documentation
- [ ] Create migration guide for team

---

## Next Steps

Please review this specification and confirm:

1. ✅ or ❌ for each section
2. Answer the "Questions to Confirm" section
3. Any additional requirements or changes needed

Once confirmed, I will proceed with implementing the updated merge script.
