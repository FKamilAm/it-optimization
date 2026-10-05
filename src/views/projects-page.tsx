import { SiteShell } from "@/components/layout/site-shell";
import { ProjectsContent } from "@/components/projects/projects-content";
import type { Locale } from "@/i18n/config";
import { getAllCases } from "@/lib/cases";

export async function ProjectsPage({ locale: _locale }: { locale: Locale }) {
  const cases = await getAllCases();

  return (
    <SiteShell>
      <ProjectsContent cases={cases} />
    </SiteShell>
  );
}
