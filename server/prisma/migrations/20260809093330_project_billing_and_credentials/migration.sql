-- CreateEnum
CREATE TYPE "InvoiceKind" AS ENUM ('invoice', 'act');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "act_date" TIMESTAMP(3),
ADD COLUMN     "billing_monthly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contract_date" TIMESTAMP(3),
ADD COLUMN     "contract_number" TEXT,
ADD COLUMN     "hosting" TEXT,
ADD COLUMN     "monthly_amount" INTEGER,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "work_type" TEXT;

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "kind" "InvoiceKind" NOT NULL,
    "period" TEXT NOT NULL,
    "amount" INTEGER,
    "issued_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" UUID NOT NULL,
    "service" TEXT NOT NULL,
    "login" TEXT,
    "url" TEXT,
    "owner" TEXT,
    "secret_hint" TEXT,
    "renews_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoices_period_idx" ON "invoices"("period");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_project_id_kind_period_key" ON "invoices"("project_id", "kind", "period");

-- CreateIndex
CREATE INDEX "credentials_service_idx" ON "credentials"("service");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
