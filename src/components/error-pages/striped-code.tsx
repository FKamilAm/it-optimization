"use client";

import {
  PluckedStripes,
  type StripeArt,
  type StripeRun,
} from "@/components/ui/plucked-stripes";

/**
 * Код ошибки огромными цифрами из полос — как надпись IT-OPTIMIZATION в
 * подвале, и полосы так же пружинят под курсором (и под пальцем). Чёрные
 * цифры, ноль — фирменный салатовый.
 *
 * Полосы не нарисованы заранее, а нарезаются из шрифта сайта (Unbounded) при
 * загрузке: цифры набираются на скрытом холсте, и каждая полоса — это ряд
 * пикселей посередине своей высоты. Так одна функция годится для 404 и 403,
 * и форма цифр всегда совпадает с заголовками сайта.
 */

/** Размер исходника в условных px; на экране он масштабируется целиком. */
const ART_W = 1800;
const ART_H = 640;
const ASPECT = ART_W / ART_H;

/** Сколько полос на высоту цифры и какая доля шага приходится на саму полосу. */
const STRIPES = 22;
const THICKNESS = 0.4;
/** Промежуток между цифрами, доли кегля. */
const GAP_EM = 0.05;
/** Длина одного «куска струны» в px исходника. */
const PIECE_W = 32;

function cssVar(el: Element, name: string, fallback: string) {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

async function typesetStripes(code: string): Promise<StripeArt | null> {
  const family = cssVar(document.body, "--font-unbounded", "sans-serif");
  const ink = cssVar(document.documentElement, "--foreground", "#0a0a0a");
  const accent = cssVar(document.documentElement, "--accent", "#b4e02d");
  const font = (size: number) => `900 ${size}px ${family}`;
  try {
    await document.fonts.load(font(100), code);
  } catch {
    // Шрифт не загрузился — цифры наберутся запасным, но наберутся.
  }

  const off = document.createElement("canvas");
  off.width = ART_W;
  off.height = ART_H;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  // Подобрать кегль так, чтобы цифры заняли исходник целиком.
  const glyphs = [...code];
  const measure = (size: number) => {
    ctx.font = font(size);
    const metrics = glyphs.map((g) => ctx.measureText(g));
    const widths = metrics.map((m) => m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
    const ascent = Math.max(...metrics.map((m) => m.actualBoundingBoxAscent));
    const descent = Math.max(...metrics.map((m) => m.actualBoundingBoxDescent));
    const gap = size * GAP_EM;
    const width = widths.reduce((a, b) => a + b, 0) + gap * (glyphs.length - 1);
    return { metrics, widths, ascent, height: ascent + descent, gap, width };
  };
  const probe = measure(100);
  const size = 100 * Math.min(ART_W / probe.width, ART_H / probe.height);
  const m = measure(size);

  // Каждая цифра — своим чистым каналом, чтобы потом узнать, чья полоса.
  const channels = ["#ff0000", "#00ff00", "#0000ff"];
  ctx.clearRect(0, 0, ART_W, ART_H);
  ctx.textBaseline = "alphabetic";
  const top = (ART_H - m.height) / 2;
  let x = (ART_W - m.width) / 2;
  glyphs.forEach((g, i) => {
    ctx.fillStyle = channels[i % channels.length];
    ctx.fillText(g, x + m.metrics[i].actualBoundingBoxLeft, top + m.ascent);
    x += m.widths[i] + m.gap;
  });
  const { data } = ctx.getImageData(0, 0, ART_W, ART_H);

  // Ноль — салатовый, остальные цифры — чёрные.
  const toneOf = (glyph: number) => (glyphs[glyph] === "0" ? 1 : 0);
  const glyphAt = (px: number, py: number) => {
    const i = (py * ART_W + px) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    if (max < 128) return -1;
    return max === r ? 0 : max === g ? 1 : 2;
  };

  // Полосы от верхнего края цифр до нижнего: первая и последняя ложатся
  // ровно по краям, чтобы силуэт читался чётко.
  const thickness = (THICKNESS * m.height) / (STRIPES - 1 + THICKNESS);
  const pitch = (m.height - thickness) / (STRIPES - 1);
  const runs: StripeRun[] = [];
  for (let s = 0; s < STRIPES; s++) {
    const y = top + s * pitch;
    const row = Math.min(ART_H - 1, Math.round(y + thickness / 2));
    let start = -1;
    let owner = -1;
    for (let px = 0; px <= ART_W; px++) {
      const glyph = px < ART_W ? glyphAt(px, row) : -1;
      if (glyph !== owner) {
        if (owner >= 0) {
          runs.push({ x: start, y, w: px - start, h: thickness, tone: toneOf(owner) });
        }
        start = px;
        owner = glyph;
      }
    }
  }

  return {
    width: ART_W,
    height: ART_H,
    runs,
    tones: [
      // Задетая полоса на миг подсвечивается: чёрная — зеленоватым, зелёная — светлее.
      { fill: ink, active: "rgba(180, 224, 45, 0.18)" },
      { fill: accent, active: "rgba(255, 255, 255, 0.18)" },
    ],
  };
}

interface StripedCodeProps {
  code: string;
  className?: string;
}

export function StripedCode({ code, className }: StripedCodeProps) {
  return (
    <div
      aria-hidden="true"
      className={className}
      // Ширина ограничена и высотой экрана: на низком ноутбуке цифры не должны
      // выталкивать строку и кнопку за край.
      style={{ maxWidth: `min(76rem, calc((100svh - 21rem) * ${ASPECT}))` }}
    >
      <PluckedStripes
        load={() => typesetStripes(code)}
        aspectRatio={ASPECT}
        pieceWidth={PIECE_W}
        radius={120}
        maxOffset={16}
        touch
        intro
      />
    </div>
  );
}
