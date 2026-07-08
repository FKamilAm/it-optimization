# Айти-Оптимизация — сайт

Одностраничный сайт IT-компании «Айти-Оптимизация». Русскоязычный маркетинговый лендинг без backend: заявки собираются не через форму, а через прямые переходы в мессенджеры (Telegram, WhatsApp, MAX), телефон и почту.

## Стек

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS 4
- next-intl (один язык — RU, как каталог строк)
- Framer Motion, GSAP + ScrollTrigger, Lenis (анимации и плавный скролл)
- three.js / react-three-fiber (3D-логотип в баннере, подгружается только на десктопе)

## Локальный запуск

```bash
npm install
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000).

## Скрипты

- `npm run dev` — режим разработки
- `npm run build` — production-сборка
- `npm run start` — запуск production-сборки (Node.js)
- `npm run lint` — ESLint

## Переменные окружения

Скопировать `.env.example` в `.env.local` и заполнить. Все переменные публичные (`NEXT_PUBLIC_*`) — секретов в проекте нет.

- `NEXT_PUBLIC_SITE_URL` — адрес сайта (для canonical / OpenGraph)
- `NEXT_PUBLIC_CONTACT_EMAIL` — почта
- `NEXT_PUBLIC_CONTACT_PHONE` — телефон для кнопки «Телефон»
- `NEXT_PUBLIC_TELEGRAM_URL` — ссылка на Telegram
- `NEXT_PUBLIC_WHATSAPP_URL` — ссылка на WhatsApp
- `NEXT_PUBLIC_MAX_URL` — ссылка на профиль MAX

## Деплой

Сайт статический (нет API-роутов и серверных данных), поэтому его можно собрать в статику
(`output: "export"`, папка `out/`) и разместить на обычном хостинге, либо запускать как
Node.js-приложение через `npm run build && npm run start`.
