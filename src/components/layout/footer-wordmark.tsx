"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Source art: the "IT-OPTIMIZATION" wordmark rendered as horizontal stripes
// (white on dark). We read its pixels once and rebuild it from independent
// horizontal segments so each one can be "plucked" like a string on hover.
const SRC = "/footer/wordmark-en.webp";
const SRC_W = 1920;
const SRC_H = 173;

// How wide (in source px) a single pluckable piece may be. Long horizontal
// strokes get sliced into several pieces so a wave can ripple along them.
const PIECE_W = 26;

// Interaction + physics tuning. Distances/offsets are in CSS px.
const RADIUS = 90; // pointer influence radius
const MAX_OFFSET = 13; // hard cap so glyphs never visibly break apart
const MAX_VELOCITY = 280;
const SPRING_K = 190; // stiffness  -> ~2.2 Hz
const SPRING_D = 8.5; // damping    -> a couple of soft oscillations, then rest
const POINTER_SPEED_CAP = 1600;

interface Segment {
  x: number; // geometry in source-image px
  y: number;
  w: number;
  h: number;
  cx: number; // centre in source-image px
  cy: number;
  ox: number; // live offset in CSS px
  oy: number;
  vx: number; // velocity in CSS px/s
  vy: number;
}

export function FooterWordmark({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const interactive =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduceMotion;

    let segments: Segment[] = [];
    let inkColor = "rgb(226, 230, 233)";
    let image: HTMLImageElement | null = null;

    let k = 1; // source-image px -> CSS px
    let dispW = 0;
    let dispH = 0;
    let dpr = 1;

    let raf = 0;
    let running = false;
    let lastT = 0;
    let destroyed = false;

    // Pointer state (CSS px, relative to the canvas).
    let px = 0;
    let py = 0;
    let hasPointer = false;
    let lastMoveT = 0;

    // ---- 1. Extract horizontal segments from the source art ----------------
    function extract(img: HTMLImageElement) {
      const off = document.createElement("canvas");
      off.width = SRC_W;
      off.height = SRC_H;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      octx.drawImage(img, 0, 0, SRC_W, SRC_H);
      const { data } = octx.getImageData(0, 0, SRC_W, SRC_H);

      const isInk = (x: number, y: number) => {
        const i = (y * SRC_W + x) * 4;
        const a = data[i + 3] / 255;
        const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) * a;
        return lum > 90;
      };

      // 1a. Group rows into stripe bands (gaps between stripes are dark rows).
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

      // 1b. Within each band find horizontal runs, then slice long runs.
      const segs: Segment[] = [];
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
            const runW = x - runStart;
            const pieces = Math.max(1, Math.round(runW / PIECE_W));
            const pw = runW / pieces;
            for (let p = 0; p < pieces; p++) {
              const sx = runStart + p * pw;
              segs.push({
                x: sx,
                y: y0,
                w: pw,
                h,
                cx: sx + pw / 2,
                cy: y0 + h / 2,
                ox: 0,
                oy: 0,
                vx: 0,
                vy: 0,
              });
            }
            runStart = -1;
          }
        }
      }

      // 1c. Average the strong-ink colour so the rebuild matches the art.
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
      segments = segs;
    }

    // ---- 2. Sizing --------------------------------------------------------
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width) return;
      dispW = rect.width;
      dispH = rect.height || rect.width * (SRC_H / SRC_W);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(dispW * dpr);
      canvas.height = Math.round(dispH * dpr);
      k = dispW / SRC_W;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    // ---- 3. Render --------------------------------------------------------
    const draw = () => {
      ctx.clearRect(0, 0, dispW, dispH);

      if (!segments.length) {
        if (image) ctx.drawImage(image, 0, 0, dispW, dispH);
        return;
      }

      // Base pass: opaque so 1px overlaps between pieces stay seamless at rest.
      ctx.fillStyle = inkColor;
      for (const s of segments) {
        ctx.fillRect(s.x * k + s.ox, s.y * k + s.oy, s.w * k + 1, s.h * k);
      }

      // Highlight pass: barely brighten only the lines that are moving.
      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      for (const s of segments) {
        if (s.ox > 2 || s.ox < -2 || s.oy > 2 || s.oy < -2) {
          ctx.fillRect(s.x * k + s.ox, s.y * k + s.oy, s.w * k + 1, s.h * k);
        }
      }
    };

    // ---- 4. Simulation ----------------------------------------------------
    function step(t: number) {
      if (destroyed) return;
      if (!lastT) lastT = t;
      let dt = (t - lastT) / 1000;
      lastT = t;
      if (dt > 0.05) dt = 0.05; // guard against tab-switch jumps

      let moving = false;
      for (const s of segments) {
        const ax = -SPRING_K * s.ox - SPRING_D * s.vx;
        const ay = -SPRING_K * s.oy - SPRING_D * s.vy;
        s.vx += ax * dt;
        s.vy += ay * dt;
        if (s.vx > MAX_VELOCITY) s.vx = MAX_VELOCITY;
        else if (s.vx < -MAX_VELOCITY) s.vx = -MAX_VELOCITY;
        if (s.vy > MAX_VELOCITY) s.vy = MAX_VELOCITY;
        else if (s.vy < -MAX_VELOCITY) s.vy = -MAX_VELOCITY;
        s.ox += s.vx * dt;
        s.oy += s.vy * dt;
        if (s.ox > MAX_OFFSET) s.ox = MAX_OFFSET;
        else if (s.ox < -MAX_OFFSET) s.ox = -MAX_OFFSET;
        if (s.oy > MAX_OFFSET) s.oy = MAX_OFFSET;
        else if (s.oy < -MAX_OFFSET) s.oy = -MAX_OFFSET;

        if (
          !moving &&
          (s.ox > 0.12 ||
            s.ox < -0.12 ||
            s.oy > 0.12 ||
            s.oy < -0.12 ||
            s.vx > 2 ||
            s.vx < -2 ||
            s.vy > 2 ||
            s.vy < -2)
        ) {
          moving = true;
        }
      }

      draw();

      if (!moving && !hasPointer) {
        for (const s of segments) {
          s.ox = 0;
          s.oy = 0;
          s.vx = 0;
          s.vy = 0;
        }
        draw();
        running = false;
        return;
      }
      raf = requestAnimationFrame(step);
    }

    function ensureRunning() {
      if (running) return;
      running = true;
      lastT = 0;
      raf = requestAnimationFrame(step);
    }

    // ---- 5. Pointer -------------------------------------------------------
    const localPoint = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    function onEnter(e: PointerEvent) {
      const p = localPoint(e);
      px = p.x;
      py = p.y;
      lastMoveT = performance.now();
      hasPointer = true;
    }

    function onMove(e: PointerEvent) {
      const p = localPoint(e);
      const now = performance.now();
      const dtm = hasPointer ? Math.max((now - lastMoveT) / 1000, 0.001) : 0.016;
      let pvx = hasPointer ? (p.x - px) / dtm : 0;
      let pvy = hasPointer ? (p.y - py) / dtm : 0;
      px = p.x;
      py = p.y;
      lastMoveT = now;
      hasPointer = true;

      let speed = Math.hypot(pvx, pvy);
      if (speed > POINTER_SPEED_CAP) {
        const s = POINTER_SPEED_CAP / speed;
        pvx *= s;
        pvy *= s;
        speed = POINTER_SPEED_CAP;
      }

      const r2 = RADIUS * RADIUS;
      for (const seg of segments) {
        const dx = seg.cx * k + seg.ox - p.x;
        const dy = seg.cy * k + seg.oy - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const d = Math.sqrt(d2);
        let force = 1 - d / RADIUS;
        force *= force; // sharpen locality
        const dirY = dy >= 0 ? 1 : -1;
        // Follow the pointer + push perpendicular so swiping across "plucks".
        seg.vy += (pvy * 0.45 + dirY * speed * 0.16) * force;
        seg.vx += pvx * 0.18 * force;
      }
      ensureRunning();
    }

    function onLeave() {
      hasPointer = false;
      ensureRunning();
    }

    // ---- 6. Boot ----------------------------------------------------------
    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (destroyed) return;
      image = img;
      extract(img);
      resize();
    };
    img.src = SRC;

    if (interactive) {
      canvas.addEventListener("pointerenter", onEnter);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);
    }

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (interactive) {
        canvas.removeEventListener("pointerenter", onEnter);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerleave", onLeave);
      }
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={cn("relative w-full", className)}
      style={{ aspectRatio: `${SRC_W} / ${SRC_H}` }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ touchAction: "pan-y" }}
      />
    </div>
  );
}
