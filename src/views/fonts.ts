import { Manrope, Unbounded } from "next/font/google";

/**
 * Шрифты сайта. Отдельным модулем, потому что их подключают два места: общая
 * оболочка страниц (root-shell) и глобальная 404 (app/global-not-found), у
 * которой свой <html> и которая оболочку не использует.
 */

export const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

export const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["900"],
  variable: "--font-unbounded",
  display: "swap",
});
