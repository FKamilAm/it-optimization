import type { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { audit } from "../../audit.js";
import { requireTeam } from "../../auth/guard.js";
import { prisma } from "../../db.js";
import { optionalDate, optionalText, requiredTitle } from "../fields.js";
import { invalidInput } from "../http.js";
import { toCredentialDto as toDto } from "./dto.js";

/**
 * Справочник учёток сервисов: что есть, на кого записано, когда продлевать и
 * под каким паролем заходят.
 *
 * **Пароли сервер не видит.** Они приходят уже зашифрованными: ключ выводится
 * из мастер-фразы в браузере и сюда не передаётся. Раньше паролей здесь не было
 * вовсе — именно потому, что база уезжает в ночные дампы, и одна их утечка
 * отдала бы разом все сервисы. Шифрование на устройстве снимает ровно это:
 * в дампе лежит нечитаемый текст.
 *
 * Отсюда следует то, что легко нарушить по невнимательности: расшифровка,
 * проверка и поиск по паролю на сервере невозможны и появиться не должны.
 * Любая такая «мелочь» потребует ключа здесь и вернёт исходную проблему.
 *
 * `secretHint` остался для сервисов, пароль от которых лежит не здесь.
 */

const idParams = z.object({ id: z.string().uuid() });

const credentialFields = {
  service: requiredTitle(120, "Без названия сервиса запись бесполезна"),
  login: optionalText(200),
  url: optionalText(300),
  owner: optionalText(120),
  secretHint: optionalText(200),
  // Приходит уже зашифрованным. Сервер проверяет только форму и размер:
  // содержимое для него — непрозрачный набор байт, и так и задумано.
  secret: z.union([z.null(), z.string().max(4096)]),
  renewsAt: optionalDate,
  // Рубли целыми, как у проекта: копеек в абонплате не бывает.
  amount: z.union([z.null(), z.number().int().min(0).max(100_000_000)]),
  monthlyFee: z.boolean(),
  notes: optionalText(2000),
};

const createBody = z.object(credentialFields).partial().required({ service: true });
const updateBody = z.object(credentialFields).partial();
const listQuery = z.object({ search: z.string().trim().max(200).optional() });

export async function credentialRoutes(app: FastifyInstance): Promise<void> {
  app.get("/credentials", { preHandler: requireTeam }, async (request, reply) => {
    const query = listQuery.safeParse(request.query);
    if (!query.success) return invalidInput(reply, query.error);

    const where: Prisma.CredentialWhereInput = { deletedAt: null };
    if (query.data.search) {
      const search = query.data.search;
      where.OR = [
        { service: { contains: search, mode: "insensitive" } },
        { login: { contains: search, mode: "insensitive" } },
        { owner: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const credentials = await prisma.credential.findMany({
      where,
      // Сначала то, что скоро продлевать; без даты — в конце по алфавиту.
      orderBy: [{ renewsAt: { sort: "asc", nulls: "last" } }, { service: "asc" }],
      take: 500,
    });

    return reply.send({ credentials: credentials.map(toDto) });
  });

  app.post("/credentials", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = createBody.safeParse(request.body);
    if (!parsed.success) return invalidInput(reply, parsed.error);

    const input = parsed.data;
    const credential = await prisma.credential.create({
      data: {
        service: input.service,
        login: input.login ?? null,
        url: input.url ?? null,
        owner: input.owner ?? null,
        secretHint: input.secretHint ?? null,
        secret: input.secret ?? null,
        renewsAt: input.renewsAt ?? null,
        amount: input.amount ?? null,
        monthlyFee: input.monthlyFee ?? false,
        notes: input.notes ?? null,
      },
    });

    await audit(request, {
      entity: "credentials",
      entityId: credential.id,
      action: "create",
    });
    return reply.code(201).send({ credential: toDto(credential) });
  });

  app.patch("/credentials/:id", { preHandler: requireTeam }, async (request, reply) => {
    const params = idParams.safeParse(request.params);
    if (!params.success) return invalidInput(reply, params.error);

    const parsed = updateBody.safeParse(request.body);
    if (!parsed.success) return invalidInput(reply, parsed.error);

    const existing = await prisma.credential.findFirst({
      where: { id: params.data.id, deletedAt: null },
    });
    if (!existing) return reply.code(404).send({ error: "Запись не найдена" });

    const input = parsed.data;
    const credential = await prisma.credential.update({
      where: { id: existing.id },
      data: {
        ...(input.service !== undefined && { service: input.service }),
        ...(input.login !== undefined && { login: input.login }),
        ...(input.url !== undefined && { url: input.url }),
        ...(input.owner !== undefined && { owner: input.owner }),
        ...(input.secretHint !== undefined && { secretHint: input.secretHint }),
        ...(input.secret !== undefined && { secret: input.secret }),
        ...(input.renewsAt !== undefined && { renewsAt: input.renewsAt }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.monthlyFee !== undefined && { monthlyFee: input.monthlyFee }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
    });

    await audit(request, {
      entity: "credentials",
      entityId: credential.id,
      action: "update",
    });
    return reply.send({ credential: toDto(credential) });
  });

  app.delete("/credentials/:id", { preHandler: requireTeam }, async (request, reply) => {
    const params = idParams.safeParse(request.params);
    if (!params.success) return invalidInput(reply, params.error);

    const existing = await prisma.credential.findFirst({
      where: { id: params.data.id, deletedAt: null },
    });
    if (!existing) return reply.code(404).send({ error: "Запись не найдена" });

    await prisma.credential.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    });

    await audit(request, {
      entity: "credentials",
      entityId: existing.id,
      action: "delete",
      diff: { service: existing.service },
    });
    return reply.code(204).send();
  });
}
