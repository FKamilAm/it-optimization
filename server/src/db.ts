import { PrismaClient } from "@prisma/client";
import { isProduction } from "./env.js";

/**
 * Один клиент на процесс. В dev `tsx watch` перезапускает модуль при каждой
 * правке, поэтому клиент кладётся в globalThis — иначе за час работы
 * накапливаются десятки живых пулов соединений.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ["warn", "error"] : ["warn", "error"],
  });

if (!isProduction) globalForPrisma.prisma = prisma;

/**
 * Области контента со своим счётчиком ревизий. Разделов в панели два, и
 * счётчик у каждого свой: иначе правка статьи отклоняла бы открытую рядом
 * форму кейса, хотя они не пересекаются ни одним полем.
 */
export const CASES_SCOPE = "cases";
export const POSTS_SCOPE = "posts";

/** Текущая ревизия контента — она же `version` в контракте API. */
export async function currentRevision(scope: string = CASES_SCOPE): Promise<number> {
  const row = await prisma.contentRevision.upsert({
    where: { scope },
    update: {},
    create: { scope, value: 0 },
  });
  return row.value;
}

/**
 * Ревизия растёт на каждой записи. Панель присылает ту, на которой открылась;
 * если значение уже другое — кто-то успел отредактировать контент, и мы
 * отказываем вместо того, чтобы затереть чужую правку.
 */
export async function bumpRevision(scope: string = CASES_SCOPE): Promise<number> {
  const row = await prisma.contentRevision.upsert({
    where: { scope },
    update: { value: { increment: 1 } },
    create: { scope, value: 1 },
  });
  return row.value;
}
