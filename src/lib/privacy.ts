import ru from "../../content/privacy.json";
import en from "../../content/translations/privacy.en.json";
import es from "../../content/translations/privacy.es.json";
import { DEFAULT_LOCALE, LOCALE_OG, type Locale } from "@/i18n/config";
import { formatPostDate } from "@/lib/blog/types";

/**
 * Политика конфиденциальности на нужном языке.
 *
 * Переводы — целые документы, а не наложение полей, как у услуг: у политики
 * нет идентификаторов и цен, которые были бы общими для всех языков, — это
 * сплошной текст. Общая у всех версий только дата редакции, и она берётся из
 * русского файла: перевод не бывает новее оригинала, а вторая копия даты
 * однажды разошлась бы с первой.
 *
 * Только для серверных компонентов: тексты всех трёх языков не должны уезжать
 * в браузер.
 */

export type PrivacyBlock =
  { type: "p"; text: string } | { type: "list"; items: string[] };

export interface PrivacySection {
  heading: string;
  blocks: PrivacyBlock[];
}

interface PrivacyTranslation {
  /** Оговорка «это перевод, при расхождении действует русский текст». */
  notice: string;
  sections: PrivacySection[];
}

export const PRIVACY_TRANSLATIONS: Partial<Record<Locale, PrivacyTranslation>> = {
  en: en as PrivacyTranslation,
  es: es as PrivacyTranslation,
};

export interface PrivacyDocument {
  updatedAt: string;
  /** Дата редакции, как её читают на этом языке. */
  updatedLabel: string;
  notice?: string;
  sections: PrivacySection[];
}

/** Перевода нет — отдаётся русский текст: пустая страница хуже непереведённой. */
export function getPrivacy(locale: Locale): PrivacyDocument {
  const translation =
    locale === DEFAULT_LOCALE ? undefined : PRIVACY_TRANSLATIONS[locale];

  return {
    updatedAt: ru.updatedAt,
    updatedLabel: translation
      ? formatDate(ru.updatedAt, locale)
      : formatPostDate(ru.updatedAt),
    notice: translation?.notice,
    sections: translation?.sections ?? (ru.sections as PrivacySection[]),
  };
}

// «September 3, 2026», «3 de septiembre de 2026». Русская дата идёт через
// formatPostDate, как в блоге: Intl дописал бы к ней «г.».
function formatDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_OG[locale].replace("_", "-"), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}
