"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Art drawn from horizontal stripes whose pieces spring like plucked strings
 * when the pointer passes over them. Shared by the footer wordmark (stripes
 * read from a pre-rendered image) and the 404/403 digits (stripes cut from a
 * typeset string), so both feel exactly the same under the hand.
 *
 * The art arrives as plain horizontal runs; this component slices long runs
 * into short pieces so a wave can ripple along a stroke, and owns sizing,
 * rendering and the spring simulation.
 */

export interface StripeRun {
  /** Geometry in source-art px. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Index into `StripeArt.tones`. */
  tone: number;
}

export interface StripeTone {
  /** Colour at rest. */
  fill: string;
  /** Overlay painted on top of pieces that are currently moving. */
  active: string;
}

export interface StripeArt {
  /** Source-art size; it is scaled to fit the box, centred. */
  width: number;
  height: number;
  runs: StripeRun[];
  tones: StripeTone[];
}

interface PluckedStripesProps {
  /** Builds the art once on mount. May wait for an image or a font. */
  load: () => Promise<StripeArt | null>;
  /** Box proportions, so layout is reserved before the art exists. */
  aspectRatio: number;
  /** How wide (in source px) a single pluckable piece may be. */
  pieceWidth: number;
  /** Pointer influence radius, CSS px. */
  radius?: number;
  /** Hard cap so glyphs never visibly break apart, CSS px. */
  maxOffset?: number;
  /** React to the pointer at all; off for purely decorative copies. */
  interactive?: boolean;
  /** Also react to touch, not only to a hovering mouse. */
  touch?: boolean;
  /** One pluck sweeping across the art once it appears — shows it is alive. */
  intro?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface Segment {
  x: number; // geometry in source-art px
  y: number;
  w: number;
  h: number;
  cx: number; // centre in source-art px
  cy: number;
  tone: number;
  ox: number; // live offset in CSS px
  oy: number;
  vx: number; // velocity in CSS px/s
  vy: number;
}

// Physics tuning. Distances/offsets are in CSS px.
const MAX_VELOCITY = 280;
const SPRING_K = 190; // stiffness  -> ~2.2 Hz
const SPRING_D = 8.5; // damping    -> a couple of soft oscillations, then rest
const POINTER_SPEED_CAP = 1600;
const INTRO_MS = 1100;

export function PluckedStripes({
  load,
  aspectRatio,
  pieceWidth,
  radius = 90,
  maxOffset = 13,
  interactive: pointerEffects = true,
  touch = false,
  intro = false,
  className,
  style,
}: PluckedStripesProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadRef = useRef(load);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const interactive = pointerEffects && (canHover || touch) && !reduceMotion;

    let segments: Segment[] = [];
    let tones: StripeTone[] = [];
    let artW = 0;
    let artH = 0;

    let k = 1; // source-art px -> CSS px
    let left = 0; // art offset inside the box, CSS px
    let top = 0;
    let dispW = 0;
    let dispH = 0;
    let dpr = 1;

    let raf = 0;
    let running = false;
    let lastT = 0;
    let destroyed = false;
    let introRaf = 0;
    let introTimer = 0;

    // Pointer state (CSS px, relative to the canvas).
    let px = 0;
    let py = 0;
    let hasPointer = false;
    let lastMoveT = 0;

    // ---- 1. Slice runs into pluckable pieces -------------------------------
    function build(art: StripeArt) {
      const segs: Segment[] = [];
      for (const run of art.runs) {
        const pieces = Math.max(1, Math.round(run.w / pieceWidth));
        const pw = run.w / pieces;
        for (let p = 0; p < pieces; p++) {
          const sx = run.x + p * pw;
          segs.push({
            x: sx,
            y: run.y,
            w: pw,
            h: run.h,
            cx: sx + pw / 2,
            cy: run.y + run.h / 2,
            tone: run.tone,
            ox: 0,
            oy: 0,
            vx: 0,
            vy: 0,
          });
        }
      }
      segments = segs;
      tones = art.tones;
      artW = art.width;
      artH = art.height;
    }

    // ---- 2. Sizing --------------------------------------------------------
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width) return;
      dispW = rect.width;
      dispH = rect.height || rect.width / aspectRatio;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(dispW * dpr);
      canvas.height = Math.round(dispH * dpr);
      if (artW && artH) {
        k = Math.min(dispW / artW, dispH / artH);
        left = (dispW - artW * k) / 2;
        top = (dispH - artH * k) / 2;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    // ---- 3. Render --------------------------------------------------------
    // Thick stripes snap their top and bottom edges to device pixels: pieces
    // overlap by 1px, and two half-transparent anti-aliased edges stacked there
    // show as dark ticks along a stripe that should read as one line. Hairline
    // stripes (the footer wordmark) keep fractional edges — rounded, some would
    // come out 1px and some 2px thick.
    const snap = (v: number) => Math.round(v * dpr) / dpr;
    const fillSegment = (s: Segment) => {
      const x = left + s.x * k + s.ox;
      const y = top + s.y * k + s.oy;
      const h = s.h * k;
      if (h * dpr < 3) {
        ctx.fillRect(x, y, s.w * k + 1, h);
        return;
      }
      const y0 = snap(y);
      ctx.fillRect(x, y0, s.w * k + 1, snap(y + h) - y0);
    };

    const draw = () => {
      // Clear in backing pixels: with a fractional CSS width the last column is
      // only half-cleared, and moving pieces leave a smear there frame by frame.
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Base pass: opaque so 1px overlaps between pieces stay seamless at rest.
      for (let t = 0; t < tones.length; t++) {
        ctx.fillStyle = tones[t].fill;
        for (const s of segments) {
          if (s.tone === t) fillSegment(s);
        }
      }

      // Highlight pass: barely tint only the lines that are moving.
      for (let t = 0; t < tones.length; t++) {
        ctx.fillStyle = tones[t].active;
        for (const s of segments) {
          if (s.tone !== t) continue;
          if (s.ox > 2 || s.ox < -2 || s.oy > 2 || s.oy < -2) fillSegment(s);
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
        if (s.ox > maxOffset) s.ox = maxOffset;
        else if (s.ox < -maxOffset) s.ox = -maxOffset;
        if (s.oy > maxOffset) s.oy = maxOffset;
        else if (s.oy < -maxOffset) s.oy = -maxOffset;

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

      if (!moving && !hasPointer && !introRaf) {
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

    // Kick every piece near (x, y) with the pointer's velocity.
    function pluck(x: number, y: number, pvx: number, pvy: number) {
      let speed = Math.hypot(pvx, pvy);
      if (speed > POINTER_SPEED_CAP) {
        const s = POINTER_SPEED_CAP / speed;
        pvx *= s;
        pvy *= s;
        speed = POINTER_SPEED_CAP;
      }

      const r2 = radius * radius;
      for (const seg of segments) {
        const dx = left + seg.cx * k + seg.ox - x;
        const dy = top + seg.cy * k + seg.oy - y;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const d = Math.sqrt(d2);
        let force = 1 - d / radius;
        force *= force; // sharpen locality
        const dirY = dy >= 0 ? 1 : -1;
        // Follow the pointer + push perpendicular so swiping across "plucks".
        seg.vy += (pvy * 0.45 + dirY * speed * 0.16) * force;
        seg.vx += pvx * 0.18 * force;
      }
      ensureRunning();
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
      const pvx = hasPointer ? (p.x - px) / dtm : 0;
      const pvy = hasPointer ? (p.y - py) / dtm : 0;
      px = p.x;
      py = p.y;
      lastMoveT = now;
      hasPointer = true;
      pluck(p.x, p.y, pvx, pvy);
    }

    function onLeave() {
      hasPointer = false;
      ensureRunning();
    }

    // A virtual pointer crossing the art left to right on a soft wave.
    function playIntro() {
      const start = performance.now();
      let lx = -radius;
      let ly = dispH / 2;
      let lt = start;
      const tick = (now: number) => {
        if (destroyed) return;
        const t = Math.min((now - start) / INTRO_MS, 1);
        const x = -radius + (dispW + radius * 2) * t;
        const y = dispH / 2 + Math.sin(t * Math.PI * 3) * dispH * 0.28;
        const dts = Math.max((now - lt) / 1000, 0.001);
        pluck(x, y, (x - lx) / dts, (y - ly) / dts);
        lx = x;
        ly = y;
        lt = now;
        introRaf = t < 1 ? requestAnimationFrame(tick) : 0;
      };
      introRaf = requestAnimationFrame(tick);
    }

    // ---- 6. Boot ----------------------------------------------------------
    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);

    loadRef.current().then((art) => {
      if (destroyed || !art) return;
      build(art);
      resize();
      setReady(true);
      if (intro && pointerEffects && !reduceMotion)
        introTimer = window.setTimeout(playIntro, 350);
    });

    if (interactive) {
      canvas.addEventListener("pointerenter", onEnter);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);
      canvas.addEventListener("pointercancel", onLeave);
    }

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(introRaf);
      window.clearTimeout(introTimer);
      ro.disconnect();
      if (interactive) {
        canvas.removeEventListener("pointerenter", onEnter);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerleave", onLeave);
        canvas.removeEventListener("pointercancel", onLeave);
      }
    };
  }, [aspectRatio, pieceWidth, radius, maxOffset, pointerEffects, touch, intro]);

  return (
    <div
      ref={wrapRef}
      className={cn("relative w-full", className)}
      style={{ aspectRatio, ...style }}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-500",
          ready ? "opacity-100" : "opacity-0",
        )}
        style={{ touchAction: "pan-y" }}
      />
    </div>
  );
}
