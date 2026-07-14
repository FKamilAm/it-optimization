"""Upload static export (out/) to reg.ru hosting via FTP.

Resilient to reg.ru's flaky passive-mode data connections: every file is
retried with a fresh connection, and remote directories are addressed by their
absolute path so a mid-run reconnect never loses its place.
"""
from __future__ import annotations

import os
import sys
import time
from ftplib import FTP, error_perm
from pathlib import Path

HOST = "31.31.197.28"
USER = "u3568260"
PASSWORD = os.environ.get("FTP_PASSWORD", "")
LOCAL_ROOT = Path(__file__).resolve().parents[1] / "out"
REMOTE_ROOT = "/www/it-optimization.ru"
TIMEOUT = 60
RETRIES = 5


def connect() -> FTP:
    ftp = FTP(HOST, timeout=TIMEOUT)
    ftp.login(USER, PASSWORD)
    ftp.set_pasv(True)
    return ftp


def ensure_dir(ftp: FTP, remote_dir: str) -> None:
    """Create every segment of an absolute remote path if missing."""
    ftp.cwd("/")
    path = ""
    for part in [p for p in remote_dir.split("/") if p]:
        path += "/" + part
        try:
            ftp.cwd(path)
        except error_perm:
            ftp.mkd(path)
            ftp.cwd(path)


def main() -> int:
    if not PASSWORD:
        print("FTP_PASSWORD env var is required", file=sys.stderr)
        return 1
    if not LOCAL_ROOT.is_dir():
        print(f"Missing build output: {LOCAL_ROOT}", file=sys.stderr)
        return 1

    ftp = connect()
    print(f"connected: {HOST} as {USER}")

    created: set[str] = set()
    count = 0

    for root, _dirs, filenames in os.walk(LOCAL_ROOT):
        rel = os.path.relpath(root, LOCAL_ROOT).replace("\\", "/")
        remote_dir = REMOTE_ROOT if rel == "." else f"{REMOTE_ROOT}/{rel}"

        if remote_dir not in created:
            for attempt in range(1, RETRIES + 1):
                try:
                    ensure_dir(ftp, remote_dir)
                    created.add(remote_dir)
                    break
                except Exception as exc:  # noqa: BLE001
                    print(f"mkdir retry {attempt} {remote_dir}: {exc}", file=sys.stderr)
                    try:
                        ftp.close()
                    except Exception:  # noqa: BLE001
                        pass
                    time.sleep(2)
                    ftp = connect()
            else:
                print(f"FAILED mkdir: {remote_dir}", file=sys.stderr)
                return 1

        for name in sorted(filenames):
            local_path = os.path.join(root, name)
            remote_path = f"{remote_dir}/{name}"
            for attempt in range(1, RETRIES + 1):
                try:
                    ftp.cwd(remote_dir)
                    with open(local_path, "rb") as handle:
                        ftp.storbinary(f"STOR {name}", handle)
                    count += 1
                    print(f"uploaded: {remote_path}")
                    break
                except Exception as exc:  # noqa: BLE001
                    print(f"retry {attempt} {remote_path}: {exc}", file=sys.stderr)
                    try:
                        ftp.close()
                    except Exception:  # noqa: BLE001
                        pass
                    time.sleep(2)
                    ftp = connect()
            else:
                print(f"FAILED: {remote_path}", file=sys.stderr)
                return 1

    print(f"done: {count} files, {len(created)} directories")
    try:
        ftp.quit()
    except Exception:  # noqa: BLE001
        ftp.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
