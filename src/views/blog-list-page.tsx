import { SiteShell } from "@/components/layout/site-shell";
import { BlogList } from "@/components/blog/blog-list";
import type { Locale } from "@/i18n/config";
import { getAllPosts } from "@/lib/blog";

export async function BlogListPage({ locale }: { locale: Locale }) {
  // Статьи читает серверный компонент и передаёт вниз пропсами — клиент не
  // импортирует JSON, и источник данных однажды сможет стать базой.
  const posts = await getAllPosts(locale);

  return (
    <SiteShell>
      <BlogList posts={posts} />
    </SiteShell>
  );
}
