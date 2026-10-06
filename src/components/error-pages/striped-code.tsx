"use client";

import type { CSSProperties } from "react";
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
 * пикселей посередине своей высоты. Ноль может стать значком: на 404 у него
 * рукоятка, и он читается как лупа, на 403 он — замок. Значок рисуется в ту же
 * маску, что и цифры, поэтому режется на те же полосы и пружинит так же.
 */

export type CodeEmblem = "search" | "lock";

/** Полоса цифр: ширина к высоте. Цифры растягиваются на неё ровно. */
export const BAND_ASPECT = 3.7;
/**
 * Место над и под полосой цифр, в её высотах: дужка замка поднимается над
 * цифрами, рукоятка лупы опускается под них.
 */
export const BAND_ABOVE = 0.56;
export const BAND_BELOW = 0.45;

/** Высота полосы цифр в px исходника; всё остальное — от неё. */
const BAND_H = 500;
/** Сколько полос на высоту цифры и какая доля шага приходится на саму полосу. */
const STRIPES = 22;
const THICKNESS = 0.4;
/** Наименьший промежуток между цифрами, доли кегля. */
const MIN_GAP_EM = 0.04;
/** Длина одного «куска струны» в px исходника. */
const PIECE_W = 26;

function cssVar(el: Element, name: string, fallback: string) {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

interface ArtSpec {
  text: string;
  emblem?: CodeEmblem;
  /** Ширина к высоте полосы цифр. */
  aspect: number;
  above: number;
  below: number;
}

async function typesetStripes({
  text,
  emblem,
  aspect,
  above,
  below,
}: ArtSpec): Promise<StripeArt | null> {
  const family = cssVar(document.body, "--font-unbounded", "sans-serif");
  const ink = cssVar(document.documentElement, "--foreground", "#0a0a0a");
  const accent = cssVar(document.documentElement, "--accent", "#b4e02d");
  const font = (size: number) => `900 ${size}px ${family}`;
  try {
    await document.fonts.load(font(100), text);
  } catch {
    // Шрифт не загрузился — цифры наберутся запасным, но наберутся.
  }

  const width = Math.round(BAND_H * aspect);
  const height = Math.round(BAND_H * (1 + above + below));
  const off = document.createElement("canvas");
  off.width = width;
  off.height = height;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const glyphs = [...text];
  const measure = (size: number) => {
    ctx.font = font(size);
    const metrics = glyphs.map((g) => ctx.measureText(g));
    return {
      metrics,
      widths: metrics.map((m) => m.actualBoundingBoxLeft + m.actualBoundingBoxRight),
      // Высота по плоским цифрам: круглые (0, 3) чуть выступают за линию
      // шрифта, и по ним «4» начиналась бы на полосу ниже нуля.
      ascent: Math.min(...metrics.map((m) => m.actualBoundingBoxAscent)),
      descent: Math.min(...metrics.map((m) => m.actualBoundingBoxDescent)),
    };
  };

  // Кегль — чтобы цифры заняли полосу по высоте; если так они не влезают по
  // ширине даже с наименьшим промежутком, кегль уменьшается.
  const probe = measure(100);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  let size = (100 * BAND_H) / (probe.ascent + probe.descent);
  const minGaps = MIN_GAP_EM * 100 * (glyphs.length - 1);
  const fitWidth = (100 * width) / (sum(probe.widths) + minGaps);
  size = Math.min(size, fitWidth);
  const m = measure(size);
  const textH = m.ascent + m.descent;
  // Стекло лупы — круг в высоту цифр, а не овал нуля из шрифта: овальное
  // стекло с толстой рукояткой читалось совсем не как лупа.
  const widths = m.widths.map((w, i) =>
    glyphs[i] === "0" && emblem === "search" ? textH : w,
  );
  // Промежуток добирает остаток ширины: цифры встают ровно от края до края,
  // и текст с кнопкой под ними выравниваются по их краям.
  const gap = glyphs.length > 1 ? (width - sum(widths)) / (glyphs.length - 1) : 0;
  const top = BAND_H * above + (BAND_H - textH) / 2;

  // Каждая цифра — своим чистым каналом, чтобы потом узнать, чья полоса.
  const channels = ["#ff0000", "#00ff00", "#0000ff"];
  let x = glyphs.length > 1 ? 0 : (width - widths[0]) / 2;
  glyphs.forEach((g, i) => {
    const color = channels[i % channels.length];
    const box = { x, y: top, w: widths[i], h: textH };
    if (g === "0" && emblem === "lock") {
      drawLock(ctx, box, color);
    } else if (g === "0" && emblem === "search") {
      drawMagnifier(ctx, box, color);
    } else {
      ctx.fillStyle = color;
      ctx.fillText(g, x + m.metrics[i].actualBoundingBoxLeft, top + m.ascent);
    }
    x += widths[i] + gap;
  });
  const { data } = ctx.getImageData(0, 0, width, height);

  // Ноль — салатовый, остальные цифры — чёрные.
  const toneOf = (glyph: number) => (glyphs[glyph] === "0" ? 1 : 0);
  const glyphAt = (px: number, py: number) => {
    const i = (py * width + px) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    if (max < 128) return -1;
    return max === r ? 0 : max === g ? 1 : 2;
  };

  // Полосы от верхнего края цифр до нижнего: первая и последняя ложатся
  // ровно по краям, чтобы силуэт читался чётко. Тем же шагом полосы
  // продолжаются выше и ниже — туда, где дужка замка и рукоятка лупы.
  const thickness = (THICKNESS * textH) / (STRIPES - 1 + THICKNESS);
  const pitch = (textH - thickness) / (STRIPES - 1);
  const first = -Math.floor(top / pitch);
  const last = Math.floor((height - top - thickness) / pitch);
  const runs: StripeRun[] = [];
  for (let s = first; s <= last; s++) {
    const y = top + s * pitch;
    const row = Math.min(height - 1, Math.max(0, Math.round(y + thickness / 2)));
    let start = -1;
    let owner = -1;
    for (let px = 0; px <= width; px++) {
      const glyph = px < width ? glyphAt(px, row) : -1;
      if (glyph !== owner) {
        // Обрывок короче пары толщин — край скругления, а не часть формы:
        // одинокая точка на конце рукоятки выглядит как мусор.
        if (owner >= 0 && px - start >= thickness * 3.5) {
          runs.push({ x: start, y, w: px - start, h: thickness, tone: toneOf(owner) });
        }
        start = px;
        owner = glyph;
      }
    }
  }

  return {
    width,
    height,
    runs,
    tones: [
      // Задетая полоса на миг подсвечивается: чёрная — зеленоватым, зелёная — светлее.
      { fill: ink, active: "rgba(180, 224, 45, 0.18)" },
      { fill: accent, active: "rgba(255, 255, 255, 0.18)" },
    ],
  };
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Лупа на месте нуля: круглое кольцо в высоту цифр и тонкая прямая рукоятка
 * под 45° из правого нижнего края. Рукоятка начинается посреди кольца — там
 * они сливаются — и заканчивается прямым срезом: скруглённый толстый конец
 * делал значок похожим на что угодно, кроме лупы.
 */
function drawMagnifier(ctx: CanvasRenderingContext2D, o: Box, color: string) {
  const cx = o.x + o.w / 2;
  const cy = o.y + o.h / 2;
  const outer = o.h / 2;
  const ring = o.h * 0.23;
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.arc(cx, cy, outer, 0, Math.PI * 2);
  ctx.arc(cx, cy, outer - ring, 0, Math.PI * 2, true);
  ctx.fill();

  const t = o.h * 0.2;
  const from = outer - ring / 2;
  const to = outer + o.h * 0.55;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(from, -t / 2, to - from, t);
  ctx.restore();
}

/**
 * Замок на месте нуля: корпус — скруглённый прямоугольник размером с ноль,
 * с замочной скважиной и дужка над ним, уходящая в корпус. Скважина, а не
 * просто круглое отверстие: с ним дужка и корпус вместе читались как «8».
 */
function drawLock(ctx: CanvasRenderingContext2D, o: Box, color: string) {
  const cx = o.x + o.w / 2;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  // Дужка: буква «П» со скруглённым верхом, ноги заходят в корпус.
  const stroke = o.h * 0.2;
  const radius = o.w * 0.3 - stroke / 2;
  const legTop = o.y - o.h * 0.08;
  ctx.lineWidth = stroke;
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.moveTo(cx - radius, o.y + o.h * 0.15);
  ctx.lineTo(cx - radius, legTop);
  ctx.arc(cx, legTop, radius, Math.PI, 0);
  ctx.lineTo(cx + radius, o.y + o.h * 0.15);
  ctx.stroke();

  // Корпус. Скругление вручную, а не roundRect: того нет в Safari до 16.
  const r = o.h * 0.24;
  ctx.beginPath();
  ctx.moveTo(o.x + r, o.y);
  ctx.arcTo(o.x + o.w, o.y, o.x + o.w, o.y + o.h, r);
  ctx.arcTo(o.x + o.w, o.y + o.h, o.x, o.y + o.h, r);
  ctx.arcTo(o.x, o.y + o.h, o.x, o.y, r);
  ctx.arcTo(o.x, o.y, o.x + o.w, o.y, r);
  ctx.closePath();
  ctx.fill();

  // Скважина — вырезать из корпуса: круг и расширяющийся книзу хвост.
  const holeY = o.y + o.h * 0.42;
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(cx, holeY, o.h * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - o.h * 0.06, holeY);
  ctx.lineTo(cx + o.h * 0.06, holeY);
  ctx.lineTo(cx + o.h * 0.09, o.y + o.h * 0.76);
  ctx.lineTo(cx - o.h * 0.09, o.y + o.h * 0.76);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

interface StripedCodeProps {
  code: string;
  emblem?: CodeEmblem;
  className?: string;
  style?: CSSProperties;
}

/**
 * Код целиком: полоса цифр плюс место над и под ней. Положение задаёт
 * родитель — холст выходит за полосу цифр на BAND_ABOVE и BAND_BELOW.
 */
export function StripedCode({ code, emblem, className, style }: StripedCodeProps) {
  return (
    <PluckedStripes
      load={() =>
        typesetStripes({
          text: code,
          emblem,
          aspect: BAND_ASPECT,
          above: BAND_ABOVE,
          below: BAND_BELOW,
        })
      }
      aspectRatio={BAND_ASPECT / (1 + BAND_ABOVE + BAND_BELOW)}
      pieceWidth={PIECE_W}
      radius={120}
      maxOffset={16}
      touch
      intro
      className={className}
      style={style}
    />
  );
}

/** Одна цифра для фона: те же полосы, но без реакции на курсор. */
export function StripedGlyph({
  glyph,
  className,
  style,
}: {
  glyph: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <PluckedStripes
      load={() => typesetStripes({ text: glyph, aspect: 1.15, above: 0, below: 0 })}
      aspectRatio={1.15}
      pieceWidth={PIECE_W}
      interactive={false}
      className={className}
      style={style}
    />
  );
}
