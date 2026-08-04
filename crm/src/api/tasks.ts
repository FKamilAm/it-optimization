import { api } from "./client";
import type { Note } from "./leads";

export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "done",
  "cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Когда-нибудь",
  todo: "К работе",
  in_progress: "В работе",
  done: "Готово",
  cancelled: "Отменена",
};

/** Колонки доски. «Отменена» намеренно не колонка: это исход, а не этап. */
export const BOARD_COLUMNS: readonly TaskStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "done",
];

export const CLOSED_TASK_STATUSES: readonly TaskStatus[] = ["done", "cancelled"];

export const TASK_PRIORITIES = ["low", "normal", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Низкий",
  normal: "Обычный",
  high: "Срочно",
};

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project: { id: string; title: string } | null;
  assignee: { id: string; name: string | null; email: string } | null;
  dueAt: string | null;
  completedAt: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string | null;
  assigneeId?: string | null;
  dueAt?: string | null;
}

export interface TaskFilters {
  status?: TaskStatus;
  scope?: "open" | "closed" | "all";
  projectId?: string;
  assigneeId?: string;
  standalone?: boolean;
  overdue?: boolean;
  search?: string;
}

function toQuery(filters: TaskFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.scope) params.set("scope", filters.scope);
  if (filters.projectId) params.set("projectId", filters.projectId);
  if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
  if (filters.standalone) params.set("standalone", "true");
  if (filters.overdue) params.set("overdue", "true");
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const { tasks } = await api.get<{ tasks: Task[] }>(`/tasks${toQuery(filters)}`);
  return tasks;
}

export async function getTask(id: string): Promise<{ task: Task; notes: Note[] }> {
  return api.get<{ task: Task; notes: Note[] }>(`/tasks/${id}`);
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { task } = await api.post<{ task: Task }>("/tasks", input);
  return task;
}

export async function updateTask(id: string, input: TaskInput): Promise<Task> {
  const { task } = await api.patch<{ task: Task }>(`/tasks/${id}`, input);
  return task;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete<void>(`/tasks/${id}`);
}

/** Порядок колонки целиком: частично применённая перестановка выглядит как потеря. */
export async function reorderTasks(status: TaskStatus, ids: string[]): Promise<void> {
  await api.put<void>("/tasks/reorder", { status, ids });
}

export async function addTaskNote(taskId: string, body: string): Promise<Note> {
  const { note } = await api.post<{ note: Note }>(`/tasks/${taskId}/notes`, { body });
  return note;
}
