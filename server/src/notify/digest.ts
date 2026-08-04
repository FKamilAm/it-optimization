import type { Lead, Project, Task } from "@prisma/client";
import { collectToday, isEmptySnapshot } from "../crm/today.js";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { escapeHtml, TelegramError, trySendMessage } from "./telegram.js";
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

function projectSection(
  title: string,
  projects: (Project & { client: { name: string } | null })[],
): string[] {
  if (projects.length === 0) return [];
  const lines = projects.map((project) => {
    const who = project.client ? ` — ${escapeHtml(project.client.name)}` : "";
    if (!project.deadline) return `• ${escapeHtml(project.title)}${who}`;
    const days = daysOverdue(project.deadline, env.TIMEZONE);
    const late = days > 0 ? ` — ${pluralDays(days)}` : "";
    return `• ${escapeHtml(project.title)}${who}${late}`;
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
      log.error({ cause, email: user.email }, "не удалось отправить дайджест");
    }
  }

  log.info({ sent, total: users.length }, "утренний дайджест разослан");
}
