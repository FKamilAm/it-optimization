"use client";

import { useTranslations } from "next-intl";

/**
 * Accessibility skip link. Kept fully off-screen until keyboard focus
 * (`:focus-visible`) so it never shows as a floating pill on load/click.
 */
export function SkipLink() {
  const t = useTranslations("a11y");

  return (
    <a
      href="#main"
      className="fixed left-4 top-4 z-[200] -translate-y-[120%] rounded-full bg-foreground px-4 py-2 text-sm text-background opacity-0 outline-none transition-[opacity,transform] duration-150 focus-visible:translate-y-0 focus-visible:opacity-100"
    >
      {t("skipToContent")}
    </a>
  );
}
