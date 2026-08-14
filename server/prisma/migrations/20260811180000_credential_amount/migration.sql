-- Сколько стоит сервис и как часто списывается.
-- Сумма без признака периодичности бесполезна: 500 ₽ в месяц у хостинга и
-- 500 ₽ в год у домена — это разные деньги, а по одной цифре не различить.
ALTER TABLE "credentials"
  ADD COLUMN "amount" INTEGER,
  ADD COLUMN "monthly_fee" BOOLEAN NOT NULL DEFAULT false;
