import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { servicesPath } from "@/i18n/routes";
import { pageMetadata } from "@/views/page-metadata";
import { ServicesHub } from "@/views/services-hub";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    locale: DEFAULT_LOCALE,
    namespace: "servicesPage",
    path: servicesPath,
  });
}

export default function Page() {
  setRequestLocale(DEFAULT_LOCALE);
  return <ServicesHub locale={DEFAULT_LOCALE} />;
}
