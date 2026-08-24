import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin/admin-panel";

/**
 * Панель управления контентом сайта — кейсы и блог. Едет внутри статического
 * экспорта, поэтому открывается с любого устройства, но сама по себе ничего не
 * хранит: без входа
 * (пароль или токен, в зависимости от режима — см. src/lib/admin/auth.ts) она
 * умеет только показать эту разметку.
 *
 * Адрес намеренно не /admin: на shared-хостинге reg.ru этот путь занят и
 * отдаёт 500. Страница исключена из sitemap.ts и закрыта в robots.ts.
 */
export const metadata: Metadata = {
  title: "Панель сайта",
  robots: { index: false, follow: false, nocache: true },
};

export default function PanelPage() {
  return <AdminPanel />;
}
