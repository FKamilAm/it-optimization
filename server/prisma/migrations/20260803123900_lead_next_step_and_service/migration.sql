-- AlterTable
ALTER TABLE "cases" ALTER COLUMN "services" DROP DEFAULT;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "next_action_note" TEXT,
ADD COLUMN     "service" TEXT;
