#!/usr/bin/env bash
# Первичная настройка чистого VPS под API панели.
# Ubuntu 22.04 / 24.04, запускать от root:
#
#   bash server/scripts/setup-server.sh
#
# Скрипт идемпотентный: повторный запуск ничего не ломает.
set -euo pipefail

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m[!] %s\033[0m\n' "$*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Запускай от root: sudo bash $0" >&2
  exit 1
fi

log "Обновляю пакеты"
export DEBIAN_FRONTEND=noninteractive
# Ubuntu 24.04 иначе спрашивает про перезапуск служб и вешает неинтерактивный
# запуск, а заодно рвёт SSH-сессию посреди обновления.
export NEEDRESTART_MODE=a
export NEEDRESTART_SUSPEND=1
apt-get update -qq
apt-get upgrade -y -qq

log "Ставлю базовые пакеты"
apt-get install -y -qq ca-certificates curl gnupg git ufw

if ! command -v docker >/dev/null 2>&1; then
  log "Ставлю Docker из официального репозитория"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin
else
  log "Docker уже установлен: $(docker --version)"
fi

systemctl enable --now docker

log "Настраиваю файрвол"
# Порядок важен: сначала разрешаем SSH, потом включаем ufw, иначе можно
# отрезать себе доступ к серверу.
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose

# База наружу не публикуется вовсе (см. docker-compose.prod.yml), поэтому
# отдельного правила для 5432 нет и быть не должно.

if [ ! -f /swapfile ] && [ "$(free -m | awk '/^Mem:/{print $2}')" -lt 2048 ]; then
  log "Меньше 2 ГБ памяти — добавляю swap 2G, чтобы сборка образа не падала"
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

log "Готово"
cat <<'NEXT'

Дальше:

  1. git clone https://github.com/FKamilAm/it-optimization.git /opt/it-optimization
  2. cd /opt/it-optimization/server
  3. cp .env.production.example .env  &&  nano .env
     — пароль базы:  openssl rand -base64 24
     — GITHUB_TOKEN пока оставь пустым
  4. Убедись, что A-запись API_DOMAIN уже указывает на этот сервер:
       dig +short api.it-optimization.ru
  5. docker compose -f docker-compose.prod.yml up -d --build
  6. docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
  7. docker compose -f docker-compose.prod.yml exec api npm run seed
  8. docker compose -f docker-compose.prod.yml exec -it api npm run user:create -- you@example.com owner

Проверка:  curl https://api.it-optimization.ru/health

NEXT
