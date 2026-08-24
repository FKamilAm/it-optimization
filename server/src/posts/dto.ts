import type { Post } from "@prisma/client";
import { z } from "zod";

/**
 * Форма статьи, которой обмениваются API, панель и статический снапшот
 * `content/blog.json`. Одна форма на всех — так же, как у кейсов.
 */
export const postSection = z.object({
  heading: z.string().trim().min(1).max(300),
  body: z.array(z.string().trim().min(1).max(4000)).min(1).max(40),
});

export const postInput = z.object({
  id: z.string().uuid(),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Только строчная латиница, цифры и дефис"),
  status: z.enum(["draft", "published"]).default("published"),
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().min(1).max(600),
  category: z.string().trim().min(1).max(60),
  lead: z.string().trim().min(1).max(2000),
  metaTitle: z.string().trim().min(1).max(200),
  metaDescription: z.string().trim().min(1).max(400),
  readingTime: z.number().int().min(1).max(90),
  sections: z.array(postSection).min(1).max(40),
  takeaways: z.array(z.string().trim().min(1).max(600)).max(12).default([]),
  services: z.array(z.string().trim().min(1).max(60)).max(24).optional(),
  /** День без времени: дата публикации — свойство статьи, а не момент записи. */
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ожидается дата вида ГГГГ-ММ-ДД"),
});

export type PostInput = z.infer<typeof postInput>;

export const replacePostsBody = z.object({
  posts: z.array(postInput).max(200),
  /** Ревизия, на которой открылась панель. */
  version: z.string(),
});

export interface PostSectionDto {
  heading: string;
  body: string[];
}

export interface PostDto {
  id: string;
  slug: string;
  status: "draft" | "published";
  title: string;
  excerpt: string;
  category: string;
  lead: string;
  metaTitle: string;
  metaDescription: string;
  cover: string;
  readingTime: number;
  sections: PostSectionDto[];
  takeaways: string[];
  services: string[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** Строка базы → то, что видят панель и сайт. */
export function toDto(item: Post): PostDto {
  return {
    id: item.id,
    slug: item.slug,
    status: item.status,
    title: item.title,
    excerpt: item.excerpt,
    category: item.category,
    lead: item.lead,
    metaTitle: item.metaTitle,
    metaDescription: item.metaDescription,
    cover: item.cover,
    readingTime: item.readingTime,
    // Prisma отдаёт Json как unknown: форму гарантирует запись через postInput.
    sections: (item.sections ?? []) as unknown as PostSectionDto[],
    takeaways: item.takeaways,
    services: item.services,
    publishedAt: item.publishedAt.toISOString().slice(0, 10),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
