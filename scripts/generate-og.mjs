import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Русская картинка для русских страниц, английская — для /en/ и /es/: в
// превью ссылки логотип должен совпадать с тем, что человек увидит в шапке.
const VARIANTS = [
  { logo: "LOGO.svg", out: "og-image.webp" },
  { logo: "LOGO-en.svg", out: "og-image-en.webp" },
];

for (const { logo, out } of VARIANTS) {
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: readFileSync(path.join(root, "public", logo)), gravity: "center" }])
    .webp({ quality: 86 })
    .toFile(path.join(root, "public", out));

  console.log(`generated public/${out}`);
}
