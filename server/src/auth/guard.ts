import type { FastifyReply, FastifyRequest } from "fastify";
import { resolveUser, type AuthenticatedUser } from "./session.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

/**
 * preHandler для всего, что меняет контент. Кладёт пользователя в request,
 * чтобы обработчики не ходили в базу второй раз.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = await resolveUser(request);
  if (!user) {
    await reply.code(401).send({ error: "Не авторизован" });
    return;
  }
  request.user = user;
}
