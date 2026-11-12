// Pure bingo rules: cards, calls, daubs and wins. No React, no timers.

export const LETTERS = ['B', 'I', 'N', 'G', 'O'];
export const FREE = 'FREE';
export const CARD_SIZES = [3, 4, 5];

/** Numbers per column for a classic card of the given size. */
export function perColumn(size) {
  if (size === 5) return 15;
  if (size === 4) return 12;
  return 10;
}

export function maxNumber(size) {
  return perColumn(size) * size;
}

/** Deterministic-friendly random helpers (rng returns [0,1)). */
export function shuffle(list, rng = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function range(from, to) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

// No free centre square: every square holds a number or an item and must be called.
// (Turn this back on with `size % 2 === 1` — the rest of the code still handles FREE.)
export const FREE_CENTER = false;

export function hasFreeCenter(size) {
  return FREE_CENTER && size % 2 === 1;
}

export function centerIndex(size) {
  return Math.floor((size * size) / 2);
}

/**
 * Classic number card, row-major. Column c holds numbers from its own band
 * (B 1-15, I 16-30 ... for 5x5). A FREE centre only when FREE_CENTER is on.
 */
export function makeClassicCard(size, rng = Math.random) {
  const band = perColumn(size);
  const columns = range(0, size - 1).map((c) =>
    shuffle(range(c * band + 1, c * band + band), rng)
      .slice(0, size)
      .sort((a, b) => a - b),
  );
  const cells = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) cells.push(columns[c][r]);
  }
  if (hasFreeCenter(size)) cells[centerIndex(size)] = FREE;
  return cells;
}

/** How many items a custom card needs (free centre excluded). */
export function itemsNeeded(size) {
  return size * size - (hasFreeCenter(size) ? 1 : 0);
}

/** Custom event card filled at random from the item pool. */
export function makeCustomCard(items, size, rng = Math.random) {
  const picked = shuffle(uniqueItems(items), rng).slice(0, itemsNeeded(size));
  return placeItems(picked, size);
}

/** Put a list of items into card cells, leaving the free centre in place. */
export function placeItems(items, size) {
  const cells = [];
  let k = 0;
  for (let i = 0; i < size * size; i += 1) {
    if (hasFreeCenter(size) && i === centerIndex(size)) cells.push(FREE);
    else {
      cells.push(items[k] ?? null);
      k += 1;
    }
  }
  return cells;
}

export function uniqueItems(items) {
  const seen = new Set();
  const out = [];
  for (const raw of items) {
    const item = String(raw).trim().slice(0, 40);
    const key = item.toLowerCase();
    if (item && !seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

export function parseItems(text) {
  return uniqueItems(String(text).split(/\r?\n|,/));
}

export function initialMarks(cells) {
  return cells.map((v) => v === FREE);
}

/** Every line that wins: rows, columns and both diagonals. */
export function winningLines(size) {
  const lines = [];
  for (let r = 0; r < size; r += 1) lines.push(range(0, size - 1).map((c) => r * size + c));
  for (let c = 0; c < size; c += 1) lines.push(range(0, size - 1).map((r) => r * size + c));
  lines.push(range(0, size - 1).map((i) => i * size + i));
  lines.push(range(0, size - 1).map((i) => i * size + (size - 1 - i)));
  return lines;
}

// ----- Win patterns -----
// 'line' = any row, column or diagonal and 'blackout' = every square: both work on every card
// size. The other shapes are 5×5 only (row-major cells).
export const PATTERNS = ['line', 'blackout', 'square', 'heart', 'smile', 'checker', 'candle', 'tree'];
export const ANY_SIZE_PATTERNS = ['line', 'blackout'];
const SHAPES = {
  // big square: the outer edge
  square: [0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24],
  // heart outline:  ■ ■ · ■ ■ / ■ · ■ · ■ / ■ · · · ■ / · ■ · ■ · / · · ■ · ·
  heart: [0, 1, 3, 4, 5, 7, 9, 10, 14, 16, 18, 22],
  // smiley face:    · ■ · ■ · / · · · · · / ■ · ■ · ■ / ■ · · · ■ / · ■ ■ ■ ·
  smile: [1, 3, 10, 12, 14, 15, 19, 21, 22, 23],
  // checkerboard:   ■ · ■ · ■ / · ■ · ■ · / ■ · ■ · ■ / · ■ · ■ · / ■ · ■ · ■
  checker: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24],
  // candlestick:    ■ · ■ · ■ / ■ · ■ · ■ / ■ ■ ■ ■ ■ / · · ■ · · / · · ■ · ·
  candle: [0, 2, 4, 5, 7, 9, 10, 11, 12, 13, 14, 17, 22],
  // christmas tree: · · ■ · · / · ■ ■ ■ · / · ■ ■ ■ · / ■ ■ ■ ■ ■ / · · ■ · ·
  tree: [2, 6, 7, 8, 11, 12, 13, 15, 16, 17, 18, 19, 22],
};

/** The pattern that applies to these settings (shapes only exist on 5×5 cards). */
export function patternOf(settings) {
  const p = settings?.pattern;
  if (p === 'blackout') return 'blackout';
  return settings?.size === 5 && SHAPES[p] ? p : 'line';
}

/** The sets of squares that win for a pattern: every line, the whole card, or the one shape. */
export function winTargets(size, pattern = 'line') {
  if (pattern === 'blackout') return [range(0, size * size - 1)];
  return size === 5 && SHAPES[pattern] ? [SHAPES[pattern]] : winningLines(size);
}

/** The first complete target (its squares), or null. */
export function findWin(marks, size, pattern = 'line') {
  return winTargets(size, pattern).find((line) => line.every((i) => marks[i])) ?? null;
}

/** Fewest squares still missing for the pattern (0 means bingo). */
export function squaresAway(marks, size, pattern = 'line') {
  return Math.min(...winTargets(size, pattern).map((line) => line.filter((i) => !marks[i]).length));
}

export function sameValue(a, b) {
  if (typeof a === 'number' || typeof b === 'number') return Number(a) === Number(b);
  return String(a).toLowerCase() === String(b).toLowerCase();
}

/** Index of a called value on a card, or -1. */
export function cellIndexOf(cells, value) {
  return cells.findIndex((v) => v !== FREE && v !== null && sameValue(v, value));
}

/** True when the square at index may be daubed given the calls so far. */
export function canDaub(cells, index, called) {
  const v = cells[index];
  if (v === FREE) return true;
  return called.some((c) => sameValue(c, v));
}

/** A claim is valid only when the pattern is daubed AND every daub was called. */
export function validateClaim(cells, marks, size, called, pattern = 'line') {
  const honest = marks.map((m, i) => m && canDaub(cells, i, called));
  return findWin(honest, size, pattern);
}

/** Mark everything already called (used when auto-daub is on). */
export function autoMarks(cells, called) {
  return cells.map((v, i) => v === FREE || canDaub(cells, i, called));
}

/** Letter shown before a classic number (only meaningful on 5x5). */
export function letterFor(n, size) {
  if (typeof n !== 'number') return '';
  const col = Math.min(size - 1, Math.floor((n - 1) / perColumn(size)));
  return size === 5 ? LETTERS[col] : LETTERS[col] ?? '';
}

export function makeDrawOrder(mode, size, pool, rng = Math.random) {
  if (mode === 'classic') return shuffle(range(1, maxNumber(size)), rng);
  return shuffle(uniqueItems(pool), rng);
}

export function makeRoomCode(rng = Math.random) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return range(1, 6)
    .map(() => alphabet[Math.floor(rng() * alphabet.length)])
    .join('');
}
