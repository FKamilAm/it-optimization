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

HOST = os.environ.get("FTP_HOST", "31.31.197.28")
PORT = int(os.environ.get("FTP_PORT", "21"))
USER = os.environ.get("FTP_USER", "u3568260")
PASSWORD = os.environ.get("FTP_PASSWORD", "")
PROJECT_ROOT = Path(__file__).resolve().parents[1]
LOCAL_ROOT = PROJECT_ROOT / os.environ.get("FTP_LOCAL_ROOT", "out")
REMOTE_ROOT = os.environ.get("FTP_REMOTE_ROOT", "/www/it-optimization.ru").rstrip("/")
TIMEOUT = 60
RETRIES = 5

# Разделы, где страницы рождаются из данных: статьи блога и страницы услуг на
# трёх языках. Удалили статью в панели или сменили ей адрес — её папка пропала
# из сборки, но на хостинге осталась бы навсегда и продолжала отвечать 200:
# заливка только перезаписывает файлы и ничего не удаляет. Поэтому после
# заливки в этих разделах убирается всё, чего нет в свежей сборке.
#
# Только эти разделы и только на один уровень вглубь: остальное на хостинге
# (файлы подтверждения поисковиков, загруженные руками документы) скрипт не
# знает и не трогает. У CRM своих таких разделов нет, поэтому список по
# умолчанию действует только для сборки сайта.
SITE_PRUNE_DIRS = "blog,en/blog,es/blog,uslugi,en/services,es/servicios"
PRUNE_DIRS = [
    d.strip("/")
    for d in os.environ.get(
        "FTP_PRUNE_DIRS", SITE_PRUNE_DIRS if "FTP_LOCAL_ROOT" not in os.environ else ""
    ).split(",")
    if d.strip("/")
]


def connect() -> FTP:
    ftp = FTP(timeout=TIMEOUT)
    ftp.connect(HOST, PORT)
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


def reconnect(ftp: FTP) -> FTP:
    try:
        ftp.close()
    except Exception:  # noqa: BLE001
        pass
    time.sleep(2)
    return connect()


def list_dir(ftp: FTP, path: str) -> list[tuple[str, bool]]:
    """Entries of a remote directory as (name, is_dir)."""
    try:
        return [
            (name, facts.get("type") == "dir")
            for name, facts in ftp.mlsd(path, facts=["type"])
            if facts.get("type") in ("dir", "file")
        ]
    except error_perm as exc:
        # 550 — папки нет; 500/502 — сервер не знает MLSD, тогда ниже NLST.
        if str(exc).startswith("550"):
            raise
    entries: list[tuple[str, bool]] = []
    for item in ftp.nlst(path):
        name = item.rstrip("/").rsplit("/", 1)[-1]
        if name in (".", ".."):
            continue
        try:
            ftp.cwd(f"{path}/{name}")
            entries.append((name, True))
        except error_perm:
            entries.append((name, False))
    return entries


def remove_tree(ftp: FTP, path: str) -> None:
    for name, is_dir in list_dir(ftp, path):
        child = f"{path}/{name}"
        if is_dir:
            remove_tree(ftp, child)
        else:
            ftp.delete(child)
    ftp.rmd(path)


def prune(ftp: FTP) -> tuple[FTP, int, int]:
    """Remove from PRUNE_DIRS whatever the fresh build no longer has."""
    removed = failed = 0
    for section in PRUNE_DIRS:
        local_dir = LOCAL_ROOT / section
        if not local_dir.is_dir():
            # Раздела нет в сборке — это скорее сломанная сборка или опечатка
            # в списке, чем желание удалить раздел целиком. Не трогаем.
            print(f"::warning::prune skipped, not in build: {section}")
            continue
        local = {p.name for p in local_dir.iterdir()}
        remote_dir = f"{REMOTE_ROOT}/{section}"

        entries: list[tuple[str, bool]] | None = None
        for attempt in range(1, RETRIES + 1):
            try:
                entries = list_dir(ftp, remote_dir)
                break
            except error_perm:
                entries = []  # раздела на хостинге ещё нет — убирать нечего
                break
            except Exception as exc:  # noqa: BLE001
                print(f"list retry {attempt} {remote_dir}: {exc}", file=sys.stderr)
                ftp = reconnect(ftp)
        if entries is None:
            print(f"::warning::could not list {remote_dir}")
            failed += 1
            continue

        for name, is_dir in entries:
            if name in local:
                continue
            target = f"{remote_dir}/{name}"
            for attempt in range(1, RETRIES + 1):
                try:
                    if is_dir:
                        remove_tree(ftp, target)
                    else:
                        ftp.delete(target)
                    removed += 1
                    print(f"removed: {target}")
                    break
                except error_perm as exc:
                    # Отказ сервера повтором не лечится.
                    print(f"::warning::could not remove {target}: {exc}")
                    failed += 1
                    break
                except Exception as exc:  # noqa: BLE001
                    print(f"remove retry {attempt} {target}: {exc}", file=sys.stderr)
                    ftp = reconnect(ftp)
            else:
                print(f"::warning::could not remove {target}")
                failed += 1
    return ftp, removed, failed


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

    # После заливки, а не до: новые страницы уже на месте, и между удалением
    # старой и появлением новой нет окна, в котором адрес отвечал бы 404.
    # Неудача здесь сайт не ломает — устаревшие страницы просто доживут до
    # следующего деплоя, поэтому это предупреждение, а не провал.
    if PRUNE_DIRS:
        ftp, removed, failed = prune(ftp)
        print(f"pruned: {removed} stale entries" + (f", {failed} failed" if failed else ""))

    try:
        ftp.quit()
    except Exception:  # noqa: BLE001
        ftp.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
