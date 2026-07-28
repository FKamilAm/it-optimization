import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CASES_SCOPE, prisma } from "../db.js";

/**
 * Переносит `content/cases.json` в базу. Форма файла и таблицы совпадает, так
 * что это именно перенос, а не преобразование. Запускается сколько угодно раз:
 * кейсы сопоставляются по id, картинки — по слоту.
 */
interface SnapshotCase {
  id: string;
  slug: string;
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

const here = dirname(fileURLToPath(import.meta.url));
/**
 * В репозитории снапшот лежит рядом с сайтом, в контейнере его монтируют
 * отдельно — поэтому путь можно задать переменной окружения.
 */
const SNAPSHOT = process.env.CASES_SNAPSHOT || join(here, "../../../content/cases.json");

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
}

main()
  .catch((cause: unknown) => {
    console.error(cause);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
