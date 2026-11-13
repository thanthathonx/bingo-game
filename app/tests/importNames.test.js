import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeNames, parseNames, MAX_IMPORTED } from '../src/bingo/importNames.js';

test('reads the first column, skips a header row and blank lines', () => {
  const csv = 'Name,Department\nSomchai Jaidee,Sales\n\n"Malee, K.",IT\nAnna Lee,HR\n';
  assert.deepEqual(parseNames(csv).names, ['Somchai Jaidee', 'Malee, K.', 'Anna Lee']);
});

test('works with a plain list, semicolons, tabs and a Thai header', () => {
  assert.deepEqual(parseNames('Ann\r\nBo\r\nCy').names, ['Ann', 'Bo', 'Cy']);
  assert.deepEqual(parseNames('ชื่อ;แผนก\nสมชาย;ขาย\nมาลี;ไอที').names, ['สมชาย', 'มาลี']);
  assert.deepEqual(parseNames('Full name\tTeam\nAnn\tA\nBo\tB').names, ['Ann', 'Bo']);
});

test('drops repeated names, shortens long ones and stops at the limit', () => {
  const r = parseNames('Ann\nann\nBo\nA very very long employee name here');
  assert.deepEqual(r.names, ['Ann', 'Bo', 'A very very long emp']);
  assert.equal(r.duplicates, 1);
  assert.equal(r.shortened, 1);
  const many = Array.from({ length: MAX_IMPORTED + 7 }, (_, i) => `Person ${i}`).join('\n');
  const big = parseNames(many);
  assert.equal(big.names.length, MAX_IMPORTED);
  assert.equal(big.overLimit, 7);
});

test('decodes UTF-8 (with or without BOM) and Thai Windows CSV (windows-874)', () => {
  const utf8 = new TextEncoder().encode('﻿สมชาย\nมาลี');
  assert.deepEqual(parseNames(decodeNames(utf8.buffer)).names, ['สมชาย', 'มาลี']);
  // "สม\nมา" in windows-874 (TIS-620): ส=0xCA ม=0xC1 า=0xD2
  const tis = new Uint8Array([0xca, 0xc1, 0x0a, 0xc1, 0xd2]);
  assert.deepEqual(parseNames(decodeNames(tis.buffer)).names, ['สม', 'มา']);
});

test('a file with no names gives none', () => {
  assert.deepEqual(parseNames('\n  \nName\n').names, []);
  assert.deepEqual(parseNames('').names, []);
});

// ---------- Excel .xlsx (fixtures hold made-up names only) ----------
import { readFileSync } from 'node:fs';
import { looksLikeXlsx, readXlsxFirstColumn } from '../src/bingo/readXlsx.js';
import { looksLikeOldXls } from '../src/bingo/importNames.js';

const bytes = (name) => { const b = readFileSync(new URL(`./fixtures/${name}`, import.meta.url)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };

test('reads column A of the first sheet of an Excel-saved .xlsx (shared strings, compressed)', async () => {
  const buffer = bytes('names-excel.xlsx');
  assert.equal(looksLikeXlsx(buffer), true);
  const r = parseNames(await readXlsxFirstColumn(buffer), MAX_IMPORTED, { plain: true });
  // header skipped; commas and & kept; blank row skipped; repeat dropped; number kept as text; spaces tidied;
  // the second sheet is ignored
  assert.deepEqual(r.names, ['สมชาย ใจดี', 'Malee, K.', 'Tom & Jerry', '12345', 'Anna Lee']);
  assert.equal(r.duplicates, 1);
});

test('reads an exported .xlsx with inline text and no compression (like an event system export)', async () => {
  const r = parseNames(await readXlsxFirstColumn(bytes('names-export.xlsx')), MAX_IMPORTED, { plain: true });
  assert.deepEqual(r.names, ['Alpha Tester One', 'pim Example', 'Thanakorn Sample Xyz']); // 20 letters: kept whole
  assert.equal(r.shortened, 0);
});

test('tells a CSV, an .xlsx and an old .xls apart', () => {
  const csv = new TextEncoder().encode('Ann\nBo').buffer;
  assert.equal(looksLikeXlsx(csv), false);
  assert.equal(looksLikeOldXls(csv), false);
  assert.equal(looksLikeOldXls(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1]).buffer), true);
});
