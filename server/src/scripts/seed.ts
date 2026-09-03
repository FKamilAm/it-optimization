import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Prisma } from "@prisma/client";
import { CASES_SCOPE, POSTS_SCOPE, SERVICES_SCOPE, prisma } from "../db.js";

/**
 * Переносит `content/cases.json` и `content/blog.json` в базу. Форма файлов и
 * таблиц совпадает, так что это именно перенос, а не преобразование.
 * Запускается сколько угодно раз: записи сопоставляются по id, картинки кейса —
 * по слоту.
 *
 * Блог здесь обязателен, а не «приятное дополнение»: в режиме собственного API
 * панель публикует снапшот из базы, и пустая таблица `posts` стёрла бы блог с
 * сайта первой же публикацией.
 */
interface SnapshotCase {
  id: string;
  slug: string;
  title: string;
  description: string;
  quote: string;
  tags: string[];
  services?: string[];
  cover: string;
  detail: string;
  detailMobile: string;
  createdAt: string;
  updatedAt: string;
}

interface SnapshotCatalog {
  categories: { key: string; title: string }[];
  services: { key: string; slug: string; category: string; draft: boolean }[];
}

interface SnapshotPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  lead: string;
  metaTitle: string;
  metaDescription: string;
  cover: string;
  readingTime: number;
  sections: { heading: string; body: string[] }[];
  takeaways: string[];
  services: string[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

const here = dirname(fileURLToPath(import.meta.url));
/**
 * В репозитории снапшот лежит рядом с сайтом, в контейнере его монтируют
 * отдельно — поэтому путь можно задать переменной окружения.
 */
const SNAPSHOT = process.env.CASES_SNAPSHOT || join(here, "../../../content/cases.json");
const BLOG_SNAPSHOT =
  process.env.BLOG_SNAPSHOT || join(here, "../../../content/blog.json");
const CATALOG_SNAPSHOT =
  process.env.CATALOG_SNAPSHOT || join(here, "../../../content/service-catalog.json");

function hashFromPath(path: string): string {
  // Имена вида case-crm-a1b2c3d4.webp — хэш идёт последним сегментом.
  const match = path.match(/-([0-9a-f]{8})(?:-mobile)?\.webp$/);
  return match?.[1] ?? "";
}

async function main(): Promise<void> {
  const raw = await readFile(SNAPSHOT, "utf8");
  const cases = JSON.parse(raw) as SnapshotCase[];

  for (const [index, item] of cases.entries()) {
    await prisma.case.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        slug: item.slug,
        title: item.title,
        description: item.description,
        quote: item.quote,
        tags: item.tags,
        services: item.services ?? [],
        position: index,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
      update: {
        slug: item.slug,
        title: item.title,
        description: item.description,
        quote: item.quote,
        tags: item.tags,
        services: item.services ?? [],
        position: index,
        deletedAt: null,
      },
    });

    const slots = [
      { slot: "cover" as const, path: item.cover, width: 1000, height: 1000 },
      { slot: "detail" as const, path: item.detail, width: 1920, height: 1080 },
      {
        slot: "detail_mobile" as const,
        path: item.detailMobile,
        width: 900,
        height: 1600,
      },
    ];

    for (const entry of slots) {
      if (!entry.path) continue;
      await prisma.caseAsset.upsert({
        where: { caseId_slot: { caseId: item.id, slot: entry.slot } },
        create: {
          caseId: item.id,
          slot: entry.slot,
          path: entry.path,
          hash: hashFromPath(entry.path),
          width: entry.width,
          height: entry.height,
          // Размер известен только у файлов, прошедших через панель.
          bytes: 0,
        },
        update: { path: entry.path, hash: hashFromPath(entry.path) },
      });
    }
  }

  await prisma.contentRevision.upsert({
    where: { scope: CASES_SCOPE },
    update: {},
    create: { scope: CASES_SCOPE, value: 0 },
  });

  console.log(`Перенесено кейсов: ${cases.length}`);

  await seedPosts();
  await seedServiceCatalog();
}

async function seedPosts(): Promise<void> {
  const raw = await readFile(BLOG_SNAPSHOT, "utf8");
  const posts = JSON.parse(raw) as SnapshotPost[];

  for (const [index, post] of posts.entries()) {
    const sections = post.sections as unknown as Prisma.InputJsonValue;
    const fields = {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      lead: post.lead,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      cover: post.cover,
      readingTime: post.readingTime,
      sections,
      takeaways: post.takeaways ?? [],
      services: post.services ?? [],
      publishedAt: new Date(`${post.publishedAt}T00:00:00.000Z`),
      position: index,
    };

    await prisma.post.upsert({
      where: { id: post.id },
      create: {
        id: post.id,
        ...fields,
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt),
      },
      update: { ...fields, deletedAt: null },
    });
  }

  await prisma.contentRevision.upsert({
    where: { scope: POSTS_SCOPE },
    update: {},
    create: { scope: POSTS_SCOPE, value: 0 },
  });

  console.log(`Перенесено статей: ${posts.length}`);
}

/**
 * Каталог услуг: разделы и принадлежность услуг разделам.
 *
 * Сид здесь дополняющий, а не затирающий: услуга, которую уже переложили в
 * другой раздел через панель, при повторном запуске остаётся там же. Иначе
 * каждый `npm run seed` откатывал бы работу редактора к состоянию файла в
 * репозитории. Новая услуга, добавленная в `content/services.json` кодом, этим
 * же запуском попадает в базу и становится видна в панели.
 */
async function seedServiceCatalog(): Promise<void> {
  const raw = await readFile(CATALOG_SNAPSHOT, "utf8");
  const catalog = JSON.parse(raw) as SnapshotCatalog;

  for (const [index, category] of catalog.categories.entries()) {
    await prisma.serviceCategory.upsert({
      where: { key: category.key },
      create: { key: category.key, title: category.title, position: index },
      update: {},
    });
  }

  let added = 0;
  for (const [index, service] of catalog.services.entries()) {
    const existing = await prisma.serviceEntry.findUnique({ where: { key: service.key } });
    if (existing) {
      // Адрес страницы задаётся кодом и слуг обязан совпадать с маршрутом,
      // поэтому его обновляем; раздел и черновик — за редактором.
      await prisma.serviceEntry.update({
        where: { key: service.key },
        data: { slug: service.slug },
      });
      continue;
    }

    await prisma.serviceEntry.create({
      data: {
        key: service.key,
        slug: service.slug,
        categoryKey: service.category,
        draft: service.draft,
        position: index,
      },
    });
    added += 1;
  }

  await prisma.contentRevision.upsert({
    where: { scope: SERVICES_SCOPE },
    update: {},
    create: { scope: SERVICES_SCOPE, value: 0 },
  });

  console.log(
    `Каталог услуг: разделов ${catalog.categories.length}, услуг ${catalog.services.length} (новых ${added})`,
  );
}

main()
  .catch((cause: unknown) => {
    console.error(cause);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
