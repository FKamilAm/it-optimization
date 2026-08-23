import { api } from "./client";
import type { NoteBrief } from "@/components/note-hint";

export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Новый",
  contacted: "В переписке",
  qualified: "Считаем",
  won: "В работу",
  lost: "Отказ",
};

/** Статусы, закрывающие лид: следующий шаг им уже не нужен. */
export const CLOSED_STATUSES: readonly LeadStatus[] = ["won", "lost"];

/**
 * Каналы — свободная строка в базе (список меняется чаще, чем стоит гонять
 * миграции), но в интерфейсе выбор из готовых значений: иначе один и тот же
 * телеграм окажется записан пятью способами.
 */
export const LEAD_CHANNELS = [
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "max", label: "MAX" },
  { value: "phone", label: "Телефон" },
  { value: "email", label: "Почта" },
  { value: "referral", label: "Рекомендация" },
  { value: "form", label: "Форма на сайте" },
] as const;

export interface Lead {
  /** Последняя заметка — приходит только в списках. */
  note?: NoteBrief | null;
  id: string;
  name: string | null;
  contact: string;
  message: string | null;
  channel: string | null;
  status: LeadStatus;
  owner: { id: string; name: string | null; email: string } | null;
  client: { id: string; name: string } | null;
  nextActionAt: string | null;
  nextActionNote: string | null;
  lostReason: string | null;
  service: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  body: string;
  author: { id: string; name: string | null; email: string } | null;
  createdAt: string;
}

export interface LeadInput {
  name?: string | null;
  contact?: string;
  message?: string | null;
  channel?: string | null;
  status?: LeadStatus;
  ownerId?: string | null;
  nextActionAt?: string | null;
  nextActionNote?: string | null;
  lostReason?: string | null;
  service?: string | null;
}

export interface LeadFilters {
  status?: LeadStatus;
  scope?: "open" | "closed" | "all";
  ownerId?: string;
  overdue?: boolean;
  search?: string;
}

function toQuery(filters: LeadFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.scope) params.set("scope", filters.scope);
  if (filters.ownerId) params.set("ownerId", filters.ownerId);
  if (filters.overdue) params.set("overdue", "true");
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  const { leads } = await api.get<{ leads: Lead[] }>(`/leads${toQuery(filters)}`);
  return leads;
}

export async function getLead(id: string): Promise<{ lead: Lead; notes: Note[] }> {
  return api.get<{ lead: Lead; notes: Note[] }>(`/leads/${id}`);
}

export async function createLead(input: LeadInput): Promise<Lead> {
  const { lead } = await api.post<{ lead: Lead }>("/leads", input);
  return lead;
}

export async function updateLead(id: string, input: LeadInput): Promise<Lead> {
  const { lead } = await api.patch<{ lead: Lead }>(`/leads/${id}`, input);
  return lead;
}

export async function deleteLead(id: string): Promise<void> {
  await api.delete<void>(`/leads/${id}`);
}

export async function addNote(leadId: string, body: string): Promise<Note> {
  const { note } = await api.post<{ note: Note }>(`/leads/${leadId}/notes`, { body });
  return note;
}
