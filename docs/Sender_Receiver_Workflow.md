## HealthMetric Sender ↔ Receiver Workflow (Current State)

### Purpose

Document the current end-to-end flow between the Windows Sender app and the Receiver processor so we can annotate, adjust, and iterate.

### High-Level Overview

 - Sender collects files/folders (currently RevitSlave data), builds a batch JSON payload, and commits it to the repo under `_temp_storage/` via GitHub API, then drops a trigger file in `.github/triggers/`.
 - Receiver runs, unpacks file/folder from `_temp_storage` (base64 → files, preserving structure) into a clean `_data_received/<job_name>/` destination, and cleans up trigger files.
 - Post-unpack cleanup: raw packages older than 10 days are deleted from `_temp_storage/` (and the just-processed raw package can be deleted immediately after successful unpack).

---

### Current Sender Workflow

Source: `sender/sender.py`

1. Initialization

   - Builds a GitHub token via `get_token()` and connects to repo `ennead-architects-llp/HealthMetric` using `PyGithub`.
   - Determines default source folder: `C:\Users\<user>\Documents\EnneadTab Ecosystem\Dump\RevitSlaveDatabase`. If this path does not exist we can exit early.

2. Batch Creation

   - `create_batch_payload(path)` walks a folder (or accepts a single file) and builds a payload:
     - `batch_metadata`: timestamp, source path, file count, file list.
     - `files`: keyed by relative path; each entry includes filename, relative path, size, extension, MIME type, and `content` as base64.
3. Commit to Repo

   - `send_data(data, filename)`: send to temporary storage

4. Trigger Receiver

   - `trigger_workflow()`: creates `trigger` with a timestamp to signal processing.
5. Default Execution Path

   - `main()`: finds RevitSlave data, sends a batch (named `revit_slave_<YYYYMMDD_HHMMSS>`), returns nonzero on failure.

 Artifacts written by Sender

 - `_temp_storage/<job_name>_<timestamp>.json`: batch payload with embedded base64 file contents.
 - `.github/triggers/<job_name>_<timestamp>.json`: lightweight trigger pointing to the raw payload.

---

### Current Receiver Workflow

Source: `receiver/receiver.py`

1. Initialization

   - Requires `GITHUB_TOKEN` or explicit `--token` CLI arg.
   - Connects to `ennead-architects-llp/HealthMetric` via `PyGithub`.
   - Sets up logging to `receiver.log` and stdout.
 2. Lookup triggers in `.github/triggers/` and unpack contents from `_temp_storage/` to `_data_received/<job_name>/`.
    - After successful unpack, delete the processed raw package; also enforce retention to keep only last 10 days in `_temp_storage/`.

---

 ### Notes / Observations

 - Sender embeds full file bytes in JSON (base64); large batches will create large repo commits.
 - Receiver writes extracted content only to local `_data_received/` and does not push processed results back to the repo.
 - Trigger files live in `.github/triggers/`; these are moved/cleaned after processing.
 - Sender relies on a hard-coded repo and a computed GitHub token; Receiver requires `GITHUB_TOKEN`.

---

### Next Steps (for discussion)

- Define desired artifact destinations (local vs. repo), retention, and cleanup policies.
- Clarify when to process vs. just stage payloads; gating via labels/PRs/Actions?
- Consider chunking/streaming for large datasets; avoid giant JSON.
- Define error handling, retries, and idempotency across both sides.
- Unify auth strategy and secrets management.
