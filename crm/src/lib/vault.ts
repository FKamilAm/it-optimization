/**
 * Шифрование паролей на устройстве.
 *
 * Ключ выводится из мастер-фразы прямо здесь и никогда не покидает браузер:
 * на сервер уезжает только шифротекст. Поэтому утечка ночного дампа отдаёт
 * нечитаемый текст, а не все сервисы разом, — ради этого всё и затевалось.
 *
 * Следствия, которые нельзя «починить»:
 *
 * - забытая мастер-фраза означает потерянные пароли, восстановить их не может
 *   никто, включая владельца сервера;
 * - искать и проверять пароли на сервере невозможно;
 * - остаётся риск, общий для всех веб-хранилищ: захвативший сервер может
 *   подменить этот самый файл и собирать фразу при вводе. Защита от него —
 *   не криптография, а то, что доступ к серверу закрыт.
 *
 * PBKDF2 взят потому, что он есть в WebCrypto нативно: Argon2 пришлось бы
 * тащить wasm-библиотекой ради выигрыша, который при 600 000 итераций и
 * длинной фразе роли не играет.
 */

const KDF_ITERATIONS = 600_000;
const SALT_BYTES = 16;
/** AES-GCM требует ровно 96 бит: больше не безопаснее, а совместимость хуже. */
const IV_BYTES = 12;

/**
 * Что шифруется в контрольное значение. Строка произвольная и не секретна:
 * важно лишь, что при верной фразе она расшифруется, а при неверной AES-GCM
 * не сойдётся по метке подлинности и бросит исключение.
 */
const VERIFIER_PLAINTEXT = "it-optimization-vault";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// Возвращаемый тип уточнён намеренно: WebCrypto принимает только буфер,
// подкреплённый обычным ArrayBuffer, а `new Uint8Array(n)` выводится шире.
function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function randomSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(SALT_BYTES)));
}

/**
 * Мастер-фраза → ключ AES-GCM. Занимает около секунды и это норма: медленный
 * вывод ключа — единственное, что мешает перебирать фразу по утёкшему дампу.
 */
export async function deriveKey(passphrase: string, salt: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromBase64(salt),
      iterations: KDF_ITERATIONS,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Результат — base64 от `iv || ciphertext`: вектор нужен при расшифровке. */
export async function encrypt(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plaintext),
    ),
  );

  const packed = new Uint8Array(iv.length + cipher.length);
  packed.set(iv);
  packed.set(cipher, iv.length);
  return toBase64(packed);
}

/** Бросает, если ключ не тот: у AES-GCM встроена проверка подлинности. */
export async function decrypt(key: CryptoKey, packed: string): Promise<string> {
  const bytes = fromBase64(packed);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bytes.slice(0, IV_BYTES) },
    key,
    bytes.slice(IV_BYTES),
  );
  return new TextDecoder().decode(plain);
}

export async function makeVerifier(key: CryptoKey): Promise<string> {
  return encrypt(key, VERIFIER_PLAINTEXT);
}

/**
 * Проверка фразы без участия сервера: он не знает ни фразы, ни ключа, поэтому
 * сказать «пароль неверный» может только тот, кто попробовал расшифровать.
 */
export async function checkVerifier(key: CryptoKey, verifier: string): Promise<boolean> {
  try {
    return (await decrypt(key, verifier)) === VERIFIER_PLAINTEXT;
  } catch {
    return false;
  }
}
