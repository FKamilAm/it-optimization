import { Lock, LockOpen } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/api/client";
import { Button, ErrorNote, Field, Input, Modal } from "@/components/ui";
import { useVault } from "@/vault/vault-context";

/**
 * Замок хранилища паролей.
 *
 * Мастер-фраза — не пароль от CRM, а отдельная: вход в систему сервер
 * проверяет сам, а эта фраза до сервера не доходит вовсе, иначе он смог бы
 * читать пароли, и всё построение теряло бы смысл.
 */

/**
 * Короткую фразу перебирают по утёкшему дампу даже при медленном выводе ключа,
 * а восстановить её потом нельзя. Двенадцать символов — тот же порог, что и у
 * паролей от самой CRM.
 */
const MIN_LENGTH = 12;

export function VaultControl() {
  const { unlocked, lock } = useVault();
  const [asking, setAsking] = useState(false);

  if (unlocked) {
    return (
      <Button variant="ghost" onClick={lock} title="Забыть ключ до конца сеанса">
        <LockOpen size={16} strokeWidth={2} />
        Запереть
      </Button>
    );
  }

  return (
    <>
      <Button variant="ghost" onClick={() => setAsking(true)}>
        <Lock size={16} strokeWidth={2} />
        Разблокировать
      </Button>
      {asking && <PassphraseDialog onClose={() => setAsking(false)} />}
    </>
  );
}

function PassphraseDialog({ onClose }: { onClose: () => void }) {
  const { unlock, create } = useVault();
  const [passphrase, setPassphrase] = useState("");
  const [repeat, setRepeat] = useState("");
  // Переключается сам, когда сервер отвечает, что фразы ещё нет.
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (creating) {
      if (passphrase.length < MIN_LENGTH) {
        setError(`Не короче ${MIN_LENGTH} символов`);
        return;
      }
      if (passphrase !== repeat) {
        setError("Фразы не совпадают");
        return;
      }
    }

    setBusy(true);
    try {
      await (creating ? create(passphrase) : unlock(passphrase));
      onClose();
    } catch (cause) {
      // «Фразы ещё нет» — не ошибка, а другой сценарий: показываем создание.
      if (cause instanceof Error && cause.message === "Мастер-фраза ещё не задана") {
        setCreating(true);
        setError(null);
      } else {
        setError(
          cause instanceof ApiError || cause instanceof Error
            ? cause.message
            : "Не получилось",
        );
      }
      setBusy(false);
    }
  }

  return (
    <Modal
      title={creating ? "Придумайте мастер-фразу" : "Мастер-фраза"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <p className="text-muted-foreground max-w-prose text-sm">
          {creating ? (
            <>
              Ею шифруются пароли прямо в браузере — на сервер уходит только шифротекст.
              Поэтому <b className="text-foreground">восстановить её невозможно</b>:
              забудете — пароли пропадут, и помочь не сможет никто. Придумайте одну на
              троих и положите в надёжное место.
            </>
          ) : (
            "Вводится один раз за сеанс. Перезагрузка страницы запирает хранилище снова."
          )}
        </p>

        <div className="mt-4 space-y-4">
          <Field label="Фраза">
            <Input
              type="password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              autoFocus
              autoComplete="off"
              required
            />
          </Field>

          {creating && (
            <Field label="Ещё раз" hint="Опечатка здесь стоит всех паролей сразу">
              <Input
                type="password"
                value={repeat}
                onChange={(event) => setRepeat(event.target.value)}
                autoComplete="off"
                required
              />
            </Field>
          )}
        </div>

        {error && (
          <div className="mt-4">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Считаем ключ…" : creating ? "Создать" : "Разблокировать"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
        </div>

        {busy && (
          <p className="text-muted-foreground mt-3 text-xs">
            Вывод ключа занимает около секунды — так и задумано: это то, что мешает
            перебирать фразу.
          </p>
        )}
      </form>
    </Modal>
  );
}
