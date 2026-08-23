import type { Note, User } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth/guard.js";
import { prisma } from "../db.js";
import { invalidInput } from "./http.js";

/**
 * Заметки общие для всех сущностей CRM: одна таблица вместо четырёх почти
 * одинаковых. Внешнего ключа на владельца нет — он не бывает полиморфным, —
 * поэтому целостность держится здесь: писать и читать заметки можно только
 * через эти функции, и вызываются они после проверки, что запись существует.
 */
export const NOTE_ENTITIES = ["lead", "client", "project", "task"] as const;
export type NoteEntity = (typeof NOTE_ENTITIES)[number];

export interface NoteDto {
  id: string;
  body: string;
  author: { id: string; name: string | null; email: string } | null;
  createdAt: string;
}

type NoteWithAuthor = Note & { author: Pick<User, "id" | "name" | "email"> | null };

const AUTHOR_SELECT = { select: { id: true, name: true, email: true } } as const;

function toNoteDto(note: NoteWithAuthor): NoteDto {
  return {
    id: note.id,
    body: note.body,
    author: note.author
      ? { id: note.author.id, name: note.author.name, email: note.author.email }
      : null,
    createdAt: note.createdAt.toISOString(),
  };
}

/**
 * Последняя заметка и их число для списка записей.
 *
 * Одним запросом на весь список, а не по запросу на карточку: список из
 * тридцати записей иначе превращается в тридцать походов в базу. Заметок у
 * одной сущности единицы, поэтому выбрать все и разложить в памяти дешевле,
 * чем городить оконную функцию в обход Prisma.
 */
export interface NoteBrief {
  /** Текст последней заметки — на карточке он и показывается. */
  body: string;
  author: string | null;
  createdAt: string;
  /** Сколько всего: «ещё 3» подсказывает, что за строкой есть продолжение. */
  count: number;
}

export async function briefNotes(
  entity: NoteEntity,
  ids: string[],
): Promise<Map<string, NoteBrief>> {
  const brief = new Map<string, NoteBrief>();
  if (ids.length === 0) return brief;

  const notes = await prisma.note.findMany({
    where: { entity, entityId: { in: ids } },
    orderBy: { createdAt: "desc" },
    include: { author: AUTHOR_SELECT },
  });

  for (const note of notes) {
    const seen = brief.get(note.entityId);
    if (seen) {
      seen.count += 1;
      continue;
    }
    brief.set(note.entityId, {
      body: note.body,
      author: note.author?.name?.trim() || note.author?.email || null,
      createdAt: note.createdAt.toISOString(),
      count: 1,
    });
  }

  return brief;
}

/** Хронология сверху вниз: свежая запись последняя, как в переписке. */
export async function listNotes(
  entity: NoteEntity,
  entityId: string,
): Promise<NoteDto[]> {
  const notes = await prisma.note.findMany({
    where: { entity, entityId },
    orderBy: { createdAt: "asc" },
    include: { author: AUTHOR_SELECT },
  });
  return notes.map(toNoteDto);
}

export async function createNote(
  entity: NoteEntity,
  entityId: string,
  authorId: string,
  body: string,
): Promise<NoteDto> {
  const note = await prisma.note.create({
    data: { entity, entityId, authorId, body },
    include: { author: AUTHOR_SELECT },
  });
  return toNoteDto(note);
}

/** Заметки уходят вместе с записью: висеть в базе без владельца им незачем. */
export async function deleteNotes(entity: NoteEntity, entityId: string): Promise<void> {
  await prisma.note.deleteMany({ where: { entity, entityId } });
}

export const createNoteBody = z.object({
  body: z.string().trim().min(1).max(4000),
});

/**
 * Маршрут добавления заметки одинаков у всех сущностей — отличается двумя
 * вещами. Первая: проверка, что запись существует; без внешнего ключа (см.
 * выше) только она не даёт завести заметку в пустоту. Вторая: кому можно.
 *
 * Права передаются снаружи намеренно. Заметки к лиду пишет и маркетолог, а к
 * проекту или задаче — только команда; общий `requireAuth` здесь стал бы
 * дырой, через которую маркетолог комментирует чужие разделы.
 */
export async function noteRoutesFor(
  app: FastifyInstance,
  entity: NoteEntity,
  basePath: string,
  exists: (id: string) => Promise<boolean>,
  notFound: string,
  guard: typeof requireAuth = requireAuth,
): Promise<void> {
  const params = z.object({ id: z.string().uuid() });

  app.post(`/${basePath}/:id/notes`, { preHandler: guard }, async (request, reply) => {
    const parsedParams = params.safeParse(request.params);
    if (!parsedParams.success) return invalidInput(reply, parsedParams.error);

    const parsed = createNoteBody.safeParse(request.body);
    if (!parsed.success) return invalidInput(reply, parsed.error);

    if (!(await exists(parsedParams.data.id))) {
      return reply.code(404).send({ error: notFound });
    }

    const note = await createNote(
      entity,
      parsedParams.data.id,
      request.user!.id,
      parsed.data.body,
    );
    return reply.code(201).send({ note });
  });
}
