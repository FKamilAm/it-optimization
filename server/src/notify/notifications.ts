import type { Lead } from "@prisma/client";
import { prisma } from "../db.js";
import { canNotify, env } from "../env.js";
import { escapeHtml, trySendMessage } from "./telegram.js";

interface Log {
  warn: (obj: unknown, msg: string) => void;
}

/**
 * Сообщение о новом лиде. Уходит в общий чат, если он задан, иначе — всем, кто
 * подключил бота. Второй путь важен: заводить группу ради троих необязательно,
 * а знать о новом обращении должны все.
 */
export async function notifyNewLead(lead: Lead, log: Log): Promise<void> {
  if (!canNotify) return;

  const lines = [
    "🆕 <b>Новый лид</b>",
    "",
    `<b>${escapeHtml(lead.name?.trim() || lead.contact)}</b>`,
  ];
  if (lead.name?.trim()) lines.push(escapeHtml(lead.contact));
  if (lead.message?.trim()) lines.push("", escapeHtml(lead.message.trim()));
  if (!lead.ownerId) lines.push("", "Никто не назначен.");

  const text = lines.join("\n");

  if (env.TELEGRAM_TEAM_CHAT_ID) {
    await trySendMessage(env.TELEGRAM_TEAM_CHAT_ID, text, log);
    return;
  }

  const users = await prisma.user.findMany({
    where: { disabledAt: null, telegramChatId: { not: null } },
    select: { telegramChatId: true },
  });

  for (const user of users) {
    if (user.telegramChatId) await trySendMessage(user.telegramChatId, text, log);
  }
}

/**
 * Уведомление не должно ни задерживать ответ API, ни тем более его ронять:
 * лид уже сохранён, а телеграм может лежать.
 */
export function notifyNewLeadInBackground(lead: Lead, log: Log): void {
  void notifyNewLead(lead, log).catch((cause: unknown) => {
    log.warn({ cause }, "уведомление о новом лиде не отправлено");
  });
}
