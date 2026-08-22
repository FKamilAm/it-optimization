import { prisma } from "../../db.js";
import { RETENTION_DAYS, TRASH } from "./registry.js";

/**
 * Окончательное удаление всего, что пролежало в корзине дольше срока.
 *
 * Заметки уходят здесь же, а не в момент удаления записи: иначе восстановленный
 * проект возвращался бы без переписки, и корзина обманывала бы — «вернуть» не
 * означало бы «как было». Внешнего ключа у заметок нет (таблица одна на все
 * сущности), поэтому убирать их приходится руками.
 */
export async function purgeDeleted(days = RETENTION_DAYS): Promise<number> {
  const before = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  let total = 0;

  for (const model of Object.values(TRASH)) {
    const ids = await model.purge(before);
    if (ids.length === 0) continue;
    total += ids.length;

    if (model.notes) {
      await prisma.note.deleteMany({
        where: { entity: model.notes, entityId: { in: ids } },
      });
    }
  }

  return total;
}
