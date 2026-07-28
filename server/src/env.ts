import { z } from "zod";

/**
 * Конфигурация читается один раз при старте и валидируется: сервис должен
 * падать сразу и с понятным текстом, а не через час на первом запросе.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1),

  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),

  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  COOKIE_DOMAIN: z.string().optional(),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(14),

  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(15 * 1024 * 1024),

  GITHUB_TOKEN: z.string().optional(),
  GITHUB_OWNER: z.string().default("FKamilAm"),
  GITHUB_REPO: z.string().default("it-optimization"),
  GITHUB_BRANCH: z.string().default("main"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Некорректная конфигурация (server/.env):\n${details}`);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";

/** Публикация работает, только если сервису выдан доступ к репозиторию. */
export const canPublish = Boolean(env.GITHUB_TOKEN);

if (isProduction && !env.COOKIE_SECURE) {
  // Не падаем: бывает деплой за доверенным прокси, который сам держит TLS.
  console.warn(
    "[config] NODE_ENV=production, но COOKIE_SECURE=false — сессионная кука уйдёт по HTTP.",
  );
}
