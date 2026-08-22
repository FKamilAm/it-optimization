import { api } from "./client";

/**
 * Параметры хранилища паролей. Секретов здесь нет: соль не секретна, а
 * контрольное значение — шифротекст, который без мастер-фразы бесполезен.
 */
export type VaultSettings =
  { configured: false } | { configured: true; salt: string; verifier: string };

export async function getVault(): Promise<VaultSettings> {
  return api.get<VaultSettings>("/vault");
}

export async function setupVault(salt: string, verifier: string): Promise<void> {
  await api.post<{ configured: true }>("/vault", { salt, verifier });
}
