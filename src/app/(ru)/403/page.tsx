import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { ForbiddenPage, forbiddenMetadata } from "@/views/forbidden-page";

export async function generateMetadata(): Promise<Metadata> {
  return forbiddenMetadata(DEFAULT_LOCALE);
}

export default function Page() {
  setRequestLocale(DEFAULT_LOCALE);
  return <ForbiddenPage locale={DEFAULT_LOCALE} />;
}
