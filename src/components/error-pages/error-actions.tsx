"use client";

import { ArrowLeft } from "lucide-react";
import { ButtonContent, buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorActionsProps {
  home: { label: string; href: string };
  /** Вторая ссылка: адрес (услуги) или «назад» по истории браузера. */
  secondary: { label: string; href?: string; back?: boolean };
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
  const secondaryClass = cn(
    "inline-flex cursor-pointer items-center gap-2 rounded-full px-1 py-2 text-base font-medium underline-offset-4 transition-colors duration-300 hover:underline",
    dark ? "text-white/70 hover:text-white" : "text-foreground/70 hover:text-foreground",
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
      {secondary.back ? (
        <button
          type="button"
          className={secondaryClass}
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else window.location.href = home.href;
          }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {secondary.label}
        </button>
      ) : (
        <a href={secondary.href} className={secondaryClass}>
          {secondary.label}
        </a>
      )}
    </div>
  );
}
