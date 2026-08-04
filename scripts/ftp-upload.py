"""Upload a built static folder to reg.ru hosting via FTP.

Defaults to the site's own export (out/ → /www/it-optimization.ru). The CRM
reuses the same script with FTP_LOCAL_ROOT/FTP_REMOTE_ROOT pointing at its own
build and subdomain — the flaky-connection handling below is the whole reason
not to keep a second copy of it.

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
PROJECT_ROOT = Path(__file__).resolve().parents[1]
LOCAL_ROOT = PROJECT_ROOT / os.environ.get("FTP_LOCAL_ROOT", "out")
REMOTE_ROOT = os.environ.get("FTP_REMOTE_ROOT", "/www/it-optimization.ru").rstrip("/")
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

    # Порядок заливки важен. Файлы перезаписываются по одному несколько минут, и
    # всё это время на хостинге лежит смесь старой и новой версии. Если свежий
    # HTML попадёт туда раньше своих чанков, посетитель получит страницу,
    # ссылающуюся на ещё не залитые скрипты, — и клиентскую ошибку вместо сайта.
    #
    # Поэтому сначала уезжают ассеты (имена у них с хэшем, старые остаются на
    # месте и продолжают обслуживать старый HTML), и только в конце — HTML.
    def priority(remote_path: str) -> int:
        # _next/static — сборка сайта, assets — сборка CRM на Vite. В обеих
        # именах файлов есть хэш, поэтому старые версии остаются на месте.
        if "/_next/static/" in remote_path or "/assets/" in remote_path:
            return 0
        if remote_path.endswith((".html", ".txt", ".xml")):
            return 2
        return 1

    uploads: list[tuple[int, str, str, str]] = []
    for root, _dirs, filenames in os.walk(LOCAL_ROOT):
        rel = os.path.relpath(root, LOCAL_ROOT).replace("\\", "/")
        remote_dir = REMOTE_ROOT if rel == "." else f"{REMOTE_ROOT}/{rel}"
        for name in sorted(filenames):
            remote_path = f"{remote_dir}/{name}"
            uploads.append(
                (priority(remote_path), remote_dir, os.path.join(root, name), name)
            )

    uploads.sort(key=lambda item: (item[0], item[1], item[3]))

    for _rank, remote_dir, local_path, name in uploads:
        remote_path = f"{remote_dir}/{name}"

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
