import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const logo = readFileSync(path.join(root, "public", "LOGO.svg"));

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 3,
    background: { r: 255, g: 255, b: 255 },
  },
})
  .composite([{ input: logo, gravity: "center" }])
  .webp({ quality: 86 })
  .toFile(path.join(root, "public", "og-image.webp"));

console.log("generated public/og-image.webp");
