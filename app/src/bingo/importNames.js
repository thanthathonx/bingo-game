// Names for buddies from a CSV or text file (for example an employee list exported from Excel).
// Only the first column is used. Everything stays in the host's browser; the names travel only
// to devices in the same room, like any buddy's name.
import { NAME_MAX, MAX_ROOM_BUDDIES } from '../online/protocol.js';

/** Most buddies a file can add: the host's device plays all of them. */
export const MAX_IMPORTED = MAX_ROOM_BUDDIES;

// A first row that is a column title, not a person.
const HEADER_RE = /^(no\.?|#|names?|full ?names?|employee( names?)?|staff|ชื่อ.*|รายชื่อ.*|ลำดับ)$/i;

/**
 * File bytes to text. Excel saves "CSV UTF-8" as UTF-8 but plain "CSV" on Thai Windows as
 * windows-874, so try UTF-8 strictly first and fall back.
 */
export function decodeNames(buffer) {
  const bytes = new Uint8Array(buffer);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '');
  } catch {
    return new TextDecoder('windows-874').decode(bytes);
  }
}

/** True for an old binary Excel file (.xls), which this reader cannot open. */
export function looksLikeOldXls(buffer) {
  const b = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength));
  return b.length === 4 && b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0;
}

/** The delimiter the first line uses most: comma, semicolon or tab. */
function delimiterOf(line) {
  const counts = [',', ';', '\t'].map((d) => [d, line.split(d).length - 1]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ',';
}

/** The first field of a CSV line, honouring "quoted, values" and "" escapes. */
function firstField(line, delimiter) {
  const text = line.trimStart();
  if (!text.startsWith('"')) return text.split(delimiter)[0];
  let out = '';
  for (let i = 1; i < text.length; i += 1) {
    if (text[i] === '"') {
      if (text[i + 1] === '"') { out += '"'; i += 1; } else break;
    } else out += text[i];
  }
  return out;
}

/**
 * Up to `max` distinct names from the file's first column.
 * plain: each line is already one name (from a spreadsheet cell), so commas are kept.
 * @returns {{ names: string[], duplicates: number, shortened: number, overLimit: number }}
 */
export function parseNames(text, max = MAX_IMPORTED, { plain = false } = {}) {
  const lines = String(text ?? '').split(/\r\n|\n|\r/);
  const firstReal = lines.find((l) => l.trim() !== '') ?? '';
  const delimiter = delimiterOf(firstReal);
  const seen = new Set();
  const names = [];
  let duplicates = 0;
  let shortened = 0;
  let overLimit = 0;
  lines.forEach((line, i) => {
    const raw = (plain ? line : firstField(line, delimiter)).replace(/\s+/g, ' ').trim();
    if (!raw) return;
    if (i === lines.indexOf(firstReal) && HEADER_RE.test(raw)) return;
    const name = raw.length > NAME_MAX ? raw.slice(0, NAME_MAX).trim() : raw;
    const key = name.toLowerCase();
    if (seen.has(key)) { duplicates += 1; return; }
    seen.add(key);
    if (names.length >= max) { overLimit += 1; return; }
    if (name !== raw) shortened += 1;
    names.push(name);
  });
  return { names, duplicates, shortened, overLimit };
}
