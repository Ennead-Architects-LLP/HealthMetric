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

    # Skip writing processing_summary.json per request
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
