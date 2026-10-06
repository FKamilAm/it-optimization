"use client";

import { ButtonContent, buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BAND_ABOVE,
  BAND_ASPECT,
  BAND_BELOW,
  StripedCode,
  StripedGlyph,
} from "./striped-code";

export interface ErrorScreenProps {
  code: "404" | "403";
  /** Одна строка под цифрами — она же заголовок страницы. */
  title: string;
  home: { label: string; href: string };
  logo: { src: string; alt: string; label: string; href: string };
}

/**
 * Общий экран 404 и 403: логотип, код огромными цифрами из полос, строка и
 * кнопка «На главную»; по углам — те же цифры, размытые. На 404 ноль — лупа,
 * на 403 — замок. Страницы зеркальны: на 404 строка слева, кнопка справа, на
 * 403 наоборот.
 *
 * Экран ровно в высоту окна и не прокручивается: вся композиция меряется одной
 * шириной --dw, которая ограничена и шириной, и высотой окна, поэтому на
 * низком ноутбуке она уменьшается целиком, а не уезжает за край.
 *
 * Без хуков next-intl — 404 рендерится вне провайдера строк, поэтому всё
 * приходит пропсами, уже на нужном языке.
 */
export function ErrorScreen({ code, title, home, logo }: ErrorScreenProps) {
  const emblem = code === "403" ? "lock" : "search";

  return (
    <div className="bg-background text-foreground fixed inset-0 overflow-hidden overscroll-none">
      <CornerDigits code={code} />

      <main
        id="main"
        className="relative flex h-full items-center justify-center [--dw:min(90vw,calc((100svh_-_12rem)/0.66))] md:[--dw:min(75vw,100rem,calc((100svh_-_8rem)/0.62))]"
      >
        <div className="w-(--dw)">
          {/* Под логотипом на телефоне — место для дужки замка: цифры там
              узкие, и дужка оказалась бы прямо под надписью. */}
          <a
            href={logo.href}
            aria-label={logo.label}
            className="relative z-10 mb-[calc(var(--dw)*0.2)] block w-40 md:mb-[calc(var(--dw)*0.03)] md:w-[max(7.5rem,calc(var(--dw)*0.275))]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo.src}
              alt={logo.alt}
              width={240}
              height={27}
              className="h-auto w-full"
            />
          </a>

          {/* Полоса цифр. Холст выходит за неё вверх (дужка) и вниз
              (рукоятка) и лежит под строкой и кнопкой. */}
          <div
            className="relative"
            style={{ aspectRatio: BAND_ASPECT }}
            aria-hidden="true"
          >
            <StripedCode
              code={code}
              emblem={emblem}
              className="absolute inset-x-0"
              style={{
                top: `${-BAND_ABOVE * 100}%`,
                bottom: `${-BAND_BELOW * 100}%`,
                aspectRatio: "auto",
              }}
            />
          </div>

          {/* Слой строки пропускает курсор к полосам: задеть рукоятку можно и
              между строкой и кнопкой. */}
          <div
            className={cn(
              "pointer-events-none relative z-10 mt-[calc(var(--dw)*0.22)] flex flex-col items-start gap-5 md:mt-[calc(var(--dw)*0.025)] md:flex-row md:items-center md:justify-between md:gap-8",
              code === "403" && "md:flex-row-reverse",
            )}
          >
            <h1
              className={cn(
                "pointer-events-auto text-2xl leading-tight font-semibold tracking-[-0.025em] text-balance md:max-w-[calc(var(--dw)*0.56)] md:text-[length:max(1rem,calc(var(--dw)*0.031))]",
                code === "403" && "md:text-right",
              )}
            >
              <span className="sr-only">{code}. </span>
              {title}
            </h1>
            <a
              href={home.href}
              data-cursor="dark"
              className={buttonClassName(
                "primary",
                "lg",
                "pointer-events-auto shrink-0 md:h-[max(2.75rem,calc(var(--dw)*0.048))] md:px-[max(1.25rem,calc(var(--dw)*0.03))] md:text-[length:max(0.875rem,calc(var(--dw)*0.0135))]",
              )}
            >
              <ButtonContent variant="primary" showArrow>
                {home.label}
              </ButtonContent>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Размытые цифры по углам — фон, а не содержание: без реакции на курсор,
 * наполовину за краем экрана.
 */
function CornerDigits({ code }: { code: "404" | "403" }) {
  const corners = [
    { glyph: "0", className: "-top-[7vw] -left-[6vw] -rotate-12 opacity-60" },
    { glyph: code[0], className: "-top-[8vw] -right-[5vw] rotate-[14deg] opacity-45" },
    { glyph: code[2], className: "-bottom-[9vw] -left-[4vw] rotate-[9deg] opacity-45" },
    { glyph: "0", className: "-right-[6vw] -bottom-[8vw] -rotate-[8deg] opacity-60" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {corners.map((c, i) => (
        <StripedGlyph
          key={i}
          glyph={c.glyph}
          className={cn(
            "absolute w-[34vw] blur-[1.6vw] md:w-[22vw] md:blur-[0.9vw]",
            c.className,
          )}
        />
      ))}
    </div>
  );
}
