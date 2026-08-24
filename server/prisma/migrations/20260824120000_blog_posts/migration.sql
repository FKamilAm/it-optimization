-- Статьи блога. Раньше они жили в двух местах разом: метаданные в константе
-- BLOG_POSTS, текст — в каталоге переводов messages/ru.json. Так их нельзя
-- было править из панели, поэтому статья становится такими же данными, как
-- кейс: строка здесь, снапшот в content/blog.json, статика на сайте.
CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "lead" TEXT NOT NULL,
    "meta_title" TEXT NOT NULL,
    "meta_description" TEXT NOT NULL,
    "cover" TEXT NOT NULL DEFAULT '',
    "reading_time" INTEGER NOT NULL,
    -- Разделы статьи целиком: [{ heading, body: string[] }]. Отдельными
    -- таблицами их не раскладываем — они никогда не читаются без статьи.
    "sections" JSONB NOT NULL,
    "takeaways" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "position" INTEGER NOT NULL,
    "published_at" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");

CREATE INDEX "posts_status_position_idx" ON "posts"("status", "position");
