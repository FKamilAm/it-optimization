// Converts every PNG in public/cases to WebP (same pipeline as the other case
// images) and removes the original PNG to keep the folder light.
import { readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const dir = new URL("../public/cases/", import.meta.url);
const dirPath = dir.pathname.replace(/^\/([A-Za-z]:)/, "$1"); // Windows-safe

const files = await readdir(dirPath);
const pngs = files.filter((f) => f.toLowerCase().endsWith(".png"));

let converted = 0;
for (const png of pngs) {
  const src = join(dirPath, png);
  const out = join(dirPath, png.replace(/\.png$/i, ".webp"));
  await sharp(src).webp({ quality: 82 }).toFile(out);
  await unlink(src);
  converted += 1;
  console.log(`converted: ${png} -> ${png.replace(/\.png$/i, ".webp")}`);
}

console.log(`done: ${converted} files`);
