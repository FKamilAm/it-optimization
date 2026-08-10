import type { Client, Lead, Project, Task, User } from "@prisma/client";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { startOfToday, startOfTomorrow } from "../notify/zone.js";
import { OPEN_LEAD_STATUSES } from "./leads/dto.js";
import { currentPeriod, OPEN_PROJECT_STATUSES } from "./projects/dto.js";
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

export interface TodaySnapshot {
  leads: {
    /** Мои, срок следующего шага прошёл. */
    overdue: LeadFull[];
    /** Мои, шаг запланирован на сегодня. */
    today: LeadFull[];
    /** Ничьи с наступившим сроком — их не увидит никто, кроме как здесь. */
    orphanUrgent: LeadFull[];
    /** Пришёл, никто не взял, срок не поставлен. Самое опасное состояние. */
    unclaimed: LeadFull[];
  };
  /**
   * Задачи и проекты не фильтруются по человеку: разработчики значатся
   * именами, а не учётными записями, и связать читающего с именем нельзя.
   * Под общим входом это и правильно — экран показывает всё, что горит.
   */
  tasks: {
    overdue: TaskFull[];
    today: TaskFull[];
  };
  projects: {
    /** Срок сдачи прошёл или наступает сегодня. Показываем всем: проектов мало. */
    urgent: ProjectFull[];
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
} as const;

export async function collectToday(userId: string): Promise<TodaySnapshot> {
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
  ] = await Promise.all([
    prisma.lead.findMany({
      where: {
        deletedAt: null,
        status: openLeads,
        ownerId: userId,
        nextActionAt: { lt: from },
      },
      orderBy: { nextActionAt: "asc" },
      include: LEAD_INCLUDE,
    }),
    prisma.lead.findMany({
      where: {
        deletedAt: null,
        status: openLeads,
        ownerId: userId,
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
      where: {
        deletedAt: null,
        status: openTasks,
        dueAt: { lt: from },
      },
      orderBy: { dueAt: "asc" },
      include: TASK_INCLUDE,
    }),
    prisma.task.findMany({
      where: {
        deletedAt: null,
        status: openTasks,
        dueAt: { gte: from, lt: until },
      },
      orderBy: [{ priority: "desc" }, { position: "asc" }],
      include: TASK_INCLUDE,
    }),
    prisma.project.findMany({
      where: { deletedAt: null, status: openProjects, deadline: { lt: until } },
      orderBy: { deadline: "asc" },
      include: PROJECT_INCLUDE,
    }),
  ]);

  return {
    leads: { overdue: overdueLeads, today: todayLeads, orphanUrgent, unclaimed },
    tasks: { overdue: overdueTasks, today: todayTasks },
    projects: { urgent: urgentProjects },
  };
}

export interface TeamSnapshot {
  /** Просрочено у всех разом, с указанием, на ком висит. */
  leads: { overdue: LeadFull[]; unclaimed: LeadFull[] };
  tasks: { overdue: TaskFull[] };
  projects: {
    urgent: ProjectFull[];
    /**
     * Помесячные проекты, по которым за текущий месяц счёта ещё нет. Ради
     * этого напоминания счета и заводятся: забытый счёт — это прямые
     * недополученные деньги, и заметить его иначе нечем.
     */
    unbilled: ProjectFull[];
  };
  /** Период, за который проверялось выставление, — вида «2026-08». */
  period: string;
}

/**
 * Срез по всей команде — для общего чата. Отличается от личного не оформлением,
 * а смыслом: тут важно не «что делать мне», а «что не движется у нас» и на ком
 * это висит. Поэтому выборки без фильтра по человеку, зато с именами.
 */
export async function collectTeamToday(): Promise<TeamSnapshot> {
  const from = startOfToday(env.TIMEZONE);
  const until = startOfTomorrow(env.TIMEZONE);

  const openLeads = { in: [...OPEN_LEAD_STATUSES] };
  const openTasks = { in: [...OPEN_TASK_STATUSES] };
  const openProjects = { in: [...OPEN_PROJECT_STATUSES] };

  const period = currentPeriod(env.TIMEZONE);

  const [overdueLeads, unclaimed, overdueTasks, urgentProjects, unbilled] =
    await Promise.all([
      prisma.lead.findMany({
        where: { deletedAt: null, status: openLeads, nextActionAt: { lt: from } },
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
      prisma.project.findMany({
        where: { deletedAt: null, status: openProjects, deadline: { lt: until } },
        orderBy: { deadline: "asc" },
        include: PROJECT_INCLUDE,
      }),
      // `none` вместо выборки всех счетов и фильтрации в коде: условие «нет
      // записи за этот период» база проверяет сама, одним запросом.
      prisma.project.findMany({
        where: {
          deletedAt: null,
          status: openProjects,
          billingMonthly: true,
          invoices: { none: { kind: "invoice", period } },
        },
        orderBy: { title: "asc" },
        include: PROJECT_INCLUDE,
      }),
    ]);

  return {
    leads: { overdue: overdueLeads, unclaimed },
    tasks: { overdue: overdueTasks },
    projects: { urgent: urgentProjects, unbilled },
    period,
  };
}

export function isEmptyTeamSnapshot(snapshot: TeamSnapshot): boolean {
  return (
    snapshot.leads.overdue.length === 0 &&
    snapshot.leads.unclaimed.length === 0 &&
    snapshot.tasks.overdue.length === 0 &&
    snapshot.projects.urgent.length === 0 &&
    snapshot.projects.unbilled.length === 0
  );
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
    snapshot.projects.urgent.length === 0
  );
}
