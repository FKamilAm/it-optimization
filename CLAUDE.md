# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Marketing landing site for the IT company «Айти-Оптимизация» (it-optimization.ru). Russian-only, **no backend**: there is no contact form and no API routes — leads are captured through direct links into messengers (Telegram, WhatsApp, MAX), phone, and email. The whole site is a **static export** (`out/` folder of plain HTML/CSS/JS) uploaded to shared hosting.

## Commands

```bash
npm run dev      # dev server at localhost:3000
npm run build    # runs scripts/generate-og.mjs, then `next build` → static export to out/
npm run start    # serve a production build via Node (not used for deploy — export is static)
npm run lint     # ESLint (next lint)
npm run format   # Prettier over src/**/*.{ts,tsx,css,json}
```

There is **no test suite**. Verify changes by running `npm run dev` (or `npm run build` for export-only issues) and inspecting the site.

Utility scripts (run manually, not part of normal dev):
- `node scripts/generate-og.mjs` — composites `public/LOGO.svg` onto a 1200×630 canvas → `public/og-image.webp` (also runs automatically before every build).
- `node scripts/convert-cases.mjs` — converts new PNGs in `public/cases/` to WebP and deletes the PNGs.
- `python scripts/ftp-upload.py` — uploads `out/` to reg.ru hosting over FTP (needs `FTP_PASSWORD` env var). This is the deploy step.

## Architecture

**Framework:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4. Import alias `@/*` → `src/*`.

**Static-export constraints (`next.config.ts`):** `output: "export"` — no server runtime, so no API routes, no server actions, no `next/image` optimization (`images.unoptimized: true`), no runtime env reads. `trailingSlash: true` makes each route a folder with `index.html` so clean URLs resolve without rewrites. Any new dynamic route must be fully enumerable at build time via `generateStaticParams`.

**Routes (`src/app/`):**
- `/` (`page.tsx`) — the one-page homepage. Composes section components; every section below the hero is `dynamic()`-imported and wrapped in a `.section-defer` (content-visibility) div for lazy rendering.
- `/uslugi/[slug]` — one SEO page per service. Slugs are **not** free-form: they come from `SERVICE_PAGES` in `src/lib/constants.ts` (service key → slug), `dynamicParams = false`, and `generateStaticParams` enumerates them. Adding a service page = add an entry to `SERVICE_PAGES` **and** a `servicePages.<key>` block in `messages/ru.json`.
- `/proekty` — projects/cases catalog.
- `/blog` + `/blog/[slug]` — blog listing and per-article pages. Posts are enumerated in `BLOG_POSTS` (`src/lib/constants.ts`: key → slug → cover), `dynamicParams = false`, article content lives in the `blog.posts.<key>` block of `messages/ru.json`, and covers are hand-drawn SVGs in `public/blog/`. Adding a post = add a `BLOG_POSTS` entry, a `blog.posts.<key>` catalog block, and a cover SVG.
- `robots.ts`, `sitemap.ts` — generated SEO endpoints.

**Content / i18n:** All user-facing copy lives in `messages/ru.json` and is read through `next-intl`. This is a **single-locale (RU) setup used purely as a string catalogue** — no i18n routing, no locale switching, no middleware (`src/i18n/request.ts` hardcodes `"ru"`). Never hardcode Russian strings in components; add them to the catalog and read with `useTranslations` / `getTranslations`.

**Page frames:** The homepage builds its own frame inline in `page.tsx` (it owns the preloader). Subpages use `SiteShell` (`src/components/layout/site-shell.tsx`), which passes `sectionPrefix="/"` to the header so nav links point back to homepage `#anchors`. Both wrap content in `SmoothScrollProvider` (Lenis) + `ContactModalProvider`.

**Contact channels:** Defined once in `CONTACT_CHANNELS` (`src/lib/constants.ts`). Each channel has an `action`: `"link"` (open directly — Telegram/WhatsApp) or `"copy"` (show a popover with a copy button — phone/email/MAX, which have no chat link). `withStarterMessage()` appends a pre-filled `?text=` draft, but only for Telegram/WhatsApp. `ORG`/`SITE` constants also hold legal entity data used in structured data.

**3D & animation:** three.js / react-three-fiber power the hero logo and per-service hero scenes. This stack is **always** loaded via `dynamic(() => ..., { ssr: false })` and guarded by a `WebGLBoundary` error boundary + a runtime `hasWebGL()` check, falling back to a static component (see `hero-logo.tsx`, `service-hero-visual.tsx`). Service hero variants map to scenes in `src/components/service-hero/scenes/`. Motion uses Framer Motion + GSAP/ScrollTrigger + Lenis smooth scroll.

**Reduced-motion / device gating:** `src/lib/utils.ts` exports `prefersReducedMotion()`, `canUsePointerEffects()` (desktop + fine pointer + no reduced-motion), and `cn()` (clsx + tailwind-merge). Gate all magnetic/tilt/parallax pointer effects behind `canUsePointerEffects()`.

**Styling:** Tailwind CSS 4 configured entirely in `src/app/globals.css` via `@theme inline` (there is no `tailwind.config`). Design tokens (colors, radii, section spacing, container width) are CSS variables defined there — the brand accent is `--accent: #b4e02d`. Fonts: Manrope (sans) + Unbounded (display), loaded via `next/font/google` in `layout.tsx` with Cyrillic subsets.

**SEO:** `layout.tsx` `generateMetadata` reads the `meta.*` catalog block; per-service pages emit `Service` / `BreadcrumbList` / `FAQPage` JSON-LD inline; `StructuredData` (`src/components/seo/structured-data.tsx`) emits org-level structured data. Keep `NEXT_PUBLIC_SITE_URL` correct — it feeds canonical URLs and OpenGraph.

## Environment

Copy `.env.example` → `.env.local`. All vars are public `NEXT_PUBLIC_*` (no secrets in the project); they configure the site URL and contact channel targets. Because the site is a static export, these are baked in at build time. The one non-public secret is `FTP_PASSWORD`, used only by the deploy script.

## Conventions

- Prettier: 2-space indent, double quotes, semicolons, trailing commas, `printWidth: 90`, with `prettier-plugin-tailwindcss` (class sorting). Run `npm run format` before committing.
- Server Components by default; add `"use client"` only for interactivity/animation/3D.
- Images are hand-optimized to WebP/AVIF and committed under `public/` — there is no image optimizer at runtime.
