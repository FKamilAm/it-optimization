-- Отметки планировщика, чтобы перезапуск сервиса не рассылал дайджест заново.

-- CreateTable
CREATE TABLE "job_runs" (
    "job" TEXT NOT NULL,
    "ran_on" TEXT NOT NULL,
    "ran_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_runs_pkey" PRIMARY KEY ("job")
);
