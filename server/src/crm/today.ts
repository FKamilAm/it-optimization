import type { Client, Lead, Project, Task, User } from "@prisma/client";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { startOfToday, startOfTomorrow } from "../notify/zone.js";
import { OPEN_LEAD_STATUSES } from "./leads/dto.js";
import { OPEN_PROJECT_STATUSES, unbilled } from "./projects/dto.js";
import { OPEN_TASK_STATUSES } from "./tasks/dto.js";

/**
 * Один источник правды для «что горит»: и утренний дайджест бота, и экран
 * «Сегодня» показывают одно и то же. Две копии этих запросов разошлись бы за
 * месяц, и человек получал бы в телеграме не то, что видит в браузере.
 *
 * «Сегодня» и «просрочено» считаются календарными сутками в часовом поясе
 * команды, а не 24 часами от текущего момента.
 */

type LeadFull = Lead & {
  owner: Pick<User, "id" | "name" | "email"> | null;
  client: Pick<Client, "id" | "name"> | null;
};

type TaskFull = Task & {
  project: Pick<Project, "id" | "title"> | null;
};

type ProjectFull = Project & {
  client: Pick<Client, "id" | "name"> | null;
  lead: Pick<Lead, "id" | "contact" | "name"> | null;
  tasks: { status: string }[];
};

/**
 * Срез «что горит» — общий для всей команды.
 *
 * Раньше он делился на личный и командный, но личного больше нет: разработчики
 * работают под общим входом и значатся именами, так что «мои задачи» выразить
 * нечем. Один срез вместо двух — и экран с ботом гарантированно показывают
 * одно и то же.
 */
export interface TodaySnapshot {
  leads: {
    /** Срок следующего шага прошёл — у кого угодно. */
    overdue: LeadFull[];
    today: LeadFull[];
    /** Ничьи с наступившим сроком: про них не вспомнит вообще никто. */
    orphanUrgent: LeadFull[];
    /** Пришёл, никто не взял, срок не поставлен. Самое опасное состояние. */
    unclaimed: LeadFull[];
  };
  tasks: {
    overdue: TaskFull[];
    today: TaskFull[];
  };
  projects: {
    /** Срок сдачи прошёл или наступает сегодня. */
    urgent: ProjectFull[];
    /** Помесячные, по которым есть неоплаченный пробел — с самого раннего. */
    unbilled: (ProjectFull & { unbilledPeriod: string; unbilledCount: number })[];
  };
}

const LEAD_INCLUDE = {
  owner: { select: { id: true, name: true, email: true } },
  client: { select: { id: true, name: true } },
} as const;

const TASK_INCLUDE = {
  project: { select: { id: true, title: true } },
} as const;

const PROJECT_INCLUDE = {
  client: { select: { id: true, name: true } },
  lead: { select: { id: true, contact: true, name: true } },
  tasks: { where: { deletedAt: null }, select: { status: true } },
  invoices: { select: { kind: true, period: true } },
} as const;

export async function collectToday(): Promise<TodaySnapshot> {
  const from = startOfToday(env.TIMEZONE);
  const until = startOfTomorrow(env.TIMEZONE);

  const openLeads = { in: [...OPEN_LEAD_STATUSES] };
  const openTasks = { in: [...OPEN_TASK_STATUSES] };
  const openProjects = { in: [...OPEN_PROJECT_STATUSES] };

  const [
    overdueLeads,
    todayLeads,
    orphanUrgent,
    unclaimed,
    overdueTasks,
    todayTasks,
    urgentProjects,
    monthlyProjects,
  ] = await Promise.all([
    prisma.lead.findMany({
      where: { deletedAt: null, status: openLeads, nextActionAt: { lt: from } },
      orderBy: { nextActionAt: "asc" },
      include: LEAD_INCLUDE,
    }),
    prisma.lead.findMany({
      where: {
        deletedAt: null,
        status: openLeads,
        nextActionAt: { gte: from, lt: until },
      },
      orderBy: { nextActionAt: "asc" },
      include: LEAD_INCLUDE,
    }),
    prisma.lead.findMany({
      where: {
        deletedAt: null,
        status: openLeads,
        ownerId: null,
        nextActionAt: { lt: until },
      },
      orderBy: { nextActionAt: "asc" },
      include: LEAD_INCLUDE,
    }),
    prisma.lead.findMany({
      where: { deletedAt: null, status: "new", ownerId: null, nextActionAt: null },
      orderBy: { createdAt: "asc" },
      include: LEAD_INCLUDE,
    }),
    prisma.task.findMany({
      where: { deletedAt: null, status: openTasks, dueAt: { lt: from } },
      orderBy: { dueAt: "asc" },
      include: TASK_INCLUDE,
    }),
    prisma.task.findMany({
      where: { deletedAt: null, status: openTasks, dueAt: { gte: from, lt: until } },
      orderBy: [{ priority: "desc" }, { position: "asc" }],
      include: TASK_INCLUDE,
    }),
    prisma.project.findMany({
      where: { deletedAt: null, status: openProjects, deadline: { lt: until } },
      orderBy: { deadline: "asc" },
      include: PROJECT_INCLUDE,
    }),
    // Пробелы считаются в коде, а не запросом: «нет счёта за любой месяц с
    // начала работ» через SQL выражается плохо, а помесячных проектов у
    // команды десятки, не тысячи.
    prisma.project.findMany({
      where: { deletedAt: null, status: openProjects, billingMonthly: true },
      orderBy: { title: "asc" },
      include: PROJECT_INCLUDE,
    }),
  ]);

  const unbilledProjects = monthlyProjects
    .map((project) => ({
      ...project,
      ...unbilled(project, project.invoices, env.TIMEZONE),
    }))
    .filter(
      (project): project is (typeof monthlyProjects)[number] & {
        period: string;
        count: number;
      } => project.period !== null,
    )
    .map(({ period, count, ...project }) => ({
      ...project,
      unbilledPeriod: period,
      unbilledCount: count,
    }));

  return {
    leads: { overdue: overdueLeads, today: todayLeads, orphanUrgent, unclaimed },
    tasks: { overdue: overdueTasks, today: todayTasks },
    projects: { urgent: urgentProjects, unbilled: unbilledProjects },
  };
}

/** Пусто — значит напоминать не о чем: бот в этом случае молчит. */
export function isEmptySnapshot(snapshot: TodaySnapshot): boolean {
  return (
    snapshot.leads.overdue.length === 0 &&
    snapshot.leads.today.length === 0 &&
    snapshot.leads.orphanUrgent.length === 0 &&
    snapshot.leads.unclaimed.length === 0 &&
    snapshot.tasks.overdue.length === 0 &&
    snapshot.tasks.today.length === 0 &&
    snapshot.projects.urgent.length === 0 &&
    snapshot.projects.unbilled.length === 0
  );
}
