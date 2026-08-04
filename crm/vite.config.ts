import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

/**
 * CRM собирается в статику и лежит в корне поддомена crm.it-optimization.ru.
 * Серверного рантайма у неё нет — все данные приходят из API по HTTPS, поэтому
 * раздавать сборку может обычный хостинг.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  css: {
    // Пустой объект вместо поиска конфига: иначе Vite поднимается по дереву и
    // находит postcss.config.mjs сайта, рассчитанный на сборку Next. Здесь
    // PostCSS не нужен вовсе — Tailwind подключён плагином выше.
    postcss: {},
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
