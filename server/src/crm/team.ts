import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth/guard.js";
import { prisma } from "../db.js";

/**
 * Список команды для выпадающих «кто ведёт» и «исполнитель». Отдаёт только имя
 * и почту: это справочник для интерфейса, а не управление пользователями —
 * ролей и дат входа тут быть не должно.
 */
export async function teamRoutes(app: FastifyInstance): Promise<void> {
  app.get("/team", { preHandler: requireAuth }, async (_request, reply) => {
    const users = await prisma.user.findMany({
      where: { disabledAt: null },
      select: { id: true, name: true, email: true },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    });
    return reply.send({ team: users });
  });
}
