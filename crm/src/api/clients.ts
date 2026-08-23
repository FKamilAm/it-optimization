import { api } from "./client";
import type { NoteBrief } from "@/components/note-hint";
import type { Note } from "./leads";

/**
 * Тип контакта — свободная строка в базе, но в интерфейсе выбор из списка:
 * иначе один и тот же телефон окажется записан как «тел», «телефон» и «phone».
 */
export const CONTACT_TYPES = [
  { value: "phone", label: "Телефон" },
  { value: "email", label: "Почта" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Другое" },
] as const;

export interface ClientContact {
  type: string;
  value: string;
  label?: string | null;
}

export interface Client {
  /** Последняя заметка — приходит только в списках. */
  note?: NoteBrief | null;
  id: string;
  name: string;
  inn: string | null;
  site: string | null;
  contacts: ClientContact[];
  notes: string | null;
  projectCount: number;
  activeProjectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientInput {
  name?: string;
  inn?: string | null;
  site?: string | null;
  contacts?: ClientContact[] | null;
  notes?: string | null;
}

export async function listClients(search?: string): Promise<Client[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const { clients } = await api.get<{ clients: Client[] }>(`/clients${query}`);
  return clients;
}

export async function getClient(id: string): Promise<{ client: Client; notes: Note[] }> {
  return api.get<{ client: Client; notes: Note[] }>(`/clients/${id}`);
}

export async function createClient(input: ClientInput): Promise<Client> {
  const { client } = await api.post<{ client: Client }>("/clients", input);
  return client;
}

export async function updateClient(id: string, input: ClientInput): Promise<Client> {
  const { client } = await api.patch<{ client: Client }>(`/clients/${id}`, input);
  return client;
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete<void>(`/clients/${id}`);
}

export async function addClientNote(clientId: string, body: string): Promise<Note> {
  const { note } = await api.post<{ note: Note }>(`/clients/${clientId}/notes`, { body });
  return note;
}
