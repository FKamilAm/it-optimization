/**
 * Browser-side image pipeline for the /admin panel.
 *
 * The site ships hand-optimized WebP with no runtime optimizer, so the panel has
 * to produce final assets itself: decode whatever the user picked (PNG/JPEG/WebP),
 * fit it to the exact geometry each slot expects, and re-encode as WebP via canvas.
 * Nothing is uploaded raw.
 */

export type CaseImageSlot = "cover" | "detail" | "detailMobile";

interface SlotSpec {
  width: number;
  height: number;
  /** "cover" crops to fill; "contain" letterboxes onto transparency (nothing lost). */
  fit: "cover" | "contain";
  /** Filename prefix/suffix pattern, mirroring the existing public/cases/ naming. */
  name: (key: string, hash: string) => string;
  label: string;
  hint: string;
}

/**
 * Geometry matches the assets already in public/cases/. Covers are cropped —
 * they are decorative squares. The lightbox slides are letterboxed instead, so a
 * screenshot of any aspect ratio keeps every pixel of its content.
 */
export const IMAGE_SLOTS: Record<CaseImageSlot, SlotSpec> = {
  cover: {
    width: 1000,
    height: 1000,
    fit: "cover",
    name: (key, hash) => `case-${key}-${hash}.webp`,
    label: "Обложка карточки",
    hint: "Квадрат 1000×1000. Обрезается по центру.",
  },
  detail: {
    width: 1920,
    height: 1080,
    fit: "contain",
    name: (key, hash) => `detail-${key}-${hash}.webp`,
    label: "Слайд для лайтбокса",
    hint: "16:9, 1920×1080. Вписывается целиком, ничего не обрезается.",
  },
  detailMobile: {
    width: 900,
    height: 1600,
    fit: "contain",
    name: (key, hash) => `detail-${key}-${hash}-mobile.webp`,
    label: "Слайд для телефона",
    hint: "9:16, 900×1600. Вписывается целиком. Если не загрузить — возьмём обычный слайд.",
  },
};

/** Public path of an asset inside the export (also its repo path minus `public/`). */
export const CASES_DIR = "/cases";
export const CASES_REPO_DIR = "public/cases";

const QUALITY_STEPS = [0.86, 0.78, 0.7];
const MAX_BYTES = 600 * 1024;

export interface ProcessedImage {
  /** Content hash — the final filename is derived from it plus the case key. */
  hash: string;
  slot: CaseImageSlot;
  blob: Blob;
  /** Object URL for previewing before publish — revoke when done. */
  previewUrl: string;
  width: number;
  height: number;
  bytes: number;
}

function drawToCanvas(bitmap: ImageBitmap, spec: SlotSpec): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Браузер не дал 2d-контекст для обработки картинки");
  ctx.imageSmoothingQuality = "high";

  const scale =
    spec.fit === "cover"
      ? Math.max(spec.width / bitmap.width, spec.height / bitmap.height)
      : Math.min(spec.width / bitmap.width, spec.height / bitmap.height);
  const drawWidth = bitmap.width * scale;
  const drawHeight = bitmap.height * scale;

  ctx.drawImage(
    bitmap,
    (spec.width - drawWidth) / 2,
    (spec.height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
  return canvas;
}

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Не удалось закодировать WebP")),
      "image/webp",
      quality,
    );
  });
}

/** Short content hash — new filenames are unique, so browser caches never serve a stale image. */
async function shortHash(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest).slice(0, 3))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Filenames are derived, not stored: a case's key can still change after its
 * images were processed (a new case renames itself from its title), so the paths
 * are computed from the *current* key at publish time. The content hash in the
 * name means a replaced image never collides with a cached copy of the old one.
 */
export function assetPaths(
  slot: CaseImageSlot,
  caseKey: string,
  hash: string,
): { path: string; repoPath: string } {
  const name = IMAGE_SLOTS[slot].name(caseKey, hash);
  return { path: `${CASES_DIR}/${name}`, repoPath: `${CASES_REPO_DIR}/${name}` };
}

/**
 * Convert a picked file into the final WebP asset for one slot. Quality steps
 * down until the file is a sane size for a landing page.
 */
export async function processImage(
  file: File,
  slot: CaseImageSlot,
): Promise<ProcessedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`«${file.name}» — это не картинка`);
  }

  const spec = IMAGE_SLOTS[slot];
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`Не удалось прочитать «${file.name}». Нужен PNG, JPEG или WebP.`);
  }

  try {
    const canvas = drawToCanvas(bitmap, spec);
    let blob = await encode(canvas, QUALITY_STEPS[0]);
    for (const quality of QUALITY_STEPS.slice(1)) {
      if (blob.size <= MAX_BYTES) break;
      blob = await encode(canvas, quality);
    }

    return {
      hash: await shortHash(blob),
      slot,
      blob,
      previewUrl: URL.createObjectURL(blob),
      width: spec.width,
      height: spec.height,
      bytes: blob.size,
    };
  } finally {
    bitmap.close();
  }
}

export function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} МБ`
    : `${Math.round(bytes / 1024)} КБ`;
}
