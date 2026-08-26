/**
 * Посредник между сервером и Telegram Bot API.
 *
 * Зачем: из сети хостинга, где стоит наш сервер, до адресов api.telegram.org
 * нет маршрута — не отвечают ни 443, ни 80, ни 8443, то есть блокировка на
 * уровне адресов, а не портов. Изнутри сервера это не обходится ничем.
 * Cloudflare при этом доступен, поэтому запрос идёт через него.
 *
 * Разворачивается в Cloudflare Workers (бесплатного тарифа хватает с большим
 * запасом: у нас десятки запросов в минуту при лимите в сто тысяч в сутки).
 *
 * После развёртывания в server/.env меняется одна строка:
 *
 *   TELEGRAM_API_BASE=https://ваш-воркер.workers.dev
 *
 * Токен бота worker не хранит и не знает: он приходит в пути запроса, как
 * того требует Bot API, и просто передаётся дальше. Логировать путь здесь
 * нельзя — в нём токен.
 */

const TELEGRAM = "https://api.telegram.org";

export default {
  async fetch(request) {
    const incoming = new URL(request.url);

    // Пустой путь — проверка живости. Отвечаем, не беспокоя телеграм.
    if (incoming.pathname === "/" || incoming.pathname === "") {
      return new Response("ok", { status: 200 });
    }

    const target = TELEGRAM + incoming.pathname + incoming.search;

    // Заголовки передаются как есть, кроме Host: его подставит fetch сам,
    // иначе телеграм получит имя воркера и не узнает себя.
    const headers = new Headers(request.headers);
    headers.delete("host");

    try {
      const response = await fetch(target, {
        method: request.method,
        headers,
        body: request.method === "GET" || request.method === "HEAD" ? null : request.body,
        // Ответы Bot API кешировать нельзя: getUpdates возвращает разное на
        // одинаковый запрос, и кеш превратил бы бота в заевшую пластинку.
        cache: "no-store",
      });

      return new Response(response.body, {
        status: response.status,
        headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
      });
    } catch (cause) {
      // Ошибку возвращаем в форме Bot API, чтобы вызывающий код разбирал её
      // тем же путём, что и обычный отказ телеграма.
      return new Response(
        JSON.stringify({ ok: false, error_code: 502, description: String(cause) }),
        { status: 502, headers: { "content-type": "application/json" } },
      );
    }
  },
};
