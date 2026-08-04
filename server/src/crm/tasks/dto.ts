import type { Project, Task, User } from "@prisma/client";
import { z } from "zod";
import { optionalDate, optionalText, optionalUuid, requiredTitle } from "../fields.js";

export const TASK_STATUSES = ["backlog", "todo", "in_progress", "done", "cancelled"] as const;
export const TASK_PRIORITIES = ["low", "normal", "high"] as const;

/** Незакрытые: только они попадают в напоминания и в счётчики проекта. */
export const OPEN_TASK_STATUSES = ["backlog", "todo", "in_progress"] as const;
export const CLOSED_TASK_STATUSES = ["done", "cancelled"] as const;

const taskFields = {
  title: requiredTitle(300, "Без названия задача бесполезна"),
  description: optionalText(4000),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  projectId: optionalUuid,
  assigneeId: optionalUuid,
  dueAt: optionalDate,
};

export const createTaskBody = z.object(taskFields).partial().required({ title: true });

export const updateTaskBody = z.object(taskFields).partial();

/**
 * Перестановка задач приходит одним списком идентификаторов в нужном порядке.
 * Слать по одной позиции нельзя: перетаскивание меняет положение сразу
 * нескольких задач, и частично применённый порядок выглядит как потеря данных.
 */
export const reorderTasksBody = z.object({
  status: z.enum(TASK_STATUSES),
  ids: z.array(z.string().uuid()).max(500),
});

export const listTasksQuery = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  scope: z.enum(["open", "closed", "all"]).default("all"),
  projectId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  /** Задачи без проекта — их легко потерять, поэтому нужен отдельный срез. */
  standalone: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  overdue: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  search: z.string().trim().max(200).optional(),
});

export interface TaskDto {
  id: string;
  title: string;
  description: string | null;
  status: (typeof TASK_STATUSES)[number];
  priority: (typeof TASK_PRIORITIES)[number];
  project: { id: string; title: string } | null;
  assignee: { id: string; name: string | null; email: string } | null;
  dueAt: string | null;
  completedAt: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

type TaskWithRelations = Task & {
  project: Pick<Project, "id" | "title"> | null;
  assignee: Pick<User, "id" | "name" | "email"> | null;
};

export function toTaskDto(item: TaskWithRelations): TaskDto {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    status: item.status,
    priority: item.priority,
    project: item.project ? { id: item.project.id, title: item.project.title } : null,
    assignee: item.assignee
      ? { id: item.assignee.id, name: item.assignee.name, email: item.assignee.email }
      : null,
    dueAt: item.dueAt?.toISOString() ?? null,
    completedAt: item.completedAt?.toISOString() ?? null,
    position: item.position,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export const TASK_RELATIONS = {
  project: { select: { id: true, title: true } },
  assignee: { select: { id: true, name: true, email: true } },
} as const;
