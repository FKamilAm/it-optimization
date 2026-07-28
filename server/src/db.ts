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

export const CASES_SCOPE = "cases";

/** Текущая ревизия контента — она же `version` в контракте API. */
export async function currentRevision(): Promise<number> {
  const row = await prisma.contentRevision.upsert({
    where: { scope: CASES_SCOPE },
    update: {},
    create: { scope: CASES_SCOPE, value: 0 },
  });
  return row.value;
}
