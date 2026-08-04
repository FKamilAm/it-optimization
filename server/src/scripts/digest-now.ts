/**
 * Рассылает утренний дайджест немедленно, не дожидаясь расписания.
 *
 * Нужен для двух вещей: проверить, что бот вообще доставляет сообщения, и
 * разослать вручную, если сервис лежал в момент срабатывания планировщика.
 * Отметку в job_runs намеренно не трогает — это ручной прогон, а не замена
 * запланированного.
 *
 *   npm run digest:now
 */
import { prisma } from "../db.js";
import { canNotify } from "../env.js";
import { sendDailyDigest } from "../notify/digest.js";

const log = {
  info: (obj: unknown, msg: string) => console.log(msg, obj),
  warn: (obj: unknown, msg: string) => console.warn(msg, obj),
  error: (obj: unknown, msg: string) => console.error(msg, obj),
};

if (!canNotify) {
  console.error("TELEGRAM_BOT_TOKEN не задан — отправлять нечем.");
  process.exit(1);
}

try {
  await sendDailyDigest(log);
} finally {
  await prisma.$disconnect();
}
