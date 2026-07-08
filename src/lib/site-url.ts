/** Canonical public site URL used for SEO metadata and structured data. */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://it-optimization.ru";
}
