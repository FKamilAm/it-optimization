import { api } from "./client";
import type { Note } from "./leads";

export const PROJECT_STATUSES = [
  "planned",
  "active",
  "on_hold",
  "done",
  "cancelled",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: "Запланирован",
  active: "В работе",
  on_hold: "На паузе",
  done: "Сдан",
  cancelled: "Отменён",
};

export const CLOSED_PROJECT_STATUSES: readonly ProjectStatus[] = ["done", "cancelled"];

export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  client: { id: string; name: string } | null;
  lead: { id: string; contact: string; name: string | null } | null;
  owner: { id: string; name: string | null; email: string } | null;
  startedAt: string | null;
  deadline: string | null;
  closedAt: string | null;
  caseId: string | null;
  openTaskCount: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInput {
  title?: string;
  description?: string | null;
  status?: ProjectStatus;
  clientId?: string | null;
  leadId?: string | null;
  ownerId?: string | null;
  startedAt?: string | null;
  deadline?: string | null;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  scope?: "open" | "closed" | "all";
  clientId?: string;
  ownerId?: string;
  overdue?: boolean;
  search?: string;
}

function toQuery(filters: ProjectFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.scope) params.set("scope", filters.scope);
  if (filters.clientId) params.set("clientId", filters.clientId);
  if (filters.ownerId) params.set("ownerId", filters.ownerId);
  if (filters.overdue) params.set("overdue", "true");
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listProjects(filters: ProjectFilters = {}): Promise<Project[]> {
  const { projects } = await api.get<{ projects: Project[] }>(
    `/projects${toQuery(filters)}`,
  );
  return projects;
}

export async function getProject(
  id: string,
): Promise<{ project: Project; notes: Note[] }> {
  return api.get<{ project: Project; notes: Note[] }>(`/projects/${id}`);
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const { project } = await api.post<{ project: Project }>("/projects", input);
  return project;
}

export async function updateProject(id: string, input: ProjectInput): Promise<Project> {
  const { project } = await api.patch<{ project: Project }>(`/projects/${id}`, input);
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete<void>(`/projects/${id}`);
}

export async function addProjectNote(projectId: string, body: string): Promise<Note> {
  const { note } = await api.post<{ note: Note }>(`/projects/${projectId}/notes`, {
    body,
  });
  return note;
}
