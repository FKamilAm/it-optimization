import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { env } from "../env.js";

export type AssetSlot = "cover" | "detail" | "detail_mobile";

interface SlotSpec {
  width: number;
  height: number;
  /** cover — обрезаем по центру; contain — вписываем целиком на прозрачный фон. */
  fit: "cover" | "contain";
  name: (slug: string, hash: string) => string;
}

/**
 * Геометрия совпадает с тем, что уже лежит в public/cases/ и что делает
 * браузерная часть панели. Обложки режем — это декоративные квадраты. Слайды
 * вписываем, чтобы со скриншота не потерялся ни один пиксель.
 */
export const SLOTS: Record<AssetSlot, SlotSpec> = {
  cover: {
    width: 1000,
    height: 1000,
    fit: "cover",
    name: (slug, hash) => `case-${slug}-${hash}.webp`,
  },
  detail: {
    width: 1920,
    height: 1080,
    fit: "contain",
    name: (slug, hash) => `detail-${slug}-${hash}.webp`,
  },
  detail_mobile: {
    width: 900,
    height: 1600,
    fit: "contain",
    name: (slug, hash) => `detail-${slug}-${hash}-mobile.webp`,
  },
};

export const PUBLIC_DIR = "/cases";
/** Путь внутри репозитория сайта — туда снапшот кладёт файлы при публикации. */
export const REPO_DIR = "public/cases";

/**
 * Обложка статьи блога. Слот один, поэтому отдельного enum'а у неё нет —
 * геометрия повторяет рисованные SVG первых статей (1200×750): список блога
 * показывает их в 16:10, страница статьи кадрирует до 16:9.
 */
export const BLOG_COVER: SlotSpec = {
  width: 1200,
  height: 750,
  fit: "cover",
  name: (slug, hash) => `post-${slug}-${hash}.webp`,
};

export const BLOG_PUBLIC_DIR = "/blog";
export const BLOG_REPO_DIR = "public/blog";

export interface ProcessedAsset {
  path: string;
  fileName: string;
  hash: string;
  width: number;
  height: number;
  bytes: number;
  buffer: Buffer;
}

/**
 * Любой присланный файл пересобирается заново: декодируется, приводится к
 * нужной геометрии и кодируется в WebP. Тип файла из браузера не проверяется, а
 * игнорируется — доверять ему нельзя, а sharp просто не декодирует не-картинку.
 */
export async function processUpload(
  input: Buffer,
  slot: AssetSlot,
  slug: string,
): Promise<ProcessedAsset> {
  return processTo(input, SLOTS[slot], slug, PUBLIC_DIR);
}

/** То же самое для обложки статьи: другая геометрия и другая папка. */
export async function processCover(
  input: Buffer,
  slug: string,
): Promise<ProcessedAsset> {
  return processTo(input, BLOG_COVER, slug, BLOG_PUBLIC_DIR);
}

async function processTo(
  input: Buffer,
  spec: SlotSpec,
  slug: string,
  publicDir: string,
): Promise<ProcessedAsset> {
  const pipeline = sharp(input, { failOn: "none" })
    .rotate() // учесть EXIF-ориентацию до ресайза
    .resize(spec.width, spec.height, {
      fit: spec.fit,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });

  let buffer = await pipeline.webp({ quality: 86 }).toBuffer();

  // Тяжёлый слайд ужимаем сильнее, но не бесконечно — иначе поедет качество.
  for (const quality of [78, 70]) {
    if (buffer.byteLength <= 600 * 1024) break;
    buffer = await sharp(input, { failOn: "none" })
      .rotate()
      .resize(spec.width, spec.height, {
        fit: spec.fit,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality })
      .toBuffer();
  }

  // Хэш содержимого в имени файла: замена картинки обходит кеш браузера и CDN.
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 8);
  const fileName = spec.name(slug, hash);

  await mkdir(env.UPLOAD_DIR, { recursive: true });
  await writeFile(join(env.UPLOAD_DIR, fileName), buffer);

  return {
    path: `${publicDir}/${fileName}`,
    fileName,
    hash,
    width: spec.width,
    height: spec.height,
    bytes: buffer.byteLength,
    buffer,
  };
}
