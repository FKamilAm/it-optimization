import { ButtonContent, buttonClassName } from "@/components/ui/button";
import { ErrorHeader, type ErrorHeaderProps } from "./error-header";
import { StripedCode } from "./striped-code";

export interface ErrorScreenProps {
  code: "404" | "403";
  /** Одна строка под цифрами — она же заголовок страницы. */
  title: string;
  home: { label: string; href: string };
  header: ErrorHeaderProps;
}

/**
 * Общий экран 404 и 403: код огромными цифрами из полос, одна строка и одна
 * кнопка «На главную». Страницы отличаются только кодом и строкой.
 *
 * Без хуков next-intl — 404 рендерится вне провайдера строк, поэтому всё
 * приходит пропсами, уже на нужном языке.
 */
export function ErrorScreen({ code, title, home, header }: ErrorScreenProps) {
  return (
    <div className="bg-background text-foreground relative isolate flex min-h-svh flex-col">
      <ErrorHeader {...header} />

      <main
        id="main"
        className="container-premium flex flex-1 flex-col items-center justify-center pt-28 pb-16 text-center md:pt-32"
      >
        <StripedCode code={code} className="w-full" />
        <h1 className="mt-8 text-[length:clamp(1.5rem,2.083vw,2.5rem)] leading-tight font-semibold tracking-[-0.025em] text-balance md:mt-12">
          <span className="sr-only">{code}. </span>
          {title}
        </h1>
        <a
          href={home.href}
          data-cursor="dark"
          className={buttonClassName("primary", "lg", "mt-8 md:mt-10")}
        >
          <ButtonContent variant="primary" showArrow>
            {home.label}
          </ButtonContent>
        </a>
      </main>
    </div>
  );
}
