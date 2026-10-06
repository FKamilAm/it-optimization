"use client";

import { useEffect, useState } from "react";
import { ErrorActions } from "../error-actions";
import { ErrorHeader, type ErrorHeaderProps } from "../error-header";
import { ModuleSocketScene, type SceneLinks } from "./module-socket-scene";

type Locale = "ru" | "en" | "es";

export interface NotFoundVariant {
  title: string;
  text: string;
  hint: string;
  home: string;
  restored: string;
  navHome: string;
  navServices: string;
  navProjects: string;
  header: ErrorHeaderProps;
  links: SceneLinks;
}

interface NotFoundExperienceProps {
  variants: Record<Locale, NotFoundVariant>;
}

/**
 * Страница 404 целиком: шапка, сцена с модулями и текст — на одном языке.
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
    <div
      className="e404-page text-foreground relative isolate min-h-svh overflow-hidden"
      data-i18n-pending={ready ? undefined : "true"}
      lang={locale}
    >
      <div
        className="e404-grid pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      <ErrorHeader {...v.header} />

      <ModuleSocketScene
        key={locale}
        labels={{
          restored: v.restored,
          home: v.navHome,
          services: v.navServices,
          projects: v.navProjects,
        }}
        links={v.links}
      />

      <main className="pointer-events-none absolute inset-x-0 bottom-0 z-30 pb-[max(2rem,5svh)]">
        <div className="container-premium">
          <div className="pointer-events-auto max-w-sm">
            <p className="font-display text-foreground/35 text-sm tracking-[0.3em]">
              404
            </p>
            <h1 className="heading-section mt-2">{v.title}</h1>
            <p className="text-foreground/70 mt-3 text-base leading-relaxed">
              {v.text} <span className="text-foreground/50">{v.hint}</span>
            </p>
            <div className="mt-6">
              <ErrorActions home={{ label: v.home, href: v.links.home }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
