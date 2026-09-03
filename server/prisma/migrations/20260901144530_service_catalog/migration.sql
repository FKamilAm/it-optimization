-- AlterTable
ALTER TABLE "posts" ALTER COLUMN "takeaways" DROP DEFAULT,
ALTER COLUMN "services" DROP DEFAULT;

-- CreateTable
CREATE TABLE "service_categories" (
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "service_entries" (
    "key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category_key" TEXT NOT NULL,
    "draft" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,

    CONSTRAINT "service_entries_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_entries_slug_key" ON "service_entries"("slug");

-- AddForeignKey
ALTER TABLE "service_entries" ADD CONSTRAINT "service_entries_category_key_fkey" FOREIGN KEY ("category_key") REFERENCES "service_categories"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
