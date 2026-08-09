-- Роль маркетолога и имена разработчиков на проектах и задачах.
--
-- Разработчики работают под общим входом, отдельных учётных записей у них нет,
-- поэтому «кто ведёт» — это имена, а не ссылки на users. Списком: проект и
-- задачу нередко тянут вдвоём.
--
-- Порядок важен: сначала добавляем колонки, потом переносим в них того, кто
-- был указан ссылкой, и только затем убираем сами ссылки. Наоборот — потеря
-- данных.
--
-- ALTER TYPE ... ADD VALUE внутри транзакции разрешён с PostgreSQL 12, если
-- новое значение в этой же транзакции не используется. Здесь оно только
-- объявляется.

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'marketing';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "developers" TEXT[];
ALTER TABLE "tasks" ADD COLUMN "developers" TEXT[];

-- Перенос: имя прежнего ответственного становится первым в списке. Берём
-- users.name, а не почту: в списке должно стоять имя, под которым человека
-- знают. Записи без имени пропускаем — почта там выглядела бы мусором.
UPDATE "projects" p
SET "developers" = ARRAY[u."name"]
FROM "users" u
WHERE p."owner_id" = u."id" AND u."name" IS NOT NULL AND u."name" <> '';

UPDATE "tasks" t
SET "developers" = ARRAY[u."name"]
FROM "users" u
WHERE t."assignee_id" = u."id" AND u."name" IS NOT NULL AND u."name" <> '';

-- Пустой массив вместо NULL: на выборках «есть ли исполнители» NULL и пустой
-- список ведут себя по-разному, а различать их незачем.
UPDATE "projects" SET "developers" = '{}' WHERE "developers" IS NULL;
UPDATE "tasks" SET "developers" = '{}' WHERE "developers" IS NULL;

ALTER TABLE "projects" ALTER COLUMN "developers" SET NOT NULL;
ALTER TABLE "tasks" ALTER COLUMN "developers" SET NOT NULL;

-- DropIndex
DROP INDEX "tasks_assignee_id_due_at_idx";

-- CreateIndex
CREATE INDEX "tasks_due_at_idx" ON "tasks"("due_at");

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_owner_id_fkey";
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assignee_id_fkey";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "owner_id";
ALTER TABLE "tasks" DROP COLUMN "assignee_id";
