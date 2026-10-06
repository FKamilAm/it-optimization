"use client";

import {
  PluckedStripes,
  type StripeArt,
  type StripeRun,
} from "@/components/ui/plucked-stripes";

// Source art: the "IT-OPTIMIZATION" wordmark rendered as horizontal stripes
// (white on dark). We read its pixels once and rebuild it from independent
// horizontal segments so each one can be "plucked" like a string on hover.
const SRC = "/footer/wordmark-en.webp";
const SRC_W = 1920;
const SRC_H = 173;

// How wide (in source px) a single pluckable piece may be. Long horizontal
// strokes get sliced into several pieces so a wave can ripple along them.
const PIECE_W = 26;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Extract horizontal runs from the source art.
async function loadWordmark(): Promise<StripeArt | null> {
  const img = await loadImage(SRC);
  const off = document.createElement("canvas");
  off.width = SRC_W;
  off.height = SRC_H;
  const octx = off.getContext("2d", { willReadFrequently: true });
  if (!octx) return null;
  octx.drawImage(img, 0, 0, SRC_W, SRC_H);
  const { data } = octx.getImageData(0, 0, SRC_W, SRC_H);

  const isInk = (x: number, y: number) => {
    const i = (y * SRC_W + x) * 4;
    const a = data[i + 3] / 255;
    const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) * a;
    return lum > 90;
  };

  // 1. Group rows into stripe bands (gaps between stripes are dark rows).
  const rowMin = Math.max(4, Math.floor(SRC_W * 0.01));
  const bands: Array<[number, number]> = [];
  for (let y = 0; y < SRC_H;) {
    let count = 0;
    for (let x = 0; x < SRC_W; x++) if (isInk(x, y)) count++;
    if (count >= rowMin) {
      const y0 = y;
      while (y < SRC_H) {
        let c = 0;
        for (let x = 0; x < SRC_W; x++) if (isInk(x, y)) c++;
        if (c < rowMin) break;
        y++;
      }
      bands.push([y0, y - 1]);
    } else {
      y++;
    }
  }

  // 2. Within each band find horizontal runs.
  const runs: StripeRun[] = [];
  for (const [y0, y1] of bands) {
    const h = y1 - y0 + 1;
    let runStart = -1;
    for (let x = 0; x <= SRC_W; x++) {
      let colInk = false;
      if (x < SRC_W) {
        for (let yy = y0; yy <= y1; yy++) {
          if (isInk(x, yy)) {
            colInk = true;
            break;
          }
        }
      }
      if (colInk && runStart < 0) runStart = x;
      if (!colInk && runStart >= 0) {
        runs.push({ x: runStart, y: y0, w: x - runStart, h, tone: 0 });
        runStart = -1;
      }
    }
  }

  // 3. Average the strong-ink colour so the rebuild matches the art.
  let inkColor = "rgb(226, 230, 233)";
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let sc = 0;
  for (let yy = 0; yy < SRC_H; yy += 2) {
    for (let xx = 0; xx < SRC_W; xx += 2) {
      const i = (yy * SRC_W + xx) * 4;
      const a = data[i + 3] / 255;
      const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) * a;
      if (lum > 150) {
        sr += data[i];
        sg += data[i + 1];
        sb += data[i + 2];
        sc++;
      }
    }
  }
  if (sc > 0) {
    inkColor = `rgb(${Math.round(sr / sc)}, ${Math.round(sg / sc)}, ${Math.round(
      sb / sc,
    )})`;
  }

  return {
    width: SRC_W,
    height: SRC_H,
    runs,
    tones: [{ fill: inkColor, active: "rgba(255, 255, 255, 0.18)" }],
  };
}

export function FooterWordmark({ className }: { className?: string }) {
  return (
    <PluckedStripes
      load={loadWordmark}
      aspectRatio={SRC_W / SRC_H}
      pieceWidth={PIECE_W}
      className={className}
    />
  );
}
