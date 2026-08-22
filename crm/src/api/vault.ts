import { api } from "./client";

/**
 * Параметры хранилища паролей. Секретов здесь нет: соль не секретна, а
 * контрольное значение — шифротекст, который без мастер-фразы бесполезен.
 */
export type VaultSettings =
  | { configured: false }
  | {
      configured: true;
      salt: string;
      verifier: string;
      /** Сколько паролей уничтожит сброс — показывается перед подтверждением. */
      secrets: number;
    };

/** Набирается руками: случайно нажать на необратимое не должно получаться. */
export const RESET_WORD = "СБРОСИТЬ";

export async function getVault(): Promise<VaultSettings> {
  return api.get<VaultSettings>("/vault");
}

export async function setupVault(salt: string, verifier: string): Promise<void> {
  await api.post<{ configured: true }>("/vault", { salt, verifier });
}

/**
 * Забыть фразу и стереть все шифротексты.
 *
 * Ничего читаемого при этом не теряется: знаете фразу — сброс не нужен, не
 * знаете — пароли потеряны и без него.
 */
export async function resetVault(): Promise<{ cleared: number }> {
  return api.post<{ cleared: number }>("/vault/reset", { confirm: RESET_WORD });
}
