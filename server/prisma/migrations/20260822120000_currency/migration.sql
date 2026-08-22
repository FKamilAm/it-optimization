-- Валюта у каждой суммы.
--
-- Признак хранится рядом с суммой, а не один на всю систему: часть работ
-- считается в долларах, и общая валюта заставляла бы переводить по курсу —
-- то есть подставлять число, которого никто не называл.
--
-- Всё, что уже введено, — рубли, поэтому значение по умолчанию именно такое.
CREATE TYPE "Currency" AS ENUM ('rub', 'usd');

ALTER TABLE "projects" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'rub';
ALTER TABLE "invoices" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'rub';
ALTER TABLE "credentials" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'rub';
