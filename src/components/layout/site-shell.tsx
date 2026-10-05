"use client";

import type { ReactNode } from "react";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { ContactModalProvider } from "@/components/providers/contact-modal-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FloatingContact } from "@/components/layout/floating-contact";
import { SkipLink } from "@/components/layout/skip-link";
import { usePaths } from "@/i18n/use-paths";
import { SITE } from "@/lib/constants";

/**
 * Рамка подстраниц (каталог услуг, страница услуги, проекты, блог):
 * провайдеры, шапка, подвал, плавающая кнопка связи. Главная строит свою
 * рамку в page.tsx и этот компонент не использует — она владеет прелоадером.
 *
 * `sectionPrefix` — это адрес главной, к которому шапка приписывает якоря
 * разделов: «Процесс» на подстранице превращается в «<главная>#process».
 * Поэтому он обязан быть главной нужного языка, а не «/»: иначе с
 * /en/services/… пункт меню уводит на русскую главную. Ровно так и было.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const companyName = SITE.name;
  const paths = usePaths();

  return (
    <SmoothScrollProvider>
      <ContactModalProvider>
        <SkipLink />
        <Header companyName={companyName} sectionPrefix={paths.home} />
        <main id="main">{children}</main>
        <Footer companyName={companyName} />
        <FloatingContact />
      </ContactModalProvider>
    </SmoothScrollProvider>
  );
}
