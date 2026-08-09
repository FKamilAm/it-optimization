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

/**
 * Доступ по ролям.
 *
 * Проверка обязана стоять здесь, а не в интерфейсе: спрятанный пункт меню
 * защищает от случайного клика, но не от человека, который откроет консоль
 * браузера и позовёт маршрут напрямую. Роль маркетолога только тогда что-то
 * значит, когда сервер сам отказывает.
 */
export function requireRole(
  ...allowed: AuthenticatedUser["role"][]
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  return async function guard(request, reply) {
    const user = await resolveUser(request);
    if (!user) {
      await reply.code(401).send({ error: "Не авторизован" });
      return;
    }
    if (!allowed.includes(user.role)) {
      await reply.code(403).send({ error: "Недостаточно прав" });
      return;
    }
    request.user = user;
  };
}

/**
 * Всё, что относится к работе команды: проекты, задачи, клиенты, кейсы сайта.
 * Маркетолог сюда не ходит — он ведёт только лиды.
 */
export const requireTeam = requireRole("owner", "editor");
