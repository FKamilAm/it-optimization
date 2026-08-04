import { prisma } from "../db.js";
import { env } from "../env.js";
import { buildDigestFor, sendDailyDigest } from "./digest.js";

import { callBotApi, escapeHtml, trySendMessage } from "./telegram.js";
import { zonedNow } from "./zone.js";

/**
 * Бот работает на длинных опросах (getUpdates), а не на вебхуках. Вебхук
 * требует публичного HTTPS-адреса, а значит не работает при локальной
 * разработке без туннеля. Опрос работает везде одинаково, а на объёме в
 * несколько сообщений в день разницы в нагрузке нет никакой.
 *
 * Важно: у одного бота может опрашивать обновления только один процесс. Если
 * когда-нибудь API поедет в несколько реплик, бота надо будет выносить
 * отдельно или переводить на вебхук.
 */

interface Log {
  info: (obj: unknown, msg: string) => void;
  warn: (obj: unknown, msg: string) => void;
  error: (obj: unknown, msg: string) => void;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    chat: { id: number; type: string };
    from?: { id: number; first_name?: string; username?: string };
    text?: string;
  };
}

const HELP = [
  "Я напоминаю о лидах, про которые пора что-то сделать.",
  "",
  "<b>/today</b> — что горит прямо сейчас",
  "<b>/stop</b> — отключить напоминания",
  "",
  "Каждое утро присылаю просроченное и запланированное на сегодня.",
  "Если присылать нечего — молчу.",
].join("\n");

async function linkByCode(chatId: string, code: string, log: Log): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      telegramLinkCode: code.toUpperCase(),
      telegramLinkExpiresAt: { gt: new Date() },
      disabledAt: null,
    },
  });

  if (!user) {
    await trySendMessage(
      chatId,
      "Код не подошёл — он живёт 15 минут. Откройте CRM и запросите новый.",
      log,
    );
    return;
  }

  // Один телеграм — один пользователь. Если этот чат уже был привязан к
  // кому-то другому, старую привязку снимаем: иначе дайджест уедет не тому.
  await prisma.user.updateMany({
    where: { telegramChatId: chatId, id: { not: user.id } },
    data: { telegramChatId: null },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { telegramChatId: chatId, telegramLinkCode: null, telegramLinkExpiresAt: null },
  });

  log.info({ email: user.email }, "телеграм привязан");
  await trySendMessage(
    chatId,
    `Готово, ${escapeHtml(user.name ?? user.email)}. Напоминания включены.\n\n${HELP}`,
    log,
  );
}

async function handleCommand(chatId: string, text: string, log: Log): Promise<void> {
  // В группах команды приходят как «/today@it_optimization_bot».
  const [rawCommand = "", argument = ""] = text.trim().split(/\s+/, 2);
  const command = rawCommand.split("@", 1)[0]?.toLowerCase() ?? "";

  if (command === "/start") {
    if (argument) return linkByCode(chatId, argument, log);
    await trySendMessage(
      chatId,
      `Чтобы получать напоминания, откройте CRM → «Подключить телеграм» и пришлите мне выданный код.\n\n${HELP}`,
      log,
    );
    return;
  }

  const user = await prisma.user.findFirst({ where: { telegramChatId: chatId } });

  if (command === "/stop") {
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { telegramChatId: null } });
    }
    await trySendMessage(chatId, "Напоминания отключены. Вернуть — командой /start с кодом из CRM.", log);
    return;
  }

  if (command === "/today") {
    if (!user) {
      await trySendMessage(chatId, "Сначала подключитесь: /start с кодом из CRM.", log);
      return;
    }
    const digest = await buildDigestFor(user.id);
    await trySendMessage(chatId, digest ?? "Ничего не горит. Свободны.", log);
    return;
  }

  await trySendMessage(chatId, HELP, log);
}

const DIGEST_JOB = "daily-digest";

/**
 * Планировщик. Отдельного cron-пакета не берём: одна проверка в минуту решает
 * задачу целиком.
 *
 * Условие «время наступило и сегодня ещё не слали» вместо точного совпадения
 * минуты — чтобы перезапуск сервиса в 08:59 не съедал дайджест этого дня.
 * Отметка о рассылке лежит в базе, а не в памяти: иначе каждый перезапуск днём
 * выглядел бы как «сегодня ещё не рассылали».
 */
async function runDigestIfDue(log: Log): Promise<void> {
  const { date, time } = zonedNow(env.TIMEZONE);
  if (time < env.DIGEST_TIME) return;

  const previous = await prisma.jobRun.findUnique({ where: { job: DIGEST_JOB } });
  if (previous?.ranOn === date) return;

  // Отметку ставим до рассылки, а не после: рассылка идёт по одному сообщению
  // на человека и может занять дольше минуты, а следующий тик за это время
  // успел бы начать её заново.
  await prisma.jobRun.upsert({
    where: { job: DIGEST_JOB },
    create: { job: DIGEST_JOB, ranOn: date },
    update: { ranOn: date },
  });

  await sendDailyDigest(log);
}

function startScheduler(log: Log): () => void {
  const tick = setInterval(
    () => {
      runDigestIfDue(log).catch((cause: unknown) => {
        log.error({ cause }, "рассылка дайджеста не удалась");
      });
    },
    60 * 1000,
  );
  tick.unref();

  return () => clearInterval(tick);
}

export function startBot(log: Log): () => Promise<void> {
  const controller = new AbortController();
  const stopScheduler = startScheduler(log);
  let offset = 0;

  async function poll(): Promise<void> {
    while (!controller.signal.aborted) {
      try {
        const updates = await callBotApi<TelegramUpdate[]>(
          "getUpdates",
          { offset, timeout: 30, allowed_updates: ["message"] },
          controller.signal,
          // Длинный опрос держит соединение 30 секунд намеренно, поэтому свой
          // таймаут должен быть заведомо больше — иначе он обрывал бы каждый
          // цикл ожидания.
          45_000,
        );

        for (const update of updates) {
          offset = update.update_id + 1;
          const text = update.message?.text;
          const chatId = update.message?.chat.id;
          if (!text || chatId === undefined) continue;

          await handleCommand(String(chatId), text, log).catch((cause: unknown) => {
            log.error({ cause }, "ошибка обработки сообщения бота");
          });
        }
      } catch (cause) {
        if (controller.signal.aborted) return;
        log.warn({ cause }, "опрос телеграма сорвался, повтор через 5 секунд");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  void poll();
  log.info({ digestAt: env.DIGEST_TIME, timeZone: env.TIMEZONE }, "бот уведомлений запущен");

  return async () => {
    stopScheduler();
    controller.abort();
  };
}
