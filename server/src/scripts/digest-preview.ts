import { prisma } from "../db.js";
import { buildDigestFor, buildTeamDigest } from "../notify/digest.js";

/**
 * Печатает утренние сводки, ничего не отправляя.
 *
 * Проверять текст, рассылая его в рабочий чат, — плохая идея: правки в
 * формулировках случаются часто, а команда получает их все. Здесь то же
 * содержимое, но в терминал.
 *
 *   npm run digest:preview
 */
function strip(html: string): string {
  // Телеграм рисует разметку сам; в терминале она только мешает читать.
  return html
    .replace(/<\/?(b|i|code)>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

async function main(): Promise<void> {
  const team = await buildTeamDigest();
  console.log("=== СВОДКА В ОБЩИЙ ЧАТ ===\n");
  console.log(team ? strip(team) : "(пусто — бот промолчит)");

  const users = await prisma.user.findMany({
    where: { disabledAt: null },
    select: { id: true, email: true, name: true },
  });

  for (const user of users) {
    const personal = await buildDigestFor(user.id);
    console.log(`\n=== ЛИЧНО: ${user.name ?? user.email} ===\n`);
    console.log(personal ? strip(personal) : "(пусто — бот промолчит)");
  }
}

main()
  .catch((cause: unknown) => {
    console.error(cause);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
