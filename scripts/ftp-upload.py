"""Upload static export (out/) to reg.ru hosting via FTP."""
from __future__ import annotations

import os
import sys
from ftplib import FTP, error_perm
from pathlib import Path

HOST = "31.31.197.28"
USER = "u3568260"
PASSWORD = os.environ.get("FTP_PASSWORD", "")
LOCAL_ROOT = Path(__file__).resolve().parents[1] / "out"
REMOTE_ROOT = "www/it-optimization.ru"


def ensure_remote_dir(ftp: FTP, path: str) -> None:
    for part in [p for p in path.replace("\\", "/").split("/") if p]:
        try:
            ftp.cwd(part)
        except error_perm:
            ftp.mkd(part)
            ftp.cwd(part)


def upload_tree(ftp: FTP, local: Path, remote_prefix: str = "") -> tuple[int, int]:
    files = 0
    dirs = 0
    for entry in sorted(local.iterdir()):
        remote_path = f"{remote_prefix}/{entry.name}" if remote_prefix else entry.name
        if entry.is_dir():
            try:
                ftp.cwd(entry.name)
            except error_perm:
                ftp.mkd(entry.name)
                ftp.cwd(entry.name)
            sub_files, sub_dirs = upload_tree(ftp, entry, remote_path)
            files += sub_files
            dirs += sub_dirs + 1
            ftp.cwd("..")
        else:
            with entry.open("rb") as handle:
                ftp.storbinary(f"STOR {entry.name}", handle)
            files += 1
            print(f"uploaded: {remote_path}")
    return files, dirs


def main() -> int:
    if not PASSWORD:
        print("FTP_PASSWORD env var is required", file=sys.stderr)
        return 1
    if not LOCAL_ROOT.is_dir():
        print(f"Missing build output: {LOCAL_ROOT}", file=sys.stderr)
        return 1

    ftp = FTP(HOST, timeout=120)
    try:
        ftp.login(USER, PASSWORD)
        ftp.set_pasv(True)
        print(f"connected: {HOST} as {USER}")

        ensure_remote_dir(ftp, REMOTE_ROOT)
        print(f"remote cwd: {ftp.pwd()}")

        files, dirs = upload_tree(ftp, LOCAL_ROOT)
        print(f"done: {files} files, {dirs} directories")
        return 0
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()


if __name__ == "__main__":
    raise SystemExit(main())
