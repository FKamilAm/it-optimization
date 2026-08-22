import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getVault, resetVault, setupVault } from "@/api/vault";
import {
  checkVerifier,
  decrypt,
  deriveKey,
  encrypt,
  makeVerifier,
  randomSalt,
} from "@/lib/vault";

/**
 * Состояние хранилища паролей на время вкладки.
 *
 * Ключ живёт только здесь, в памяти: ни localStorage, ни куки, ни сервер его
 * не видят. Поэтому перезагрузка страницы и выход запирают хранилище сами
 * собой, а переход между разделами — нет, и вводить фразу заново не приходится.
 *
 * Контекст поднят на уровень приложения именно ради этого: держи ключ в
 * состоянии экрана, и он терялся бы при каждом уходе на «Проекты».
 */

interface VaultValue {
  /** Ключ выведен — пароли можно читать и сохранять. */
  unlocked: boolean;
  /** Мастер-фраза ещё не задана: хранилищем никто не пользовался. */
  needsSetup: boolean;
  /**
   * Задана ли фраза вообще. `null` — ещё не спрашивали.
   *
   * Живёт в контексте, а не в компоненте, потому что нужна двоим: замку в
   * шапке и полю пароля в карточке. «Не задана» и «заперто» — разные вещи, и
   * подсказка «разблокируйте хранилище» там, где разблокировать нечего, только
   * запутывает.
   */
  configured: boolean | null;
  /** Спросить сервер. Вызывается с экранов, а не при старте: до входа /vault ответит 401. */
  refreshStatus: () => Promise<void>;
  /**
   * Растёт после сброса. Экраны, держащие записи в памяти, обязаны на него
   * смотреть: сброс обнуляет шифротексты на сервере, и список, загруженный до
   * него, остаётся со старыми — новый ключ их не читает, а поле пароля
   * запирается намертво.
   */
  revision: number;
  unlock: (passphrase: string) => Promise<void>;
  create: (passphrase: string) => Promise<void>;
  lock: () => void;
  /** Сброс: фраза забыта, шифротексты стёрты. Возвращает, сколько уничтожено. */
  reset: () => Promise<number>;
  encryptSecret: (plaintext: string) => Promise<string>;
  decryptSecret: (packed: string) => Promise<string>;
}

const VaultContext = createContext<VaultValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [revision, setRevision] = useState(0);
  const [configured, setConfigured] = useState<boolean | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      setConfigured((await getVault()).configured);
    } catch {
      setConfigured(null);
    }
  }, []);

  const unlock = useCallback(async (passphrase: string) => {
    const settings = await getVault();
    if (!settings.configured) {
      setConfigured(false);
      setNeedsSetup(true);
      throw new Error("Мастер-фраза ещё не задана");
    }

    setConfigured(true);
    const derived = await deriveKey(passphrase, settings.salt);
    // Проверить фразу может только тот, у кого есть ключ: сервер её не знает.
    if (!(await checkVerifier(derived, settings.verifier))) {
      throw new Error("Фраза не подходит");
    }
    setKey(derived);
    setNeedsSetup(false);
  }, []);

  const create = useCallback(async (passphrase: string) => {
    const salt = randomSalt();
    const derived = await deriveKey(passphrase, salt);
    await setupVault(salt, await makeVerifier(derived));
    setKey(derived);
    setNeedsSetup(false);
    setConfigured(true);
  }, []);

  const lock = useCallback(() => setKey(null), []);

  const reset = useCallback(async () => {
    const { cleared } = await resetVault();
    setKey(null);
    setNeedsSetup(true);
    setConfigured(false);
    setRevision((current) => current + 1);
    return cleared;
  }, []);

  const encryptSecret = useCallback(
    async (plaintext: string) => {
      if (!key) throw new Error("Хранилище заперто");
      return encrypt(key, plaintext);
    },
    [key],
  );

  const decryptSecret = useCallback(
    async (packed: string) => {
      if (!key) throw new Error("Хранилище заперто");
      return decrypt(key, packed);
    },
    [key],
  );

  const value = useMemo(
    () => ({
      unlocked: key !== null,
      needsSetup,
      configured,
      refreshStatus,
      revision,
      unlock,
      create,
      lock,
      reset,
      encryptSecret,
      decryptSecret,
    }),
    [
      key,
      needsSetup,
      configured,
      refreshStatus,
      revision,
      unlock,
      create,
      lock,
      reset,
      encryptSecret,
      decryptSecret,
    ],
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault(): VaultValue {
  const value = useContext(VaultContext);
  if (!value) throw new Error("useVault вне VaultProvider");
  return value;
}
