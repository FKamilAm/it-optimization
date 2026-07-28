import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { audit } from "../audit.js";
import { requireAuth } from "../auth/guard.js";
import { REPO_DIR } from "../assets/images.js";
import { prisma } from "../db.js";
import { canPublish, env } from "../env.js";
import { toDto, type CaseDto } from "../cases/dto.js";
import { commitSnapshot, type CommitFile } from "./github.js";

/**
 * Снапшот для статики: ровно та форма, которую читает `src/lib/cases/`.
 * Черновики на сайт не попадают, а служебные поля (status) в файл не уезжают —
 * сайт про них ничего не знает.
 */
function toSnapshot(cases: CaseDto[]) {
  return cases
    .filter((item) => item.status === "published")
    .map(({ status: _status, ...item }) => item);
}

function validateForPublish(cases: CaseDto[]): string[] {
  const problems: string[] = [];
  for (const item of cases) {
    if (item.status !== "published") continue;
    const label = item.title || item.slug;
    if (!item.cover) problems.push(`«${label}»: нет обложки`);
    if (!item.detail) problems.push(`«${label}»: нет слайда для лайтбокса`);
  }
  return problems;
}

export async function publishRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Отдаёт снапшот, ничего не отправляя. Нужен и для отладки, и для сборки
   * сайта в CI, если однажды захочется брать данные напрямую из API.
   */
  app.get("/cases/snapshot", async (_request, reply) => {
    const items = await prisma.case.findMany({
      where: { deletedAt: null },
      orderBy: { position: "asc" },
      include: { assets: true },
    });
    return reply.send(toSnapshot(items.map(toDto)));
  });

  app.post("/cases/publish", { preHandler: requireAuth }, async (request, reply) => {
    const items = await prisma.case.findMany({
      where: { deletedAt: null },
      orderBy: { position: "asc" },
      include: { assets: true },
    });
    const cases = items.map(toDto);

    const problems = validateForPublish(cases);
    if (problems.length) {
      return reply.code(422).send({ error: "Публикация заблокирована", problems });
    }

    const snapshot = toSnapshot(cases);

    if (!canPublish) {
      // Локальная разработка без доступа к репозиторию: показываем, что уехало бы.
      return reply.send({
        published: false,
        reason:
          "GITHUB_TOKEN не задан — снапшот собран, но никуда не отправлен (режим разработки).",
        cases: snapshot.length,
      });
    }

    // В коммит идут только те картинки, которых ещё нет в репозитории: файл
    // назван по хэшу содержимого, поэтому повторная заливка бессмысленна.
    const assetFiles: CommitFile[] = [];
    for (const item of items) {
      for (const asset of item.assets) {
        const fileName = asset.path.split("/").pop();
        if (!fileName) continue;
        try {
          const binary = await readFile(join(env.UPLOAD_DIR, fileName));
          assetFiles.push({ path: `${REPO_DIR}/${fileName}`, binary });
        } catch {
          // Файла нет локально — значит он уже в репозитории с прошлой публикации.
        }
      }
    }

    try {
      const result = await commitSnapshot(
        `content(cases): публикация из админки (${snapshot.length} кейсов)`,
        [
          {
            path: "content/cases.json",
            text: `${JSON.stringify(snapshot, null, 2)}\n`,
          },
          ...assetFiles,
        ],
      );

      await audit(request, {
        entity: "cases",
        action: "publish",
        diff: { commit: result.sha, cases: snapshot.length, assets: assetFiles.length },
      });

      return reply.send({
        published: true,
        commitUrl: result.commitUrl,
        buildUrl: result.buildUrl,
        cases: snapshot.length,
      });
    } catch (cause) {
      request.log.error({ cause }, "публикация не удалась");
      return reply.code(502).send({
        error:
          cause instanceof Error
            ? `Не удалось отправить в репозиторий: ${cause.message}`
            : "Не удалось отправить в репозиторий",
      });
    }
  });
}
