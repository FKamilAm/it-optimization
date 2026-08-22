import { Lock, LockOpen } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/api/client";
import { getVault, RESET_WORD } from "@/api/vault";
import { Button, ErrorNote, Field, Input, Modal } from "@/components/ui";
import { useVault } from "@/vault/vault-context";

/**
 * Замок хранилища паролей.
 *
 * Мастер-фраза — не пароль от CRM, а отдельная: вход в систему сервер
 * проверяет сам, а эта фраза до сервера не доходит вовсе, иначе он смог бы
 * читать пароли, и всё построение теряло бы смысл.
 *
 * Состояние хранилища выясняется у сервера сразу, а не по ходу дела. Раньше
 * человеку, у которого фразы ещё не было, предлагали «разблокировать», и
 * понять, что задавать её надо заново, он мог только введя что-нибудь наугад.
 */

/**
 * Короткую фразу перебирают по утёкшему дампу даже при медленном выводе ключа,
 * а восстановить её потом нельзя. Двенадцать символов — тот же порог, что и у
 * паролей от самой CRM.
 */
const MIN_LENGTH = 12;

export function VaultControl() {
  const { unlocked, lock, configured, refreshStatus } = useVault();
  const [asking, setAsking] = useState(false);

  // Спрашиваем отсюда, а не при старте приложения: до входа /vault ответит 401.
  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

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
        {configured === false ? "Задать мастер-фразу" : "Разблокировать"}
      </Button>
      {asking && (
        <PassphraseDialog
          initialCreating={configured === false}
          onClose={() => setAsking(false)}
        />
      )}
    </>
  );
}

function PassphraseDialog({
  initialCreating,
  onClose,
}: {
  initialCreating: boolean;
  onClose: () => void;
}) {
  const { unlock, create } = useVault();
  const [passphrase, setPassphrase] = useState("");
  const [repeat, setRepeat] = useState("");
  const [creating, setCreating] = useState(initialCreating);
  const [resetting, setResetting] = useState(false);
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
      // Фразу могли сбросить в другой вкладке, пока это окно было открыто.
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

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Считаем ключ…" : creating ? "Создать" : "Разблокировать"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          {/* Сбрасывать нечего, когда фразы и нет. */}
          {!creating && (
            <button
              type="button"
              onClick={() => setResetting(true)}
              className="text-muted-foreground hover:text-danger ml-auto text-xs underline underline-offset-2"
            >
              Забыли фразу?
            </button>
          )}
        </div>

        {busy && (
          <p className="text-muted-foreground mt-3 text-xs">
            Вывод ключа занимает около секунды — так и задумано: это то, что мешает
            перебирать фразу.
          </p>
        )}
      </form>

      {resetting && (
        <ResetDialog
          onClose={() => setResetting(false)}
          onDone={() => {
            // Сразу к созданию новой: сброс делают именно ради этого, и возврат
            // в «разблокировать» тут только сбивал бы с толку.
            setResetting(false);
            setCreating(true);
            setPassphrase("");
            setRepeat("");
            setError(null);
          }}
        />
      )}
    </Modal>
  );
}

/**
 * Сброс хранилища.
 *
 * Выглядит как разрушительная кнопка, но по сути ею не является: **сброс не
 * теряет ничего, что ещё можно было прочитать**. Знаете фразу — он не нужен;
 * не знаете — пароли потеряны и так, а шифротексты в базе только мешают начать
 * заново. Подтверждение набирается руками, потому что операция необратима.
 */
function ResetDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { reset } = useVault();
  const [secrets, setSecrets] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Цена сброса берётся с сервера: человек должен видеть, сколько паролей
  // исчезнет, а не подтверждать вслепую.
  useEffect(() => {
    getVault()
      .then((settings) => setSecrets(settings.configured ? settings.secrets : 0))
      .catch(() => setSecrets(null));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await reset();
      onDone();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Не получилось сбросить");
      setBusy(false);
    }
  }

  return (
    <Modal title="Сбросить хранилище" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p className="text-muted-foreground max-w-prose text-sm">
          Фраза будет забыта, а сохранённые пароли стёрты
          {secrets === null ? "" : secrets === 0 ? " (их пока нет)" : ` — их ${secrets}`}.
        </p>
        <p className="text-muted-foreground mt-2 max-w-prose text-sm">
          <b className="text-foreground">Сами записи останутся на месте.</b> Сервис,
          логин, на кого оформлен, сроки продления, суммы и заметки не трогаются —
          исчезают только пароли.
        </p>
        <p className="text-muted-foreground mt-2 max-w-prose text-sm">
          Ничего читаемого при этом не теряется: если фраза известна, сброс не нужен, а
          если забыта — пароли уже не восстановить ничем. После сброса можно задать новую
          фразу и занести их заново.
        </p>

        <div className="mt-4">
          <Field label={`Наберите ${RESET_WORD}`}>
            <Input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoFocus
              autoComplete="off"
            />
          </Field>
        </div>

        {error && (
          <div className="mt-4">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2">
          <Button type="submit" variant="danger" disabled={busy || typed !== RESET_WORD}>
            {busy ? "Сбрасываем…" : "Сбросить"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </form>
    </Modal>
  );
}
