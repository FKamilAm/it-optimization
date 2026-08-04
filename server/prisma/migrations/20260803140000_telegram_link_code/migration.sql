-- Одноразовый код привязки телеграма к пользователю CRM.
--
-- Уникальный индекс безопасен: колонка только что добавлена и вся состоит из
-- NULL, а в PostgreSQL NULL не конфликтует с NULL в уникальном индексе —
-- поэтому непривязанных пользователей может быть сколько угодно.

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "telegram_link_code" TEXT,
ADD COLUMN     "telegram_link_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_link_code_key" ON "users"("telegram_link_code");
