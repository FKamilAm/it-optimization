import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import { authRoutes } from "./auth/routes.js";
import { caseRoutes } from "./cases/routes.js";
import { env, isProduction } from "./env.js";
import { publishRoutes } from "./publish/routes.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: isProduction
      ? { level: "info" }
      : { level: "info", transport: { target: "pino-pretty" } },
    trustProxy: isProduction,
    bodyLimit: 2 * 1024 * 1024,
  });

  // Куки ходят между поддоменами (сайт и API), поэтому нужен явный origin —
  // с credentials браузер не примет «*».
  await app.register(cors, {
    origin: env.WEB_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  await app.register(cookie);
  await app.register(multipart, { limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 } });
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });

  // Обязательно до регистрации маршрутов: дочерние контексты наследуют
  // обработчик в момент своей регистрации, и поставленный позже до них не
  // дойдёт — наружу полетят внутренние тексты ошибок (пути, адрес базы).
  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error({ error }, "необработанная ошибка");
    const status = error.statusCode ?? 500;
    // Наружу — только безопасный текст: детали остаются в логах.
    reply.code(status).send({
      error: status < 500 ? error.message : "Внутренняя ошибка сервера",
    });
  });

  app.get("/health", async () => ({ ok: true }));

  await app.register(authRoutes);
  await app.register(caseRoutes);
  await app.register(publishRoutes);

  return app;
}
