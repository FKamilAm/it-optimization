import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { prisma } from "../db.js";
import { hashPassword, validatePasswordStrength } from "../auth/password.js";

/**
 * Создать или пересоздать пользователя панели.
 *
 *   npm run user:create -- admin@it-optimization.ru owner
 *
 * Пароль спрашивается интерактивно и не попадает ни в аргументы команды, ни в
 * историю shell. Если пользователь уже есть — меняется пароль.
 */
async function main(): Promise<void> {
  const [emailArg, roleArg = "owner"] = process.argv.slice(2);

  if (!emailArg) {
    console.error("Использование: npm run user:create -- <email> [owner|editor]");
    process.exitCode = 1;
    return;
  }
  if (roleArg !== "owner" && roleArg !== "editor") {
    console.error("Роль может быть только owner или editor");
    process.exitCode = 1;
    return;
  }

  const email = emailArg.toLowerCase().trim();
  const rl = createInterface({ input: stdin, output: stdout });
  const password = await rl.question(`Пароль для ${email}: `);
  rl.close();

  const weak = validatePasswordStrength(password);
  if (weak) {
    console.error(weak);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, role: roleArg },
    update: { passwordHash, role: roleArg, disabledAt: null },
  });

  // Смена пароля должна выкидывать все открытые сессии.
  await prisma.session.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  console.log(`Готово: ${user.email} (${user.role})`);
}

main()
  .catch((cause: unknown) => {
    console.error(cause);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
