import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin/admin-panel";

/**
 * Case management panel. It ships inside the static export (so it can be opened
 * from any device) but holds no secrets: without a GitHub token pasted by the
 * owner it can only read this page's own markup. All writes go to the repo
 * through the GitHub API — see src/lib/admin/github.ts.
 *
 * Deliberately excluded from sitemap.ts and disallowed in robots.ts.
 */
export const metadata: Metadata = {
  title: "Панель кейсов",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPage() {
  return <AdminPanel />;
}
