import type { Client, Lead, Project } from "@prisma/client";
import { z } from "zod";
import { DEVELOPERS } from "../developers.js";
import { optionalDate, optionalText, optionalUuid, requiredTitle } from "../fields.js";

export const PROJECT_STATUSES = [
  "planned",
  "active",
  "on_hold",
  "done",
  "cancelled",
] as const;

/** Идущие: именно они должны попадаться на глаза каждый день. */
export const OPEN_PROJECT_STATUSES = ["planned", "active", "on_hold"] as const;
export const CLOSED_PROJECT_STATUSES = ["done", "cancelled"] as const;

const projectFields = {
  title: requiredTitle(200, "Без названия проект не найти"),
  description: optionalText(4000),
  status: z.enum(PROJECT_STATUSES),
  clientId: optionalUuid,
  leadId: optionalUuid,
  /// Кто ведёт. Список целиком: приходит новый состав, а не «добавь этого».
  /// Частичные операции над множеством порождают гонки, когда двое правят
  /// проект одновременно.
  developers: z.array(z.enum(DEVELOPERS)).max(10),
  startedAt: optionalDate,
  deadline: optionalDate,
};

export const createProjectBody = z
  .object(projectFields)
  .partial()
  .required({ title: true });

export const updateProjectBody = z.object(projectFields).partial();

export const listProjectsQuery = z.object({
  status: z.enum(PROJECT_STATUSES).optional(),
  scope: z.enum(["open", "closed", "all"]).default("all"),
  clientId: z.string().uuid().optional(),
  /// Проекты одного человека — «что на мне висит».
  developer: z.enum(DEVELOPERS).optional(),
  /** Только те, у кого срок уже прошёл, а проект ещё не закрыт. */
  overdue: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  search: z.string().trim().max(200).optional(),
});

export interface ProjectDto {
  id: string;
  title: string;
  description: string | null;
  status: (typeof PROJECT_STATUSES)[number];
  client: { id: string; name: string } | null;
  lead: { id: string; contact: string; name: string | null } | null;
  developers: string[];
  startedAt: string | null;
  deadline: string | null;
  closedAt: string | null;
  /** Есть ли уже кейс на сайте — из этого растёт кнопка публикации. */
  caseId: string | null;
  openTaskCount: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

type ProjectWithRelations = Project & {
  client: Pick<Client, "id" | "name"> | null;
  lead: Pick<Lead, "id" | "contact" | "name"> | null;
  tasks?: { status: string }[];
};

export function toProjectDto(item: ProjectWithRelations): ProjectDto {
  const tasks = item.tasks ?? [];
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    status: item.status,
    client: item.client ? { id: item.client.id, name: item.client.name } : null,
    lead: item.lead
      ? { id: item.lead.id, contact: item.lead.contact, name: item.lead.name }
      : null,
    developers: item.developers,
    startedAt: item.startedAt?.toISOString() ?? null,
    deadline: item.deadline?.toISOString() ?? null,
    closedAt: item.closedAt?.toISOString() ?? null,
    caseId: item.caseId,
    openTaskCount: tasks.filter(
      (task) => task.status !== "done" && task.status !== "cancelled",
    ).length,
    taskCount: tasks.length,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export const PROJECT_RELATIONS = {
  client: { select: { id: true, name: true } },
  lead: { select: { id: true, contact: true, name: true } },
  tasks: { where: { deletedAt: null }, select: { status: true } },
} as const;
