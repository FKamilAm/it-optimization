"use client";

import { ArrowLeft } from "lucide-react";
import { ButtonContent, buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorActionsProps {
  home: { label: string; href: string };
  /** Вторая ссылка: адрес или «назад» по истории браузера. Необязательна. */
  secondary?: { label: string; href?: string; back?: boolean };
  dark?: boolean;
}

/**
 * Кнопки страниц ошибок: главная — фирменной кнопкой, вторая — тихой ссылкой.
 *
 * «Назад» идёт по истории браузера, а если истории нет (страницу открыли по
 * прямой ссылке в новой вкладке) — на главную: кнопка, которая ничего не
 * делает, хуже кнопки, которая ведёт не совсем туда.
 */
export function ErrorActions({ home, secondary, dark = false }: ErrorActionsProps) {
  // Второе действие — такая же крупная кнопка, только контурная: «Назад»
  // на 403 — полноценный выход, а не мелкая ссылка.
  const secondaryClass = cn(
    "inline-flex h-14 cursor-pointer items-center justify-center gap-2 rounded-full border px-8 text-base font-medium transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2",
    dark
      ? "border-white/25 text-white hover:border-[#b4e02d] hover:text-[#b4e02d] focus-visible:outline-[#b4e02d]"
      : "border-foreground/20 text-foreground hover:border-foreground focus-visible:outline-accent",
  );

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
      <a
        href={home.href}
        data-cursor="dark"
        className={buttonClassName(dark ? "inverse" : "primary", "lg")}
      >
        <ButtonContent variant={dark ? "inverse" : "primary"} showArrow>
          {home.label}
        </ButtonContent>
      </a>
      {secondary?.back ? (
        <button
          type="button"
          className={secondaryClass}
          onClick={() => {
            if (window.history.length <= 1) {
              window.location.href = home.href;
              return;
            }
            // Назад может не сработать (страница — первая в своей вкладке
            // после перехода из другого окна): тогда — на главную.
            const here = window.location.href;
            window.history.back();
            window.setTimeout(() => {
              if (window.location.href === here) window.location.href = home.href;
            }, 600);
          }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {secondary.label}
        </button>
      ) : secondary ? (
        <a href={secondary.href} className={secondaryClass}>
          {secondary.label}
        </a>
      ) : null}
    </div>
  );
}
