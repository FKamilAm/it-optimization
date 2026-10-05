import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { privacyPath } from "@/i18n/routes";
import { pageMetadata } from "@/views/page-metadata";
import { PrivacyPage } from "@/views/privacy-page";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    locale: DEFAULT_LOCALE,
    namespace: "privacyPage",
    path: privacyPath,
  });
}

export default function Page() {
  setRequestLocale(DEFAULT_LOCALE);
  return <PrivacyPage locale={DEFAULT_LOCALE} />;
}
