import json
import base64
from pathlib import Path
from datetime import datetime


def extract_job(json_path: Path, out_root: Path) -> Path:
    data = json.loads(json_path.read_text(encoding="utf-8"))
    job_name = json_path.stem
    job_dir = out_root / job_name
    job_dir.mkdir(parents=True, exist_ok=True)

    files = data.get("files", {})
    extracted = []
    for rel, info in files.items():
        content_b64 = info.get("content")
        if not content_b64:
            continue
        content = base64.b64decode(content_b64)
        dest = job_dir / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(content)
        extracted.append({
            "filename": rel,
            "size": len(content),
            "extension": info.get("extension", ""),
            "status": "success",
            "saved_to": str(dest)
        })

    summary = {
        "batch_metadata": data.get("batch_metadata", {}),
        "extraction_folder": str(job_dir),
        "extraction_results": {
            "total_files": len(files),
            "successful_extractions": len(extracted),
            "failed_extractions": 0,
            "extracted_files": extracted,
        },
        "metadata": {
            "original_batch_file": json_path.name,
            "processed_at": datetime.now().isoformat(),
            "processor": "local_unpack",
            "version": "1.0.0",
            "processing_type": "batch_extraction_to_folders"
        }
    }
    (job_dir / "processing_summary.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return job_dir


def main() -> None:
    temp = Path("_temp_storage")
    out = Path("_data_received")
    out.mkdir(exist_ok=True)

    payloads = sorted(temp.glob("*.json"))
    if not payloads:
        print("No payloads found in _temp_storage")
        return

    for p in payloads:
        job_dir = extract_job(p, out)
        print(f"Extracted {p.name} -> {job_dir}")


if __name__ == "__main__":
    main()
