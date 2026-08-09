import type { Lead, Project, Task } from "@prisma/client";
import {
  collectTeamToday,
  collectToday,
  isEmptySnapshot,
  isEmptyTeamSnapshot,
} from "../crm/today.js";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { escapeHtml, sendMessage, TelegramError, trySendMessage } from "./telegram.js";
import { daysOverdue, pluralDays } from "./zone.js";

/**
 * Утренний список. Смысл всей затеи: статусы сами о себе не напоминают, а
 * просроченный следующий шаг — напоминает.
 *
 * Если напоминать не о чем, сообщение не отправляется вовсе. Ежедневное «всё
 * чисто» быстро приучает не открывать бота, и тогда важное сообщение тоже
 * пролистают. Молчание здесь — сигнал, что всё в порядке.
 */

interface Log {
  info: (obj: unknown, msg: string) => void;
  warn: (obj: unknown, msg: string) => void;
  error: (obj: unknown, msg: string) => void;
}

/** Имя для дайджеста: оно необязательное, поэтому запасной вариант — почта. */
function personName(user: { name: string | null; email: string }): string {
  return user.name?.trim() || user.email;
}

type ProjectForDigest = Project & {
  client: { name: string } | null;
};

function projectSection(title: string, projects: ProjectForDigest[]): string[] {
  if (projects.length === 0) return [];
  const lines = projects.map((project) => {
    const client = project.client ? ` — ${escapeHtml(project.client.name)}` : "";
    // Кто ведёт — важнее срока: по сроку понятно, что горит, а по имени —
    // кому этим заниматься. Без этого в общем чате никто не берёт на себя.
    const who = project.developers.length
      ? ` · ${project.developers.map(escapeHtml).join(", ")}`
      : " · <i>никто не ведёт</i>";

    if (!project.deadline) return `• ${escapeHtml(project.title)}${client}${who}`;
    const days = daysOverdue(project.deadline, env.TIMEZONE);
    const late = days > 0 ? ` — ${pluralDays(days)}` : "";
    return `• ${escapeHtml(project.title)}${client}${late}${who}`;
  });
  return [`<b>${title}</b>`, ...lines, ""];
}

function taskLine(task: Task & { project: { title: string } | null }, withOverdue: boolean): string {
  const title = escapeHtml(task.title);
  const where = task.project ? ` <i>${escapeHtml(task.project.title)}</i>` : "";
  const head = `${task.priority === "high" ? "❗ " : ""}${title}${where}`;

  if (!withOverdue || !task.dueAt) return `• ${head}`;
  const days = daysOverdue(task.dueAt, env.TIMEZONE);
  return days > 0 ? `• ${head} — ${pluralDays(days)}` : `• ${head}`;
}

function taskSection(
  title: string,
  tasks: (Task & { project: { title: string } | null })[],
  withOverdue: boolean,
): string[] {
  if (tasks.length === 0) return [];
  return [`<b>${title}</b>`, ...tasks.map((task) => taskLine(task, withOverdue)), ""];
}

function leadLine(lead: Lead, withOverdue: boolean): string {
  const who = escapeHtml(lead.name?.trim() || lead.contact);
  const what = lead.nextActionNote?.trim();

  const head = what ? `<b>${escapeHtml(what)}</b> — ${who}` : who;
  if (!withOverdue || !lead.nextActionAt) return `• ${head}`;

  const days = daysOverdue(lead.nextActionAt, env.TIMEZONE);
  // «Просрочено на 0 дней» — бессмыслица: срок был вчера вечером, значит счёт
  // идёт со вчера, и правильнее промолчать про длительность.
  return days > 0 ? `• ${head} — ${pluralDays(days)}` : `• ${head}`;
}

function section(title: string, leads: Lead[], withOverdue: boolean): string[] {
  if (leads.length === 0) return [];
  return [`<b>${title}</b>`, ...leads.map((lead) => leadLine(lead, withOverdue)), ""];
}

/** Собирает текст для одного человека. Пусто — значит и слать нечего. */
export async function buildDigestFor(userId: string): Promise<string | null> {
  const snapshot = await collectToday(userId);
  if (isEmptySnapshot(snapshot)) return null;

  const { leads, tasks, projects } = snapshot;

  const blocks = [
    ...section(`Просрочено (${leads.overdue.length})`, leads.overdue, true),
    ...section(`Сегодня (${leads.today.length})`, leads.today, false),
    ...section(
      `Ничьи, срок наступил (${leads.orphanUrgent.length})`,
      leads.orphanUrgent,
      true,
    ),
    ...section(`Никто не взял (${leads.unclaimed.length})`, leads.unclaimed, false),
    // Задачи идут после лидов: потерянный лид стоит дороже сдвинутой задачи.
    ...taskSection(`Задачи просрочены (${tasks.overdue.length})`, tasks.overdue, true),
    ...taskSection(`Задачи на сегодня (${tasks.today.length})`, tasks.today, false),
    ...projectSection(`Проекты — срок (${projects.urgent.length})`, projects.urgent),
  ];

  return ["☀️ <b>Доброе утро</b>", "", ...blocks].join("\n").trimEnd();
}

/**
 * Сводка для общего чата. Не копия личной: здесь у каждой строки указано, на
 * ком она висит, иначе в чате на троих никто не понимает, к кому обращаются.
 */
export async function buildTeamDigest(): Promise<string | null> {
  const snapshot = await collectTeamToday();
  if (isEmptyTeamSnapshot(snapshot)) return null;

  const { leads, tasks, projects } = snapshot;

  const leadLines = leads.overdue.map((lead) => {
    const who = lead.owner ? personName(lead.owner) : "ничей";
    const what = lead.nextActionNote?.trim();
    const days = lead.nextActionAt ? daysOverdue(lead.nextActionAt, env.TIMEZONE) : 0;
    const late = days > 0 ? ` — ${pluralDays(days)}` : "";
    const head = what ? `<b>${escapeHtml(what)}</b> — ` : "";
    return `• ${head}${escapeHtml(lead.name?.trim() || lead.contact)}${late} · ${escapeHtml(who)}`;
  });

  const taskLines = tasks.overdue.map((task) => {
    const who = task.developers.length ? task.developers.join(", ") : "ничья";
    const where = task.project ? ` <i>${escapeHtml(task.project.title)}</i>` : "";
    const days = task.dueAt ? daysOverdue(task.dueAt, env.TIMEZONE) : 0;
    const late = days > 0 ? ` — ${pluralDays(days)}` : "";
    return `• ${escapeHtml(task.title)}${where}${late} · ${escapeHtml(who)}`;
  });

  const blocks = [
    ...(leadLines.length
      ? [`<b>Лиды просрочены (${leadLines.length})</b>`, ...leadLines, ""]
      : []),
    ...section(`Никто не взял (${leads.unclaimed.length})`, leads.unclaimed, false),
    ...(taskLines.length
      ? [`<b>Задачи просрочены (${taskLines.length})</b>`, ...taskLines, ""]
      : []),
    ...projectSection(`Проекты — срок (${projects.urgent.length})`, projects.urgent),
  ];

  return ["🌅 <b>Сводка по команде</b>", "", ...blocks].join("\n").trimEnd();
}

/** Отправляет сводку в общий чат, если он задан. */
export async function sendTeamDigest(log: Log): Promise<void> {
  if (!env.TELEGRAM_TEAM_CHAT_ID) return;

  const text = await buildTeamDigest();
  if (!text) return;

  try {
    await sendMessage(env.TELEGRAM_TEAM_CHAT_ID, text);
    log.info({}, "сводка по команде отправлена в общий чат");
  } catch (cause) {
    log.error({ err: cause }, "не удалось отправить сводку в общий чат");
  }
}

/** Рассылает дайджест всем, кто подключил бота. */
export async function sendDailyDigest(log: Log): Promise<void> {
  const users = await prisma.user.findMany({
    where: { disabledAt: null, telegramChatId: { not: null } },
    select: { id: true, telegramChatId: true, email: true },
  });

  let sent = 0;
  for (const user of users) {
    if (!user.telegramChatId) continue;

    try {
      const text = await buildDigestFor(user.id);
      if (!text) continue;
      if (await trySendMessage(user.telegramChatId, text, log)) sent += 1;
    } catch (cause) {
      // Заблокировал бота — снимаем привязку, иначе будем стучаться каждое
      // утро и каждое утро получать ту же ошибку.
      if (cause instanceof TelegramError && cause.isGone) {
        await prisma.user.update({
          where: { id: user.id },
          data: { telegramChatId: null },
        });
        log.warn({ email: user.email }, "телеграм отвязан: бот заблокирован адресатом");
        continue;
      }
      log.error({ err: cause, email: user.email }, "не удалось отправить дайджест");
    }
  }

  log.info({ sent, total: users.length }, "утренний дайджест разослан");
}
