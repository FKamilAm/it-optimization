import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Static export → produces an `out/` folder with plain HTML/CSS/JS that can be
  // uploaded to any shared hosting (reg.ru «Обычный хостинг»). No Node.js required.
  output: "export",
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  images: {
    // The export target has no image optimizer server, so images are served as-is.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
  },
};

export default withNextIntl(nextConfig);
