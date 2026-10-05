"use client";

import { useLocale, useTranslations } from "next-intl";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { applyPrices } from "@/lib/money";

/**
 * Строки каталога, внутри которых стоят цены.
 *
 * Цена в каталоге записана меткой `{price:89000}` — суммой в рублях, из
 * которой на английской и испанской версии считаются доллары по курсу ЦБ.
 * Хранить там готовую строку нельзя: на русской странице нужны рубли, на
 * остальных доллары, и оба варианта должны меняться вместе с одним
 * источником — рублёвой ценой.
 *
 * Отдельный хук, а не ручная подстановка на каждом месте: цены в каталоге
 * лежат в бюджете каждой из 32 услуг и в ответах FAQ, и достаточно забыть
 * одно место, чтобы на странице осталась метка в фигурных скобках. Так и
 * случилось в первый раз — цены в тарифах я перевёл, а бюджет в шапке
 * страницы услуги остался рублёвым на всех языках.
 */
export function useMoneyText(namespace?: string) {
  const t = useTranslations(namespace);
  const raw = useLocale();
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return (key: string) => applyPrices(t(key), locale);
}
