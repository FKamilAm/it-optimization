import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

/**
 * Каталог строк для текущей локали.
 *
 * Локаль берётся из `setRequestLocale()`, который страница вызывает первым
 * делом, а не из `requestLocale`. Разница принципиальная: `requestLocale`
 * читает заголовок запроса, а любое обращение к заголовкам делает маршрут
 * динамическим — и статический экспорт падает с «Route … couldn't be rendered
 * statically because it used `headers`». Проверено: именно так сборка и
 * ломается, если понадеяться на заголовок.
 *
 * Пока маршрутов с сегментом локали нет, `setRequestLocale()` никто не
 * вызывает, и сюда приходит пустое значение — тогда язык русский. Это и есть
 * сегодняшнее поведение сайта, менять его до появления `/en/` и `/es/` незачем.
 */
export default getRequestConfig(async ({ locale: requested }) => {
  const locale: Locale =
    requested && isLocale(requested) ? (requested as Locale) : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
