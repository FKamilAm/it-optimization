#!/usr/bin/env bash
# Записать GITHUB_TOKEN в server/.env и перезапустить API.
#
# Токен вводится с клавиатуры и не отображается: он не попадает ни в аргументы
# команды, ни в историю shell, ни в логи.
#
#   ssh -i КЛЮЧ root@СЕРВЕР -t "bash /opt/it-optimization/server/scripts/set-github-token.sh"
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Нет файла .env — сначала разверни сервис (см. docs/deploy.md)" >&2
  exit 1
fi

printf 'Вставь GitHub-токен (ввод не отображается): '
read -rs TOKEN
printf '\n'

if [ -z "$TOKEN" ]; then
  echo "Пустой токен, ничего не менял" >&2
  exit 1
fi

# Fine-grained токены начинаются с github_pat_, классические — с ghp_.
case "$TOKEN" in
  github_pat_*|ghp_*) ;;
  *) echo "Предупреждение: непохоже на токен GitHub, но записываю как есть" >&2 ;;
esac

# Экранируем спецсимволы для sed и не даём токену утечь в вывод.
ESCAPED=$(printf '%s' "$TOKEN" | sed -e 's/[\/&]/\\&/g')
if grep -q '^GITHUB_TOKEN=' .env; then
  sed -i "s/^GITHUB_TOKEN=.*/GITHUB_TOKEN=$ESCAPED/" .env
else
  printf 'GITHUB_TOKEN=%s\n' "$TOKEN" >> .env
fi
chmod 600 .env
unset TOKEN ESCAPED

echo "Токен записан. Перезапускаю API…"
docker compose -f docker-compose.prod.yml up -d api >/dev/null 2>&1

for i in $(seq 1 20); do
  sleep 3
  if curl -sf -m 5 http://127.0.0.1:4000/health >/dev/null 2>&1 \
     || docker compose -f docker-compose.prod.yml ps api | grep -q healthy; then
    echo "API поднялся. Публикация включена."
    exit 0
  fi
done

echo "API не ответил за минуту — посмотри логи:" >&2
echo "  docker compose -f docker-compose.prod.yml logs --tail=30 api" >&2
exit 1
