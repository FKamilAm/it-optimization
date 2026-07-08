"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { FullscreenMenu } from "@/components/layout/fullscreen-menu";
import { Logo } from "@/components/layout/logo";
import { useContactModal } from "@/components/providers/contact-modal-provider";
import { AnchorLink } from "@/components/ui/anchor-link";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface HeaderProps {
  companyName: string;
}

export function Header({ companyName }: HeaderProps) {
  const t = useTranslations();
  const { openContactModal } = useContactModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          "fixed inset-x-0 top-0 transition-[background-color,backdrop-filter] duration-500",
          menuOpen ? "z-[110]" : "z-50",
          scrolled && !menuOpen
            ? "bg-background/85 backdrop-blur-xl"
            : "bg-transparent",
        )}
      >
        <div className="container-premium relative flex h-[72px] items-center md:h-20">
          <AnchorLink
            href="#home"
            className={cn(
              "relative z-10 shrink-0",
              menuOpen && "pointer-events-none invisible",
            )}
            aria-label={t("a11y.logo")}
          >
            <Logo companyName={companyName} />
          </AnchorLink>

          <nav
            className={cn(
              "absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 xl:flex",
              menuOpen && "pointer-events-none invisible",
            )}
            aria-label={t("a11y.mainNav")}
          >
            {NAV_ITEMS.slice(1, 5).map((item) => (
              <AnchorLink
                key={item.key}
                href={item.href}
                className="cursor-pointer text-base text-muted-foreground transition-colors duration-300 hover:text-foreground"
              >
                {t(`nav.${item.key}`)}
              </AnchorLink>
            ))}
          </nav>

          <div className="relative z-10 ml-auto flex items-center gap-3 md:gap-4">
            <Button
              variant="primary"
              size="sm"
              className={cn("hidden md:inline-flex", menuOpen && "pointer-events-none invisible")}
              onClick={() => openContactModal()}
            >
              {t("nav.cta")}
            </Button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className={cn(
                "menu-icon-button cursor-pointer border-border hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                menuOpen &&
                  "border-white/15 bg-surface text-surface-foreground hover:bg-white/10",
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
      />
    </>
  );
}
