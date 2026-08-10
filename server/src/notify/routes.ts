import { randomInt } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { requireTeam } from "../auth/guard.js";
import { prisma } from "../db.js";
import { canNotify } from "../env.js";

/**
 * Привязка телеграма — только для команды.
 *
 * Бот шлёт сводку по всем проектам, задачам и деньгам; маркетолог ведёт лиды и
 * этой картины видеть не должен. Раз сводка общая, привязываться к боту ему
 * незачем.
 */

/** Код живёт недолго: его успевают переслать боту, но не успевают потерять. */
const CODE_TTL_MINUTES = 15;

/**
 * Без похожих друг на друга символов: код диктуют вслух и набирают руками,
 * а «0/O» и «1/I/l» в такой ситуации путают гарантированно.
 */
const ALPHABET = "ACDEFGHJKMNPQRTUVWXY34679";

function generateCode(): string {
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

export async function telegramRoutes(app: FastifyInstance): Promise<void> {
  app.get("/telegram/status", { preHandler: requireTeam }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: { telegramChatId: true },
    });
    return reply.send({ available: canNotify, connected: Boolean(user?.telegramChatId) });
  });

  app.post("/telegram/link-code", { preHandler: requireTeam }, async (request, reply) => {
    if (!canNotify) {
      return reply.code(503).send({ error: "Бот не настроен на сервере" });
    }

    // Уникальность кода обеспечена индексом; на 25^6 вариантов и трёх
    // пользователей повтор практически невозможен, но если он случится —
    // запрос просто повторят.
    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

    await prisma.user.update({
      where: { id: request.user!.id },
      data: { telegramLinkCode: code, telegramLinkExpiresAt: expiresAt },
    });

    return reply.send({ code, expiresAt: expiresAt.toISOString() });
  });

  app.post("/telegram/unlink", { preHandler: requireTeam }, async (request, reply) => {
    await prisma.user.update({
      where: { id: request.user!.id },
      data: { telegramChatId: null, telegramLinkCode: null, telegramLinkExpiresAt: null },
    });
    return reply.code(204).send();
  });
}
