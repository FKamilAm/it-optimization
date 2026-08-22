import type { Credential } from "@prisma/client";

/**
 * Форма учётки для клиента. Вынесена из routes.ts, потому что её читает ещё и
 * экран «Сегодня»: сроки продления попадают в общую сводку, и две копии
 * преобразования разошлись бы при первом же новом поле.
 *
 * Паролей в этой форме нет — их нет и в таблице, см. `routes.ts`.
 */
export interface CredentialDto {
  id: string;
  service: string;
  login: string | null;
  url: string | null;
  owner: string | null;
  secretHint: string | null;
  /** Шифротекст пароля. Сервер его не понимает — расшифровка в браузере. */
  secret: string | null;
  renewsAt: string | null;
  amount: number | null;
  monthlyFee: boolean;
  notes: string | null;
}

export function toCredentialDto(item: Credential): CredentialDto {
  return {
    id: item.id,
    service: item.service,
    login: item.login,
    url: item.url,
    owner: item.owner,
    secretHint: item.secretHint,
    secret: item.secret,
    renewsAt: item.renewsAt?.toISOString() ?? null,
    amount: item.amount,
    monthlyFee: item.monthlyFee,
    notes: item.notes,
  };
}
