/**
 * Услуги сайта: ключ и короткое название.
 *
 * Копия таксономии из `src/lib/constants.ts` (SERVICE_PAGES) и подписей из
 * `messages/ru.json` (servicePages.<key>.breadcrumb). Копия, а не импорт:
 * сайт и CRM — два отдельных приложения со своими сборками, общий модуль
 * потребовал бы монорепо-воркспейс ради восемнадцати строк.
 *
 * Расхождение не ломает CRM: ключ хранится строкой, а неизвестное значение
 * показывается как есть. Но при добавлении услуги на сайт список стоит
 * пополнить и здесь — иначе выбрать её при заведении лида будет нельзя.
 */
export const SERVICES = [
  { key: "corporate", label: "Корпоративный сайт" },
  { key: "websites", label: "Лендинг под ключ" },
  { key: "websiteTurnkey", label: "Веб-сайт под ключ" },
  { key: "ecommerce", label: "Интернет-магазин" },
  { key: "businessCard", label: "Сайт-визитка" },
  { key: "webDesign", label: "Веб-дизайн системы" },
  { key: "branding", label: "Дизайн и брендинг" },
  { key: "b2b", label: "Сайт для b2b" },
  { key: "telegram", label: "Telegram-боты и Mini Apps" },
  { key: "mobile", label: "Мобильные приложения" },
  { key: "ai", label: "AI-агенты и автоматизация" },
  { key: "integrations", label: "Парсинг и интеграции" },
  { key: "blockchain", label: "Crypto / Blockchain" },
  { key: "support", label: "IT-сопровождение" },
  { key: "platforms", label: "Разработка CRM-платформы" },
  { key: "contentAnalysis", label: "Анализ контента сайта" },
  { key: "techContent", label: "Технический контент" },
  { key: "commercialAudit", label: "Коммерческий аудит" },
] as const;

const BY_KEY = new Map<string, string>(SERVICES.map((item) => [item.key, item.label]));

/** Название услуги; незнакомый ключ возвращается как есть, а не теряется. */
export function serviceLabel(key: string | null): string {
  if (!key) return "";
  return BY_KEY.get(key) ?? key;
}
