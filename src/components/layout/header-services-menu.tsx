"use client";

import { type ComponentType, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Blocks,
  Briefcase,
  Building2,
  ChevronDown,
  ClipboardCheck,
  Code2,
  Contact,
  FileSearch,
  Globe,
  LayoutGrid,
  LayoutTemplate,
  Palette,
  PenTool,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Workflow,
} from "lucide-react";
import { TelegramIcon } from "@/components/icons/brand-icons";
import { SERVICE_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Per-service glyph for the dropdown rows (mirrors the homepage service cards).
const SERVICE_ICON: Record<string, ComponentType<{ className?: string }>> = {
  corporate: Building2,
  websites: LayoutTemplate,
  websiteTurnkey: Globe,
  ecommerce: ShoppingCart,
  businessCard: Contact,
  webDesign: PenTool,
  branding: Palette,
  b2b: Briefcase,
  telegram: TelegramIcon,
  mobile: Smartphone,
  ai: Sparkles,
  integrations: Workflow,
  blockchain: Blocks,
  support: ShieldCheck,
  contentAnalysis: FileSearch,
  techContent: Code2,
  commercialAudit: ClipboardCheck,
  platforms: LayoutGrid,
};

interface HeaderServicesMenuProps {
  /** True while the fullscreen menu is open (header sits on a dark surface). */
  dark: boolean;
  onNavigate?: () => void;
}

export function HeaderServicesMenu({ dark, onNavigate }: HeaderServicesMenuProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  // Small close delay so a diagonal cursor move from the trigger into the panel
  // doesn't collapse the menu mid-hover.
  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  const handleNavigate = () => {
    setOpen(false);
    onNavigate?.();
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 text-base transition-colors duration-300",
          dark
            ? "text-white/70 hover:text-white"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {t("services.label")}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-300",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {/* Panel. The pt-3 padding is a hover bridge: it keeps the gap between the
          trigger and the card hoverable so the menu never flickers. */}
      <div
        className={cn(
          "absolute top-full left-1/2 z-50 -translate-x-1/2 pt-3 transition-[opacity,transform] duration-200 ease-out",
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-1 opacity-0",
        )}
      >
        <div className="border-border bg-background w-[680px] max-w-[92vw] overflow-hidden rounded-2xl border p-2 shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
          <ul className="grid grid-cols-2 gap-x-2">
            {SERVICE_NAV.map(({ key, slug }) => {
              const Icon = SERVICE_ICON[key];
              return (
                <li key={key}>
                  <Link
                    href={`/uslugi/${slug}/`}
                    onClick={handleNavigate}
                    className="group hover:bg-muted focus-visible:outline-accent flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <span className="border-border bg-muted text-muted-foreground group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200">
                      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    <span className="text-foreground flex-1 text-sm">
                      {t(`services.items.${key}.title`)}
                    </span>
                    <ArrowRight
                      className="text-muted-foreground group-hover:text-foreground h-4 w-4 shrink-0 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Ведёт на страницу-каталог, а не на якорь #services главной: под
              этой подписью человек ждёт полный список, а не блок на главной. */}
          <Link
            href="/uslugi/"
            onClick={handleNavigate}
            className="border-border text-foreground hover:border-accent hover:bg-accent-muted focus-visible:outline-accent mt-1 flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-base font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {t("services.allServices")}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
