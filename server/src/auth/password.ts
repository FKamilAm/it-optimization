import argon2 from "argon2";

/**
 * Argon2id с параметрами, рассчитанными на небольшой VPS: 19 МиБ памяти и две
 * итерации — рекомендация OWASP, подбор по украденному хэшу становится дорогим,
 * а вход остаётся быстрым.
 */
const OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    // Битый или чужого формата хэш — это «не совпало», а не 500.
    return false;
  }
}

/**
 * Минимальные требования к паролю. Длина важнее набора символов, поэтому
 * проверяется именно она.
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 12) return "Пароль должен быть не короче 12 символов";
  if (/^\d+$/.test(password)) return "Пароль не должен состоять только из цифр";
  return null;
}
