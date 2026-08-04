import type { FastifyReply } from "fastify";
import type { ZodError } from "zod";

/**
 * Единый формат ответа на невалидный ввод. Вынесено, потому что маршрутов в CRM
 * много и одинаковых: разъехавшиеся форматы ошибок пришлось бы разбирать на
 * клиенте по отдельности.
 */
export function invalidInput(reply: FastifyReply, error: ZodError): FastifyReply {
  return reply.code(400).send({
    error: "Некорректные данные",
    details: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}
