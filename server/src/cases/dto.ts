import type { Case, CaseAsset } from "@prisma/client";
import { z } from "zod";

/**
 * Форма кейса, которой обмениваются API, панель и статический снапшот
 * `content/cases.json`. Одна форма на всех — поэтому пути картинок здесь
 * «расплющены» в три поля, хотя в базе живут отдельной таблицей.
 */
export const caseInput = z.object({
  id: z.string().uuid(),
  slug: z
    .string()
    .min(1)
    .max(60)
    // Заглавные разрешены намеренно: часть кейсов приехала из прежней модели с
    // ключами вида aiAgent и tgMiniApp, и на них ссылаются страницы услуг в
    // messages/ru.json. Правило проверяет безопасность slug для имён файлов, а
    // не стиль записи, — иначе API отвергал бы собственные данные.
    .regex(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/, "Только латиница, цифры и дефис"),
  status: z.enum(["draft", "published"]).default("published"),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  quote: z.string().trim().min(1).max(2000),
  tags: z.array(z.string().trim().min(1).max(60)).min(1).max(12),
});

export type CaseInput = z.infer<typeof caseInput>;

export const replaceCasesBody = z.object({
  cases: z.array(caseInput).max(200),
  /** Ревизия, на которой открылась панель. */
  version: z.string(),
});

export interface CaseDto {
  id: string;
  slug: string;
  status: "draft" | "published";
  title: string;
  description: string;
  quote: string;
  tags: string[];
  cover: string;
  detail: string;
  detailMobile: string;
  createdAt: string;
  updatedAt: string;
}

type CaseWithAssets = Case & { assets: CaseAsset[] };

/** Строка базы → то, что видят панель и сайт. */
export function toDto(item: CaseWithAssets): CaseDto {
  const bySlot = new Map(item.assets.map((asset) => [asset.slot, asset.path]));
  const detail = bySlot.get("detail") ?? "";

  return {
    id: item.id,
    slug: item.slug,
    status: item.status,
    title: item.title,
    description: item.description,
    quote: item.quote,
    tags: item.tags,
    cover: bySlot.get("cover") ?? "",
    detail,
    // Вертикальный слайд необязателен — если его нет, берём широкий.
    detailMobile: bySlot.get("detail_mobile") || detail,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
