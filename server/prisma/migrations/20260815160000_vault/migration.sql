-- Хранилище паролей: сервер держит только шифротекст.
--
-- Ключ выводится из мастер-фразы в браузере и на сервер не передаётся, поэтому
-- ни здесь, ни в ночных дампах открытых паролей нет. Столбец текстовый:
-- в нём base64 от `iv || ciphertext` переменной длины.
ALTER TABLE "credentials" ADD COLUMN "secret" TEXT;

-- Соль и контрольное значение. Строка одна на всю установку: ключ общий,
-- а проверить правильность введённой фразы иначе нечем — сервер её не знает.
CREATE TABLE "vault_settings" (
  "id"         TEXT NOT NULL DEFAULT 'vault',
  "salt"       TEXT NOT NULL,
  "verifier"   TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "vault_settings_pkey" PRIMARY KEY ("id")
);
