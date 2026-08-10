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

  hosting: optionalText(200),
  workType: optionalText(60),
  contractNumber: optionalText(60),
  contractDate: optionalDate,
  actDate: optionalDate,

  billingMonthly: z.boolean(),
  /// Рубли целыми. Отрицательная сумма — почти наверняка опечатка.
  monthlyAmount: z.union([z.null(), z.number().int().min(0).max(100_000_000)]),
};

/**
 * Виды работ. Строка в базе, список здесь — чтобы в интерфейсе был выбор, а не
 * свободное поле: иначе «договорной», «Договор» и «по договору» станут тремя
 * разными видами, и фильтр по ним потеряет смысл. Незнакомое значение при этом
 * не отвергается — список пополняется без миграции.
 */
export const WORK_TYPES = [
  { value: "contract", label: "Договорной" },
  { value: "oneoff", label: "Разовая работа" },
  { value: "support", label: "Сопровождение" },
  { value: "internal", label: "Свой проект" },
] as const;

export const createProjectBody = z
  .object(projectFields)
  .partial()
  .required({ title: true });

export const updateProjectBody = z.object(projectFields).partial();

/** Порядок колонки целиком: частично применённая перестановка выглядит как потеря. */
export const reorderProjectsBody = z.object({
  status: z.enum(PROJECT_STATUSES),
  ids: z.array(z.string().uuid()).max(500),
});

export const invoiceBody = z.object({
  kind: z.enum(["invoice", "act"]),
  /// ГГГГ-ММ. Регулярка, а не дата: это календарный месяц, а не момент.
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Период вида 2026-08"),
  amount: z.union([z.null(), z.number().int().min(0).max(100_000_000)]).optional(),
  issuedAt: optionalDate.optional(),
  paidAt: optionalDate.optional(),
  note: optionalText(500).optional(),
});

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
  position: number;

  hosting: string | null;
  workType: string | null;
  contractNumber: string | null;
  contractDate: string | null;
  actDate: string | null;

  billingMonthly: boolean;
  monthlyAmount: number | null;
  /**
   * Период, за который счёт ещё не выставлен, — вида «2026-08». Считается на
   * сервере: клиенту иначе пришлось бы знать про календарь команды и часовой
   * пояс. `null` — либо счета не помесячные, либо за текущий месяц уже есть.
   */
  unbilledPeriod: string | null;
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
  invoices?: { kind: string; period: string }[];
};

/** Текущий месяц как ГГГГ-ММ в часовом поясе команды. */
export function currentPeriod(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).format(now);
  // en-CA даёт «2026-08», ровно нужный порядок.
  return parts;
}

export function toProjectDto(item: ProjectWithRelations, timeZone: string): ProjectDto {
  const tasks = item.tasks ?? [];
  const period = currentPeriod(timeZone);
  // Счёт за текущий месяц либо есть, либо его надо выставить. Акты в этот
  // расчёт не входят: напоминание про деньги, а не про документы.
  const billed = (item.invoices ?? []).some(
    (invoice) => invoice.kind === "invoice" && invoice.period === period,
  );
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
    position: item.position,
    hosting: item.hosting,
    workType: item.workType,
    contractNumber: item.contractNumber,
    contractDate: item.contractDate?.toISOString() ?? null,
    actDate: item.actDate?.toISOString() ?? null,
    billingMonthly: item.billingMonthly,
    monthlyAmount: item.monthlyAmount,
    unbilledPeriod: item.billingMonthly && !billed ? period : null,
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
  // Только вид и период: суммы для списка не нужны, а строк на проект за год
  // набегает две дюжины.
  invoices: { select: { kind: true, period: true } },
} as const;
