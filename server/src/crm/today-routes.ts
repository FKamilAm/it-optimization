import type { FastifyInstance } from "fastify";
import { env } from "../env.js";
import { requireTeam } from "../auth/guard.js";
import { toLeadDto } from "./leads/dto.js";
import { toProjectDto } from "./projects/dto.js";
import { toTaskDto } from "./tasks/dto.js";
import { collectToday, isEmptySnapshot } from "./today.js";

/**
 * Главный экран CRM. Отдаёт ровно то же, что бот присылает утром, — оба берут
 * данные из `collectToday`. Разница только в подаче: боту текст, экрану JSON.
 */
export async function todayRoutes(app: FastifyInstance): Promise<void> {
  app.get("/today", { preHandler: requireTeam }, async (_request, reply) => {
    const snapshot = await collectToday();

    return reply.send({
      empty: isEmptySnapshot(snapshot),
      leads: {
        overdue: snapshot.leads.overdue.map(toLeadDto),
        today: snapshot.leads.today.map(toLeadDto),
        orphanUrgent: snapshot.leads.orphanUrgent.map(toLeadDto),
        unclaimed: snapshot.leads.unclaimed.map(toLeadDto),
      },
      tasks: {
        overdue: snapshot.tasks.overdue.map(toTaskDto),
        today: snapshot.tasks.today.map(toTaskDto),
      },
      projects: {
        urgent: snapshot.projects.urgent.map((item) => toProjectDto(item, env.TIMEZONE)),
        unbilled: snapshot.projects.unbilled.map((item) => toProjectDto(item, env.TIMEZONE)),
      },
    });
  });
}
