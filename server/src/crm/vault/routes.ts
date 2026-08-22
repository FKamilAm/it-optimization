import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { audit } from "../../audit.js";
import { requireTeam } from "../../auth/guard.js";
import { prisma } from "../../db.js";
import { invalidInput } from "../http.js";

/**
 * Параметры хранилища паролей.
 *
 * Сервер здесь не участвует в криптографии вообще: он отдаёт соль и
 * контрольное значение, а ключ выводится из мастер-фразы в браузере. Ни фразы,
 * ни ключа тут нет и быть не должно — иначе теряется весь смысл: дамп базы
 * снова становился бы дампом всех паролей.
 *
 * Проверить правильность введённой фразы сервер тоже не может, поэтому это
 * делает браузер: пробует расшифровать `verifier`. Получилось — фраза верна.
 */

/** Всегда одна строка: ключ у команды общий. */
const ROW_ID = "vault";

/** base64: соль 16 байт, контрольное значение — короткая строка под AES-GCM. */
const base64 = z
  .string()
  .min(16)
  .max(512)
  .regex(/^[A-Za-z0-9+/]+={0,2}$/, "Ожидается base64");

const setupBody = z.object({ salt: base64, verifier: base64 });

/**
 * Слово набирается руками. Сброс необратим, и защищать от него надо не
 * диалогом «вы уверены?», который прокликивают не глядя, а действием, которое
 * нельзя совершить случайно.
 */
export const RESET_WORD = "СБРОСИТЬ";
const resetBody = z.object({ confirm: z.literal(RESET_WORD) });

export async function vaultRoutes(app: FastifyInstance): Promise<void> {
  app.get("/vault", { preHandler: requireTeam }, async (_request, reply) => {
    const row = await prisma.vaultSetting.findUnique({ where: { id: ROW_ID } });
    if (!row) return reply.send({ configured: false });

    // Сколько паролей человек потеряет при сбросе. Считаются живые записи —
    // те, что он видит в списке; сам сброс чистит и удалённые, но говорить о
    // них незачем. Число не секрет, а без него «сбросить» жмут вслепую.
    const secrets = await prisma.credential.count({
      where: { deletedAt: null, secret: { not: null } },
    });
    return reply.send({
      configured: true,
      salt: row.salt,
      verifier: row.verifier,
      secrets,
    });
  });

  /**
   * Задать мастер-фразу — ровно один раз.
   *
   * Повторный вызов запрещён намеренно: новая соль сделает нечитаемым всё уже
   * сохранённое, а расшифровать и перешифровать записи может только браузер,
   * знающий старую фразу. Смена фразы — отдельная операция, и делать её надо
   * там же, где лежит ключ, а не здесь.
   */
  app.post("/vault", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = setupBody.safeParse(request.body);
    if (!parsed.success) return invalidInput(reply, parsed.error);

    const existing = await prisma.vaultSetting.findUnique({ where: { id: ROW_ID } });
    if (existing) {
      return reply.code(409).send({
        error: "Мастер-фраза уже задана. Смена сделает нечитаемым всё сохранённое.",
      });
    }

    await prisma.vaultSetting.create({
      data: { id: ROW_ID, salt: parsed.data.salt, verifier: parsed.data.verifier },
    });

    // В журнал идёт факт, а не значения: соль не секрет, но и пользы от неё
    // в аудите нет, а verifier — материал для перебора фразы в офлайне.
    await audit(request, { entity: "vault", action: "setup", diff: {} });

    return reply.code(201).send({ configured: true });
  });

  /**
   * Сброс хранилища: забыть фразу и стереть все шифротексты.
   *
   * Звучит страшнее, чем есть: **сброс не теряет ничего, что ещё можно было
   * прочитать**. Знаете фразу — сброс не нужен; не знаете — пароли и так
   * потеряны навсегда, и в базе лежит мусор, который только мешает начать
   * заново. Поэтому операция разрешена, а не спрятана.
   *
   * Ею же делается смена фразы, пока настоящей смены нет: сбросить и занести
   * пароли заново. Перешифровать существующие может только браузер со старым
   * ключом, и это отдельная работа.
   *
   * Через POST, а не DELETE, потому что нужно тело с подтверждением: тело у
   * DELETE местами теряется по дороге через прокси.
   */
  app.post("/vault/reset", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = resetBody.safeParse(request.body);
    if (!parsed.success) return invalidInput(reply, parsed.error);

    // Стирается и настройка, и все шифротексты. Оставить их без соли значило бы
    // держать в базе то, что никто и никогда уже не расшифрует.
    const [{ count }] = await prisma.$transaction([
      prisma.credential.updateMany({
        where: { secret: { not: null } },
        data: { secret: null },
      }),
      prisma.vaultSetting.deleteMany({ where: { id: ROW_ID } }),
    ]);

    await audit(request, { entity: "vault", action: "reset", diff: { secrets: count } });

    return reply.send({ configured: false, cleared: count });
  });
}
