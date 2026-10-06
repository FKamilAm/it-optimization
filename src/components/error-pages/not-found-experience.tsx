"use client";

import { useEffect, useState } from "react";
import { ErrorScreen } from "./error-screen";
import type { ErrorHeaderProps } from "./error-header";

type Locale = "ru" | "en" | "es";

export interface NotFoundVariant {
  title: string;
  home: { label: string; href: string };
  header: ErrorHeaderProps;
}

interface NotFoundExperienceProps {
  variants: Record<Locale, NotFoundVariant>;
}

/**
 * Страница 404 целиком — на одном языке.
 *
 * 404.html один на весь сайт, и сервер не знает, с какого языка пришли.
 * Язык берётся из адреса (/en/… → английский, /es/… → испанский, остальное —
 * русский): скрипт в <head> ставит data-locale ещё до отрисовки, а здесь он
 * читается после гидрации. Отрисовывается только текущий язык — строки
 * остальных лежат данными, а не тремя блоками в разметке.
 *
 * До гидрации сервер отдаёт русскую версию; на /en/ и /es/ текст на эти
 * доли секунды скрыт (data-i18n-pending), чтобы не мелькал русский.
 */
export function NotFoundExperience({ variants }: NotFoundExperienceProps) {
  const [locale, setLocale] = useState<Locale>("ru");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const attr = document.documentElement.dataset.locale;
    if (attr === "en" || attr === "es") setLocale(attr);
    setReady(true);
  }, []);

  const v = variants[locale];

  return (
    <div data-i18n-pending={ready ? undefined : "true"} lang={locale}>
      <ErrorScreen code="404" title={v.title} home={v.home} header={v.header} />
    </div>
  );
}
