-- Доступ можно привязать к проекту: у одного клиента их набирается несколько,
-- и плоский список перестаёт читаться уже на втором десятке.
--
-- SetNull, а не Cascade: закрытый проект не должен уносить с собой пароль от
-- хостинга, на котором его сайт продолжает работать.
ALTER TABLE "credentials" ADD COLUMN "project_id" UUID;

ALTER TABLE "credentials"
  ADD CONSTRAINT "credentials_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "credentials_project_id_idx" ON "credentials"("project_id");
