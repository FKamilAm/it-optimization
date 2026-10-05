import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, PREFIXED_LOCALES } from "@/i18n/config";

/**
 * Автовыбор языка по языку браузера.
 *
 * Делается скриптом в браузере, а не на сервере, и выбора тут нет: сайт —
 * статический экспорт без рантайма, а хостинг отдаёт файлы через nginx, где
 * `.htaccess` не читается. Значит ни middleware, ни редирект по
 * `Accept-Language` на стороне сервера невозможны.
 *
 * Важно, чего скрипт НЕ делает:
 *
 * - не трогает того, кто уже выбрал язык руками. Переключатель пишет выбор в
 *   localStorage, и дальше автоопределение молчит навсегда — иначе человек,
 *   нарочно открывший русскую версию с испанского ноутбука, не смог бы на ней
 *   остаться;
 * - не срабатывает дважды. Отметка ставится при первом же заходе, даже если
 *   язык совпал с русским, — иначе каждый переход по сайту заново решал бы
 *   судьбу посетителя;
 * - не перекидывает поисковых роботов. Им полагается видеть русскую версию в
 *   корне, а про остальные они узнают из hreflang. Редирект по языку
 *   браузера поисковики не любят и могут не проиндексировать то, что за ним.
 *
 * Раскладку клавиатуры определить нельзя — браузер её не отдаёт. Доступен
 * только язык интерфейса (`navigator.languages`), и это именно он.
 */

// Скрипт выполняется до отрисовки, поэтому он маленький и без зависимостей.
// Любая ошибка внутри не должна мешать странице открыться — отсюда try/catch
// вокруг всего: приватный режим умеет бросать прямо на чтении localStorage.
//
// Комментарии внутри — только блочные: перед отправкой скрипт склеивается в
// одну строку, и строчный «//» закомментировал бы всё, что идёт после него.
// Ровно так и было: с первого же комментария скрипт превращался в пустышку, и
// автоопределение на живом сайте не срабатывало ни разу. Сами комментарии
// вырезаются при склейке — в каждую русскую страницу они не едут.
const script = `
(function(){
  try {
    var PREFIXES = ${JSON.stringify(PREFIXED_LOCALES)};
    var KEY = ${JSON.stringify(LOCALE_STORAGE_KEY)};
    var path = location.pathname;

    /* Уже на языковой версии — ничего не решаем. */
    for (var i = 0; i < PREFIXES.length; i++) {
      if (path === '/' + PREFIXES[i] || path.indexOf('/' + PREFIXES[i] + '/') === 0) return;
    }

    /* Панель — внутренний инструмент, её незачем переводить и переносить. */
    if (path.indexOf('/panel') === 0) return;

    /* Робот: пусть индексирует корень как русскую версию. */
    if (/bot|crawl|spider|yandex|google|bing|duckduck|slurp|facebookexternalhit/i.test(navigator.userAgent)) return;

    /* Адрес этой же страницы на другом языке берётся из hreflang в <head>.
       Приписать префикс к русскому адресу нельзя: у разделов и страниц свои
       слуги в каждом языке, и «/en» + «/uslugi/…» — это 404. Ссылки стоят в
       <head> раньше скрипта, так что к его запуску они уже разобраны. Нет
       ссылки — у страницы нет перевода (например, это 404), и уводить с неё
       некуда. */
    function go(locale) {
      var link = document.querySelector('link[rel="alternate"][hreflang="' + locale + '"]');
      if (!link) return;
      var target = new URL(link.href).pathname;
      if (target !== path) location.replace(target + location.search + location.hash);
    }

    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) {}

    /* Выбор уже сделан — он главнее языка браузера. */
    if (stored) {
      if (PREFIXES.indexOf(stored) !== -1) go(stored);
      return;
    }

    var langs = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || ''];

    var match = null;
    for (var j = 0; j < langs.length && !match; j++) {
      var tag = String(langs[j]).toLowerCase();
      /* Русский встретился раньше прочих — остаёмся здесь. */
      if (tag === 'ru' || tag.indexOf('ru-') === 0) break;
      for (var k = 0; k < PREFIXES.length; k++) {
        if (tag === PREFIXES[k] || tag.indexOf(PREFIXES[k] + '-') === 0) {
          match = PREFIXES[k];
          break;
        }
      }
    }

    /* Решение принимается один раз, каким бы оно ни было. */
    try { localStorage.setItem(KEY, match || ${JSON.stringify(DEFAULT_LOCALE)}); } catch (e) {}

    if (match) go(match);
  } catch (e) {}
})();
`
  .trim()
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\n\s*/g, "");

export function LocaleRedirect() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
