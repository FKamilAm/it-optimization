import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MutableRefObject, Ref } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * True only on desktop pointer devices without reduced-motion preference.
 * Gate all magnetic / tilt / parallax effects behind this.
 */
export function canUsePointerEffects(): boolean {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;
  return window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches;
}

export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as MutableRefObject<T | null>).current = node;
      }
    });
  };
}

/**
 * Расстановка неразрывных пробелов в заголовке.
 *
 * Заголовок услуги стоит в узкой колонке рядом с 3D-визуалом, и браузер рвёт
 * его там, где ему удобно. Два разрыва читаются как ошибка вёрстки:
 *
 * - «Проектирование / ИТ- / инфраструктуры» — аббревиатура уезжает на свою
 *   строку и повисает с дефисом. Приклеиваем слово перед сокращением, и
 *   единственным местом переноса остаётся сам дефис внутри слова.
 * - предлог или союз в конце строки («Интеграция с / оборудованием») — правило
 *   русской типографики, которое браузер не знает.
 *
 * Делается в коде, а не правкой строк в `content/services.json`: неразрывный
 * пробел невидим, и первый же, кто отредактирует заголовок, молча его потеряет.
 */
/**
 * Строчными — потому что предлоги и союзы пишутся строчными, а «ИБ» и «ИТ»
 * это аббревиатуры: с флагом регистронезависимости правило приклеивало их к
 * следующему союзу и получалось «Мониторинг ИБ и / реагирование».
 */
const SHORT_WORD = /(^|\s)([а-яёa-z]{1,2})\s+/g;
const ABBREVIATION = /(\S+)\s+([А-ЯЁA-Z]{2,4}-)/g;

export function typographicNbsp(text: string): string {
  const glued = text.replace(ABBREVIATION, "$1 $2");
  // Дважды: первый проход съедает пробел после короткого слова, и стоящий
  // следом второй такой же («по ИБ и соответствию») иначе не находится.
  return glued.replace(SHORT_WORD, "$1$2 ").replace(SHORT_WORD, "$1$2 ");
}
