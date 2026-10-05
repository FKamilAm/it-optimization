import { useLocale } from "next-intl";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  companyName?: string;
}

/**
 * Надпись в логотипе следует языку страницы: «IT - ОПТИМИЗАЦИЯ» по-русски и
 * «IT - OPTIMIZATION» на остальных языках, как и BRAND_NAME в i18n/config.
 * Испанскому отдельная версия не нужна — название компании там тоже английское.
 *
 * LOGO-en.svg собран тем же шрифтом, что и русский (Montserrat Medium, кегль
 * 17,47, разрядка 0,04 em, кернинг шрифта), поэтому знак и высота букв у обоих
 * совпадают до сотой доли. Отличается только ширина: английское слово короче.
 */
const LOGOS = {
  ru: { src: "/LOGO.svg", width: 240 },
  other: { src: "/LOGO-en.svg", width: 222 },
} as const;

export function Logo({ className, companyName = "IT-Optimization" }: LogoProps) {
  const logo = useLocale() === DEFAULT_LOCALE ? LOGOS.ru : LOGOS.other;

  return (
    <img
      src={logo.src}
      alt={companyName}
      width={logo.width}
      height={27}
      className={cn("h-7 w-auto md:h-8", className)}
    />
  );
}
