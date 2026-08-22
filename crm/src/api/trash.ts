import { api } from "./client";

/**
 * Корзина. Удаление в CRM мягкое, и раньше это было кладбищем: записи копились
 * и не читались никогда. Теперь это отсрочка — столько-то дней запись можно
 * вернуть, потом она исчезает насовсем.
 */
export interface TrashItem {
  entity: string;
  /** Единственное число для подписи: «Лид», «Проект». */
  label: string;
  id: string;
  title: string;
  deletedAt: string;
}

export interface Trash {
  items: TrashItem[];
  retentionDays: number;
}

export async function getTrash(): Promise<Trash> {
  return api.get<Trash>("/trash");
}

export async function restoreItem(entity: string, id: string): Promise<void> {
  await api.post<void>("/trash/restore", { entity, id });
}

/** Удалить сейчас, не дожидаясь срока. Обратного пути нет. */
export async function purgeItem(entity: string, id: string): Promise<void> {
  await api.post<void>("/trash/purge", { entity, id });
}

/** Очистить целиком. Возвращает, сколько записей исчезло. */
export async function emptyTrash(): Promise<number> {
  const { purged } = await api.post<{ purged: number }>("/trash/empty", {});
  return purged;
}
