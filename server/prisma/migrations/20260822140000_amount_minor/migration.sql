-- Суммы переезжают в минорные единицы: копейки и центы целым числом.
--
-- Дробные деньги обычным числом с плавающей точкой считать нельзя — 0.1 + 0.2
-- там не равно 0.3, и на суммах это рано или поздно вылезает расхождением в
-- копейку. Decimal решил бы ту же задачу, но притащил бы отдельный тип на все
-- слои, включая JSON.
--
-- Имя столбца меняется вместе со смыслом намеренно: оставь прежнее — и любое
-- пропущенное место покажет сумму в сто раз больше, ничего не сломав.
ALTER TABLE "projects"    RENAME COLUMN "monthly_amount" TO "monthly_amount_minor";
ALTER TABLE "invoices"    RENAME COLUMN "amount"         TO "amount_minor";
ALTER TABLE "credentials" RENAME COLUMN "amount"         TO "amount_minor";

-- Всё, что уже введено, записано целыми рублями.
UPDATE "projects"    SET "monthly_amount_minor" = "monthly_amount_minor" * 100 WHERE "monthly_amount_minor" IS NOT NULL;
UPDATE "invoices"    SET "amount_minor"         = "amount_minor" * 100         WHERE "amount_minor" IS NOT NULL;
UPDATE "credentials" SET "amount_minor"         = "amount_minor" * 100         WHERE "amount_minor" IS NOT NULL;
