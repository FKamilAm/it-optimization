import { setRequestLocale } from "next-intl/server";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { HomePage } from "@/views/home-page";

export default function Page() {
  setRequestLocale(DEFAULT_LOCALE);
  return <HomePage locale={DEFAULT_LOCALE} />;
}
