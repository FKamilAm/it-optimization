import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { projectsPath } from "@/i18n/routes";
import { pageMetadata } from "@/views/page-metadata";
import { ProjectsPage } from "@/views/projects-page";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    locale: DEFAULT_LOCALE,
    namespace: "projectsPage",
    path: projectsPath,
  });
}

export default function Page() {
  setRequestLocale(DEFAULT_LOCALE);
  return <ProjectsPage locale={DEFAULT_LOCALE} />;
}
