import { api } from "./client";

/**
 * Справочник учёток сервисов — **без паролей**.
 *
 * Это ответ на «что у нас есть», «на кого записано» и «когда продлевать», а не
 * хранилище секретов: база уезжает в дампы, и одна их утечка отдала бы разом
 * все сервисы. Пароли живут в менеджере паролей, а `secretHint` подсказывает,
 * в каком именно и где искать.
 */
export interface Credential {
  id: string;
  service: string;
  login: string | null;
  url: string | null;
  owner: string | null;
  secretHint: string | null;
  renewsAt: string | null;
  notes: string | null;
}

export interface CredentialInput {
  service?: string;
  login?: string | null;
  url?: string | null;
  owner?: string | null;
  secretHint?: string | null;
  renewsAt?: string | null;
  notes?: string | null;
}

export async function listCredentials(search?: string): Promise<Credential[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const { credentials } = await api.get<{ credentials: Credential[] }>(
    `/credentials${query}`,
  );
  return credentials;
}

export async function createCredential(input: CredentialInput): Promise<Credential> {
  const { credential } = await api.post<{ credential: Credential }>(
    "/credentials",
    input,
  );
  return credential;
}

export async function updateCredential(
  id: string,
  input: CredentialInput,
): Promise<Credential> {
  const { credential } = await api.patch<{ credential: Credential }>(
    `/credentials/${id}`,
    input,
  );
  return credential;
}

export async function deleteCredential(id: string): Promise<void> {
  await api.delete<void>(`/credentials/${id}`);
}
