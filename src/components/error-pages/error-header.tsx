import { ButtonContent, buttonClassName } from "@/components/ui/button";

export interface ErrorHeaderProps {
  /** Главная текущего языка — туда ведёт логотип. */
  home: string;
  logoSrc: string;
  logoAlt: string;
  /** Подпись ссылки логотипа для скринридера. */
  logoLabel: string;
  cta: string;
  ctaHref: string;
}

/**
 * Упрощённая шапка страниц ошибок: логотип и одна главная кнопка.
 *
 * Полная навигация здесь мешает: на 404 и 403 человек должен за секунду
 * понять, куда идти, а меню из семи пунктов спорит со сценой за внимание.
 * Без хуков next-intl — 404 рендерится вне провайдера строк, поэтому всё
 * приходит пропсами, уже на нужном языке.
 */
export function ErrorHeader({
  home,
  logoSrc,
  logoAlt,
  logoLabel,
  cta,
  ctaHref,
}: ErrorHeaderProps) {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="container-premium flex h-[72px] items-center justify-between gap-4 md:h-20">
        <a href={home} aria-label={logoLabel} className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={logoAlt}
            width={240}
            height={27}
            className="h-7 w-auto md:h-8"
          />
        </a>
        <a
          href={ctaHref}
          data-cursor="dark"
          className={buttonClassName("primary", "sm", "hidden sm:inline-flex")}
        >
          <ButtonContent variant="primary" showArrow>
            {cta}
          </ButtonContent>
        </a>
      </div>
    </header>
  );
}
