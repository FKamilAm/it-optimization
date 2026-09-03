/**
 * Выгрузка услуг в прайс-лист «Товары и услуги» Яндекс Бизнеса.
 *
 * Отдаёт XLSX с колонками шаблона Яндекса в его же порядке (Категория,
 * Название, Идентификатор, Описание, Короткое описание, Цена, Ссылка,
 * Фотография, Популярный товар, В наличии, Количество, Единицы измерения) —
 * шаблон разбирается по позиции столбца, поэтому колонки нельзя ни
 * переименовывать, ни менять местами, даже пустые.
 *
 * Источник данных — те же файлы, что и сайт: каталог, тексты страниц,
 * `messages/ru.json` и кейсы. Черновики включены: услуга существует и
 * продаётся, даже когда её страница ещё не опубликована, — не хватает только
 * ссылки, и она дозаполняется в кабинете после публикации.
 *
 * Заодно раскладывает обложки услуг в `public/service-covers/` (см. ниже) —
 * Яндексу нужна прямая ссылка на JPG или PNG, а на сайте всё в WebP.
 *
 * Зависимость одна — sharp (и та уже стоит ради обложек кейсов): xlsx это zip
 * из нескольких XML, а deflate и CRC32 собираются из `node:zlib`.
 *
 * node scripts/export-yandex-business.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";
import sharp from "sharp";

const SITE = "https://it-optimization.ru";
const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));

const catalog = read("content/service-catalog.json");
const pagesRaw = read("content/services.json");
const pages = Array.isArray(pagesRaw) ? pagesRaw : pagesRaw.items;
const casesRaw = read("content/cases.json");
const cases = Array.isArray(casesRaw) ? casesRaw : casesRaw.items;
const cards = read("messages/ru.json").services.items;

const pageByKey = Object.fromEntries(pages.map((p) => [p.key, p]));
const categoryByKey = Object.fromEntries(catalog.categories.map((c) => [c.key, c.title]));

// --- Обложки -----------------------------------------------------------
// Только по флагу `--covers`. Яндекс скачивает картинку по прямой ссылке, а не
// берёт её из файла, так что обложки имеют смысл лишь после того, как они уже
// выложены на сайт. Пока их там нет, колонка должна остаться пустой: ссылка на
// несуществующий адрес хуже, чем её отсутствие.
const WITH_COVERS = process.argv.includes("--covers");
const COVERS_DIR = "public/service-covers";
const COVER_SIZE = 800; // у Яндекса минимум 320×240, в карточке это миниатюра
const usedCovers = new Set();

// Своих картинок под услуги нет, поэтому берём обложки кейсов: у каждого кейса
// уже проставлен `services` — тот же ключ, что и в каталоге, — так что подбор
// не выдумывается здесь, а следует за разметкой кейсов. Услуга без кейса
// остаётся без обложки: чужая картинка хуже, чем никакой.
const coverByService = !WITH_COVERS
  ? {}
  : Object.fromEntries(
      catalog.services.flatMap((s) => {
        // Ближе всего услуге тот кейс, где она стоит в списке первой: это его
        // основная тема, а не побочная. Одну обложку двум услугам не отдаём —
        // в сетке каталога повтор читается как ошибка.
        const candidates = cases
          .map((c, order) => ({ c, order, rank: (c.services ?? []).indexOf(s.key) }))
          .filter((x) => x.rank >= 0)
          .sort((a, b) => a.rank - b.rank || a.order - b.order);
        const match = candidates.find((x) => !usedCovers.has(x.c.cover));
        if (!match) return [];
        usedCovers.add(match.c.cover);
        return [[s.key, match.c.cover]];
      }),
    );

if (WITH_COVERS) {
  mkdirSync(new URL(`../${COVERS_DIR}/`, import.meta.url), { recursive: true });
  await Promise.all(
    Object.entries(coverByService).map(([key, cover]) =>
      sharp(fileURLToPath(new URL(`../public${cover}`, import.meta.url)))
        .resize(COVER_SIZE, COVER_SIZE)
        .jpeg({ quality: 82 })
        .toFile(fileURLToPath(new URL(`../${COVERS_DIR}/${key}.jpg`, import.meta.url))),
    ),
  );
}

/** Яндекс принимает только число: «от 120 000 ₽» → 120000, диапазоны запрещены. */
const toNumber = (price) => Number((price ?? "").replace(/[^\d]/g, "")) || 0;

/**
 * Обрезка под лимит поля («Короткое описание» — 250 символов, «Описание» —
 * 3000). Сначала пробуем закончить на границе предложения: оборванная на
 * полуслове фраза в карточке читается как недоделанная, а не как «дальше есть
 * ещё». Если целого предложения в лимит не влезло — режем по слову.
 */
function clamp(text, limit) {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  const sentence = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf("! "),
    cut.lastIndexOf("? "),
  );
  if (sentence > limit * 0.6) return cut.slice(0, sentence + 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/**
 * Порядок и написание — как в шаблоне Яндекса. Незаполненные колонки остаются
 * в файле пустыми: убрать их — значит сдвинуть все следующие.
 */
const COLUMNS = [
  "Категория",
  "Название",
  "Идентификатор",
  "Описание",
  "Короткое описание",
  "Цена",
  "Ссылка",
  "Фотография",
  "Популярный товар",
  "В наличии",
  "Количество",
  "Единицы измерения",
];

const rows = catalog.services.map((s) => {
  const page = pageByKey[s.key];
  const card = cards[s.key];
  if (!page || !card) throw new Error(`Нет данных для услуги «${s.key}»`);

  // У черновиков тарифов ещё нет — цена и срок берутся из карточки услуги.
  const base = page.tariffs?.[0];
  const price = base?.price ?? card.budget;
  const deadline = base?.deadline ?? card.deadline;
  const monthly = /мес/.test(price);

  const includes = (page.includes ?? []).map((i) => `• ${i}`).join("\n");
  const description = [
    page.lead,
    includes && `\nЧто входит:\n${includes}`,
    `\nЦена — ${price}, срок — ${deadline}. Точную оценку даём после брифа.`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    Категория: categoryByKey[s.category] ?? "",
    Название: clamp(card.title, 250),
    Идентификатор: s.key,
    Описание: clamp(description, 3000),
    "Короткое описание": clamp(
      `${monthly ? "Абонентская плата" : "Стоимость"} ${price}. ${card.description}`,
      250,
    ),
    Цена: toNumber(price),
    // Ссылку заполняем только для опубликованных страниц: у черновика она вела
    // бы на noindex-страницу, которой ещё нет в поиске.
    Ссылка: s.draft ? "" : `${SITE}/uslugi/${s.slug}/`,
    // Имя файла — ключ услуги, без хеша: этот адрес уезжает в каталог Яндекса,
    // и менять его при каждой замене картинки значит ломать уже загруженный
    // прайс-лист.
    Фотография: coverByService[s.key] ? `${SITE}/service-covers/${s.key}.jpg` : "",
    "Популярный товар": "",
    "В наличии": "",
    Количество: "",
    // Список единиц у Яндекса закрытый (штука, час, килограмм…), «услуги» в нём
    // нет — поле необязательное, а неизвестное значение завалит проверку файла.
    "Единицы измерения": "",
  };
});

const table = [COLUMNS, ...rows.map((r) => COLUMNS.map((c) => r[c]))];

// --- XLSX --------------------------------------------------------------
const xmlEscape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** Номер колонки в адрес ячейки: 1 → A, 27 → AA. */
function colName(n) {
  let name = "";
  while (n > 0) {
    const rest = (n - 1) % 26;
    name = String.fromCharCode(65 + rest) + name;
    n = (n - rest - 1) / 26;
  }
  return name;
}

// Строки складываем в общую таблицу sharedStrings — так делает сам Excel, и это
// единственный вариант, который читают все парсеры без исключений.
const sharedIndex = new Map();
const shared = [];
const sharedId = (text) => {
  if (!sharedIndex.has(text)) {
    sharedIndex.set(text, shared.length);
    shared.push(text);
  }
  return sharedIndex.get(text);
};

const sheetRows = table
  .map((values, r) => {
    const cells = values
      .map((value, c) => {
        if (value === "" || value === null || value === undefined) return "";
        const ref = `${colName(c + 1)}${r + 1}`;
        const style = r === 0 ? ' s="1"' : "";
        return typeof value === "number"
          ? `<c r="${ref}"${style}><v>${value}</v></c>`
          : `<c r="${ref}"${style} t="s"><v>${sharedId(String(value))}</v></c>`;
      })
      .join("");
    return `<row r="${r + 1}">${cells}</row>`;
  })
  .join("");

const widths = [22, 38, 20, 60, 46, 12, 44, 14, 18, 12, 12, 18]
  .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
  .join("");

const NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

const files = {
  "[Content_Types].xml": `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
  "_rels/.rels": `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  "xl/workbook.xml": `${XML}<workbook xmlns="${NS}" xmlns:r="${REL}"><sheets><sheet name="Прайс-лист" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  "xl/_rels/workbook.xml.rels": `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${REL}/sharedStrings" Target="sharedStrings.xml"/><Relationship Id="rId3" Type="${REL}/styles" Target="styles.xml"/></Relationships>`,
  "xl/styles.xml": `${XML}<styleSheet xmlns="${NS}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`,
  "xl/sharedStrings.xml": `${XML}<sst xmlns="${NS}" count="${shared.length}" uniqueCount="${shared.length}">${shared.map((s) => `<si><t xml:space="preserve">${xmlEscape(s)}</t></si>`).join("")}</sst>`,
  "xl/worksheets/sheet1.xml": `${XML}<worksheet xmlns="${NS}"><cols>${widths}</cols><sheetData>${sheetRows}</sheetData></worksheet>`,
};

// Минимальный zip-писатель: локальные заголовки, центральный каталог, EOCD.
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(entries) {
  const locals = [];
  const central = [];
  let offset = 0;
  for (const [name, content] of Object.entries(entries)) {
    const nameBuf = Buffer.from(name, "utf8");
    const raw = Buffer.from(content, "utf8");
    const data = deflateRawSync(raw);
    const sum = crc32(raw);

    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0);
    head.writeUInt16LE(20, 4); // минимальная версия распаковщика
    head.writeUInt16LE(0x0800, 6); // имена в UTF-8
    head.writeUInt16LE(8, 8); // deflate
    head.writeUInt32LE(sum, 14);
    head.writeUInt32LE(data.length, 18);
    head.writeUInt32LE(raw.length, 22);
    head.writeUInt16LE(nameBuf.length, 26);
    locals.push(head, nameBuf, data);

    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4);
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(0x0800, 8);
    dir.writeUInt16LE(8, 10);
    dir.writeUInt32LE(sum, 16);
    dir.writeUInt32LE(data.length, 20);
    dir.writeUInt32LE(raw.length, 24);
    dir.writeUInt16LE(nameBuf.length, 28);
    dir.writeUInt32LE(offset, 42);
    central.push(dir, nameBuf);

    offset += head.length + nameBuf.length + data.length;
  }

  const centralBuf = Buffer.concat(central);
  const count = Object.keys(entries).length;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(count, 8);
  end.writeUInt16LE(count, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, end]);
}

const out = new URL("../exports/", import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL("yandex-business-services.xlsx", out), zip(files));

const drafts = catalog.services.filter((s) => s.draft).length;
const covers = Object.keys(coverByService).length;
console.log(
  `Готово: ${rows.length} услуг, ${drafts} без ссылки (черновики) → exports/yandex-business-services.xlsx`,
);
console.log(
  WITH_COVERS
    ? `Обложки: ${covers} JPG в ${COVERS_DIR}/ — выложить на сайт до загрузки прайс-листа`
    : "Обложки не заполнены. Когда картинки будут на сайте — запустить с --covers",
);
