import type { Client, Lead, User } from "@prisma/client";
import { z } from "zod";
import { optionalDate, optionalText, optionalUuid } from "../fields.js";

export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;

/** Статусы, в которых лид ещё требует внимания. */
export const OPEN_LEAD_STATUSES = ["new", "contacted", "qualified"] as const;

/** Закрытые: работа по ним кончилась, следующий шаг не нужен. */
export const CLOSED_LEAD_STATUSES = ["won", "lost"] as const;

const leadFields = {
  name: optionalText(120),
  contact: z.string().trim().min(1, "Без контакта лид бесполезен").max(200),
  message: optionalText(4000),
  channel: optionalText(40),
  status: z.enum(LEAD_STATUSES),
  ownerId: optionalUuid,
  clientId: optionalUuid,
  nextActionAt: optionalDate,
  nextActionNote: optionalText(200),
  lostReason: optionalText(500),
  /// Ключ услуги с сайта. Не проверяется по списку намеренно: список живёт в
  /// коде сайта, и жёсткая сверка ломала бы CRM при каждой правке услуг.
  service: optionalText(60),
};

export const createLeadBody = z
  .object(leadFields)
  .partial()
  .required({ contact: true });

/** В PATCH приходят только изменённые поля: отсутствие ≠ обнуление. */
export const updateLeadBody = z.object(leadFields).partial();

export const createNoteBody = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const listLeadsQuery = z.object({
  /** Точный статус. Если задан, перекрывает `scope`. */
  status: z.enum(LEAD_STATUSES).optional(),
  /**
   * Крупный срез списка. Отдельно от `status`, потому что «активные» — это три
   * статуса сразу, а фильтровать их на клиенте нельзя: выборка ограничена
   * сверху, и обрезка после выдачи прячет часть данных.
   */
  scope: z.enum(["open", "closed", "all"]).default("all"),
  ownerId: z.string().uuid().optional(),
  /** Только те, у кого следующий шаг просрочен. */
  overdue: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  search: z.string().trim().max(200).optional(),
});

export interface LeadDto {
  id: string;
  name: string | null;
  contact: string;
  message: string | null;
  channel: string | null;
  status: (typeof LEAD_STATUSES)[number];
  owner: { id: string; name: string | null; email: string } | null;
  client: { id: string; name: string } | null;
  nextActionAt: string | null;
  nextActionNote: string | null;
  lostReason: string | null;
  service: string | null;
  createdAt: string;
  updatedAt: string;
}

type LeadWithRelations = Lead & {
  owner: Pick<User, "id" | "name" | "email"> | null;
  client: Pick<Client, "id" | "name"> | null;
};

export function toLeadDto(item: LeadWithRelations): LeadDto {
  return {
    id: item.id,
    name: item.name,
    contact: item.contact,
    message: item.message,
    channel: item.channel,
    status: item.status,
    owner: item.owner
      ? { id: item.owner.id, name: item.owner.name, email: item.owner.email }
      : null,
    client: item.client ? { id: item.client.id, name: item.client.name } : null,
    nextActionAt: item.nextActionAt?.toISOString() ?? null,
    nextActionNote: item.nextActionNote,
    lostReason: item.lostReason,
    service: item.service,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export const LEAD_RELATIONS = {
  owner: { select: { id: true, name: true, email: true } },
  client: { select: { id: true, name: true } },
} as const;
