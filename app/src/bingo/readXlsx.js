// A small .xlsx reader: the first column of the first sheet, as text lines. Enough for a name
// list exported from Excel or an HR / event system, without pulling in a spreadsheet library.
// An .xlsx file is a zip of XML files; the browser's DecompressionStream unpacks it.

const ZIP_END = 0x06054b50;
const ZIP_CENTRAL = 0x02014b50;
const ZIP_LOCAL = 0x04034b50;

/** True when the bytes are a zip (every .xlsx starts with "PK"). */
export function looksLikeXlsx(buffer) {
  const b = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength));
  return b.length === 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 3 && b[3] === 4;
}

/** The zip's files: name -> { method, size, offset } (from the central directory). */
function zipEntries(view) {
  let end = -1;
  for (let i = view.byteLength - 22; i >= Math.max(0, view.byteLength - 65557); i -= 1) {
    if (view.getUint32(i, true) === ZIP_END) { end = i; break; }
  }
  if (end < 0) throw new Error('not a zip file');
  const count = view.getUint16(end + 10, true);
  let p = view.getUint32(end + 16, true);
  const entries = new Map();
  const names = new TextDecoder();
  for (let k = 0; k < count; k += 1) {
    if (view.getUint32(p, true) !== ZIP_CENTRAL) throw new Error('broken zip directory');
    const method = view.getUint16(p + 10, true);
    const size = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const offset = view.getUint32(p + 42, true);
    const name = names.decode(new Uint8Array(view.buffer, view.byteOffset + p + 46, nameLen));
    entries.set(name, { method, size, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/** One file from the zip as text (stored or deflated). */
async function zipText(view, entry) {
  if (view.getUint32(entry.offset, true) !== ZIP_LOCAL) throw new Error('broken zip entry');
  const start = entry.offset + 30 + view.getUint16(entry.offset + 26, true) + view.getUint16(entry.offset + 28, true);
  const bytes = new Uint8Array(view.buffer, view.byteOffset + start, entry.size);
  if (entry.method === 0) return new TextDecoder().decode(bytes);
  if (entry.method !== 8) throw new Error('unsupported zip compression');
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(stream).text();
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
function unescapeXml(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
    return ENTITIES[e] ?? m;
  });
}

/** The text of every <t> inside a piece of XML (rich text has several runs). */
function textOf(xml) {
  return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => unescapeXml(m[1])).join('');
}

/** Path of the workbook's first sheet (in tab order), falling back to sheet1.xml. */
function firstSheetPath(workbookXml, relsXml) {
  const rid = /<sheet\b[^>]*\br:id="([^"]+)"/.exec(workbookXml ?? '')?.[1];
  const rel = rid && new RegExp(`<Relationship\\b[^>]*\\bId="${rid}"[^>]*>`).exec(relsXml ?? '')?.[0];
  const target = rel && /\bTarget="([^"]+)"/.exec(rel)?.[1];
  if (!target) return 'xl/worksheets/sheet1.xml';
  return target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
}

/**
 * Column A of the first sheet, one line per row (empty rows skipped), ready for parseNames.
 * Handles shared strings (Excel), inline strings (many exporters), numbers and formula text.
 */
export async function readXlsxFirstColumn(buffer) {
  const view = new DataView(buffer);
  const entries = zipEntries(view);
  const read = async (name) => (entries.has(name) ? zipText(view, entries.get(name)) : null);
  const sheetPath = firstSheetPath(await read('xl/workbook.xml'), await read('xl/_rels/workbook.xml.rels'));
  const sheet = await read(sheetPath);
  if (!sheet) throw new Error('no worksheet');
  const sharedXml = await read('xl/sharedStrings.xml');
  const shared = sharedXml ? [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1])) : [];
  const lines = [];
  for (const row of sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const cell = [...row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)]
      .find((c) => /\br="A\d+"/.test(c[1]) || !/\br="/.test(c[1]));
    if (!cell || !cell[2]) continue;
    const type = /\bt="([^"]+)"/.exec(cell[1])?.[1];
    const value = /<v>([\s\S]*?)<\/v>/.exec(cell[2])?.[1];
    let text = '';
    if (type === 's') text = shared[Number(value)] ?? '';
    else if (type === 'inlineStr') text = textOf(cell[2]);
    else if (value !== undefined) text = unescapeXml(value);
    text = text.replace(/[\r\n]+/g, ' ').trim();
    if (text) lines.push(text);
  }
  return lines.join('\n');
}
