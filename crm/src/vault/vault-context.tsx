import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getVault, setupVault } from "@/api/vault";
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
  unlock: (passphrase: string) => Promise<void>;
  create: (passphrase: string) => Promise<void>;
  lock: () => void;
  encryptSecret: (plaintext: string) => Promise<string>;
  decryptSecret: (packed: string) => Promise<string>;
}

const VaultContext = createContext<VaultValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  const unlock = useCallback(async (passphrase: string) => {
    const settings = await getVault();
    if (!settings.configured) {
      setNeedsSetup(true);
      throw new Error("Мастер-фраза ещё не задана");
    }

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
  }, []);

  const lock = useCallback(() => setKey(null), []);

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
      unlock,
      create,
      lock,
      encryptSecret,
      decryptSecret,
    }),
    [key, needsSetup, unlock, create, lock, encryptSecret, decryptSecret],
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault(): VaultValue {
  const value = useContext(VaultContext);
  if (!value) throw new Error("useVault вне VaultProvider");
  return value;
}
