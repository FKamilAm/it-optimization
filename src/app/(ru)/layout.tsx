import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { buildRootMetadata, RootShell } from "@/views/root-shell";

/**
 * Корневой макет русской версии. Она живёт в корне сайта без префикса:
 * адреса уже проиндексированы, а перенести их под `/ru/` нельзя — редирект
 * делать нечем, хостинг отдаёт статику через nginx.
 *
 * Оболочка общая с `(intl)`, см. `views/root-shell.tsx`.
 */

export async function generateMetadata(): Promise<Metadata> {
  return buildRootMetadata(DEFAULT_LOCALE);
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Обязательно до любого обращения к строкам: иначе next-intl полезет за
  // локалью в заголовки запроса, а это делает маршрут динамическим и роняет
  // статический экспорт.
  setRequestLocale(DEFAULT_LOCALE);

  return <RootShell locale={DEFAULT_LOCALE}>{children}</RootShell>;
}
