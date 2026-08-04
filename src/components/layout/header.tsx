"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { FullscreenMenu } from "@/components/layout/fullscreen-menu";
import { HeaderServicesMenu } from "@/components/layout/header-services-menu";
import { Logo } from "@/components/layout/logo";
import { useContactModal } from "@/components/providers/contact-modal-provider";
import { AnchorLink } from "@/components/ui/anchor-link";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface HeaderProps {
  companyName: string;
  /**
   * Prefix for section anchor links. Empty on the homepage (smooth-scroll to
   * "#services"); "/" on subpages so links become "/#services" and navigate home.
   */
  sectionPrefix?: string;
}

export function Header({ companyName, sectionPrefix = "" }: HeaderProps) {
  const t = useTranslations();
  const { openContactModal } = useContactModal();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflowY = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflowY = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 transition-colors duration-500 ease-out",
          menuOpen ? "bg-surface z-[110]" : "bg-background z-50",
        )}
      >
        <div className="container-premium relative flex h-[72px] items-center md:h-20">
          <AnchorLink
            href={sectionPrefix ? "/" : "#home"}
            className="relative z-10 shrink-0"
            aria-label={t("a11y.logo")}
            onClick={() => setMenuOpen(false)}
          >
            <Logo
              companyName={companyName}
              className={cn(
                "transition-[filter] duration-500",
                menuOpen && "brightness-0 invert",
              )}
            />
          </AnchorLink>

          <nav
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 xl:flex"
            aria-label={t("a11y.mainNav")}
          >
            <AnchorLink
              href={`${sectionPrefix}${NAV_ITEMS[1].href}`}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "cursor-pointer text-base transition-colors duration-300",
                menuOpen
                  ? "text-white/70 hover:text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`nav.${NAV_ITEMS[1].key}`)}
            </AnchorLink>

            <HeaderServicesMenu dark={menuOpen} onNavigate={() => setMenuOpen(false)} />

            <Link
              href="/proekty/"
              onClick={() => setMenuOpen(false)}
              className={cn(
                "cursor-pointer text-base transition-colors duration-300",
                menuOpen
                  ? "text-white/70 hover:text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("nav.projects")}
            </Link>

            <Link
              href="/blog/"
              onClick={() => setMenuOpen(false)}
              className={cn(
                "cursor-pointer text-base transition-colors duration-300",
                menuOpen
                  ? "text-white/70 hover:text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("nav.blog")}
            </Link>
          </nav>

          <div className="relative z-10 ml-auto flex items-center gap-3 md:gap-4">
            <Button
              variant={menuOpen ? "inverse" : "primary"}
              size="sm"
              showArrow
              className="hidden md:inline-flex"
              onClick={() => {
                setMenuOpen(false);
                openContactModal();
              }}
            >
              {t("nav.cta")}
            </Button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className={cn(
                "menu-icon-button border-border hover:bg-muted focus-visible:outline-accent cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2",
                menuOpen &&
                  "bg-surface text-surface-foreground border-white/15 hover:bg-white/10",
              )}
              aria-label={menuOpen ? t("menu.close") : t("a11y.openMenu")}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <FullscreenMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        companyName={companyName}
        sectionPrefix={sectionPrefix}
      />
    </>
  );
}
