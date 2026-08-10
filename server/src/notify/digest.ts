import { collectToday, isEmptySnapshot } from "../crm/today.js";
import { env } from "../env.js";
import { escapeHtml, sendMessage, TelegramError } from "./telegram.js";
import { daysOverdue, pluralDays } from "./zone.js";

/**
 * Утренняя сводка в общий чат.
 *
 * Личных дайджестов нет: разработчики работают под общим входом и значатся
 * именами, так что «что делать мне» система вычислить не может. Зато у каждой
 * строки указано, на ком она висит, — в чате на троих это и нужно.
 *
 * Если напоминать не о чем, сообщение не отправляется вовсе. Ежедневное «всё
 * чисто» приучает не открывать бота, и тогда важное сообщение тоже пролистают.
 * Молчание здесь — сигнал, что всё в порядке.
 */

interface Log {
  info: (obj: unknown, msg: string) => void;
  warn: (obj: unknown, msg: string) => void;
  error: (obj: unknown, msg: string) => void;
}

/** Имя необязательное, поэтому запасной вариант — почта. */
function personName(user: { name: string | null; email: string }): string {
  return user.name?.trim() || user.email;
}

/** «· Егор, Вадим» или «· ничья» — кто отвечает, приписью в конце строки. */
function who(names: string[], nobody: string): string {
  return names.length
    ? ` · ${names.map(escapeHtml).join(", ")}`
    : ` · <i>${nobody}</i>`;
}

function lateSuffix(date: Date | null): string {
  if (!date) return "";
  const days = daysOverdue(date, env.TIMEZONE);
  // «Просрочено на 0 дней» — бессмыслица: срок был вчера вечером, значит счёт
  // идёт со вчера, и правильнее промолчать про длительность.
  return days > 0 ? ` — ${pluralDays(days)}` : "";
}

function block(title: string, lines: string[]): string[] {
  return lines.length ? [`<b>${title}</b>`, ...lines, ""] : [];
}

export async function buildDigest(): Promise<string | null> {
  const snapshot = await collectToday();
  if (isEmptySnapshot(snapshot)) return null;

  const { leads, tasks, projects } = snapshot;

  const leadLine = (lead: (typeof leads.overdue)[number], withLate: boolean) => {
    const what = lead.nextActionNote?.trim();
    const head = what ? `<b>${escapeHtml(what)}</b> — ` : "";
    const name = escapeHtml(lead.name?.trim() || lead.contact);
    const late = withLate ? lateSuffix(lead.nextActionAt) : "";
    const owner = lead.owner ? ` · ${escapeHtml(personName(lead.owner))}` : " · <i>ничей</i>";
    return `• ${head}${name}${late}${owner}`;
  };

  const taskLine = (task: (typeof tasks.overdue)[number], withLate: boolean) => {
    const where = task.project ? ` <i>${escapeHtml(task.project.title)}</i>` : "";
    const late = withLate ? lateSuffix(task.dueAt) : "";
    const urgent = task.priority === "high" ? "❗ " : "";
    return `• ${urgent}${escapeHtml(task.title)}${where}${late}${who(task.developers, "ничья")}`;
  };

  const blocks = [
    ...block(
      `Лиды просрочены (${leads.overdue.length})`,
      leads.overdue.map((lead) => leadLine(lead, true)),
    ),
    ...block(
      `Лиды на сегодня (${leads.today.length})`,
      leads.today.map((lead) => leadLine(lead, false)),
    ),
    ...block(
      `Никто не взял (${leads.unclaimed.length})`,
      leads.unclaimed.map((lead) => leadLine(lead, false)),
    ),
    // Задачи после лидов: потерянный лид стоит дороже сдвинутой задачи.
    ...block(
      `Задачи просрочены (${tasks.overdue.length})`,
      tasks.overdue.map((task) => taskLine(task, true)),
    ),
    ...block(
      `Задачи на сегодня (${tasks.today.length})`,
      tasks.today.map((task) => taskLine(task, false)),
    ),
    ...block(
      `Проекты — срок (${projects.urgent.length})`,
      projects.urgent.map((project) => {
        const client = project.client ? ` — ${escapeHtml(project.client.name)}` : "";
        return `• ${escapeHtml(project.title)}${client}${lateSuffix(project.deadline)}${who(
          project.developers,
          "никто не ведёт",
        )}`;
      }),
    ),
    // Счета последними, но со значком: забытый счёт — это недополученные
    // деньги, и среди сроков его легко пролистать.
    ...block(
      `💸 Счета не выставлены (${projects.unbilled.length})`,
      projects.unbilled.map((project) => {
        const amount = project.monthlyAmount
          ? ` — ${project.monthlyAmount.toLocaleString("ru-RU")} ₽`
          : "";
        const client = project.client ? ` · ${escapeHtml(project.client.name)}` : "";
        // Сколько месяцев пропущено — важнее самого раннего: один месяц это
        // забывчивость, четыре — потерянные деньги.
        const months =
          project.unbilledCount > 1
            ? ` (${project.unbilledCount} мес., с ${project.unbilledPeriod})`
            : ` (за ${project.unbilledPeriod})`;
        return `• ${escapeHtml(project.title)}${months}${amount}${client}`;
      }),
    ),
  ];

  return ["🌅 <b>Что горит</b>", "", ...blocks].join("\n").trimEnd();
}

/** Отправляет сводку в общий чат. */
export async function sendTeamDigest(log: Log): Promise<void> {
  if (!env.TELEGRAM_TEAM_CHAT_ID) {
    log.warn({}, "TELEGRAM_TEAM_CHAT_ID не задан — сводку слать некуда");
    return;
  }

  const text = await buildDigest();
  if (!text) return;

  try {
    await sendMessage(env.TELEGRAM_TEAM_CHAT_ID, text);
    log.info({}, "утренняя сводка отправлена в общий чат");
  } catch (cause) {
    // Чат удалён или бота из него выгнали — повторять нечего, но знать надо.
    if (cause instanceof TelegramError && cause.isGone) {
      log.error({ err: cause }, "общий чат недоступен: бот удалён или чат стёрт");
      return;
    }
    log.error({ err: cause }, "не удалось отправить сводку в общий чат");
  }
}
