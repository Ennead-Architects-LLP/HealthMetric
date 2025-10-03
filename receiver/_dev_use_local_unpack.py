"""
Dev-only helper: invoke receiver local mode to unpack _temp_storage
based on triggers into _data_received, exercising the same code paths
as CI (no separate logic).
"""

from receiver.receiver import _run_local_mode


def main() -> int:
    ok = _run_local_mode()
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())


