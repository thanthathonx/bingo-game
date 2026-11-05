// Room codes carry the room's settings and a shared shuffle seed, so a friend who
// types the code on their own device gets the same calls in the same order.
// 6 characters x 5 bits = 30 bits: 12 bits of settings + 18 bits of seed.

import { PRESETS } from './presets.js';

export const CODE_LENGTH = 6;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 symbols, no 0/O/1/I
const SEED_BITS = 18;
const SEED_MAX = 2 ** SEED_BITS;
const SIZES = [3, 4, 5];
const SPEEDS = ['slow', 'normal', 'fast'];
const SKILLS = ['relaxed', 'normal', 'speedy'];
const CUSTOM_PRESET = 7;

export function randomSeed(rng = Math.random) {
  return Math.floor(rng() * SEED_MAX);
}

function presetIndex(presetId) {
  const i = PRESETS.findIndex((p) => p.id === presetId);
  return i < 0 ? CUSTOM_PRESET : i;
}

/** Settings + seed → 6-character code. */
export function encodeRoom(settings, seed) {
  let bits = 0;
  bits = bits * 2 + (settings.mode === 'custom' ? 1 : 0);
  bits = bits * 4 + Math.max(0, SIZES.indexOf(settings.size));
  bits = bits * 2 + (settings.autoCall ? 1 : 0);
  bits = bits * 4 + Math.max(0, SPEEDS.indexOf(settings.speed));
  bits = bits * 2 + (settings.interactiveDaub ? 1 : 0);
  bits = bits * 8 + presetIndex(settings.presetId);
  bits = bits * 4 + Math.max(0, SKILLS.indexOf(settings.skill));
  // 1+2+1+2+1+3+2 = 12 bits of settings
  let value = bits * SEED_MAX + (seed % SEED_MAX);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code = ALPHABET[value % 32] + code;
    value = Math.floor(value / 32);
  }
  return code;
}

/** Tidy what a person typed: upper case, no spaces or dashes. */
export function normalizeCode(text) {
  return String(text).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
}

/**
 * 6-character code → { settings, seed, customItems } or null when the code is not valid.
 * customItems is true when the host used their own item list (it can't travel in the code).
 */
export function decodeRoom(text) {
  const code = normalizeCode(text);
  if (code.length !== CODE_LENGTH) return null;
  let value = 0;
  for (const ch of code) {
    const digit = ALPHABET.indexOf(ch);
    if (digit < 0) return null;
    value = value * 32 + digit;
  }
  const seed = value % SEED_MAX;
  let bits = Math.floor(value / SEED_MAX);
  const take = (n) => {
    const v = bits % n;
    bits = Math.floor(bits / n);
    return v;
  };
  const skill = take(4);
  const preset = take(8);
  const daub = take(2);
  const speed = take(4);
  const auto = take(2);
  const size = take(4);
  const mode = take(2);
  if (size > 2 || speed > 2 || skill > 2 || (preset >= PRESETS.length && preset !== CUSTOM_PRESET)) return null;
  const customItems = preset === CUSTOM_PRESET;
  const presetId = customItems ? PRESETS[0].id : PRESETS[preset].id;
  return {
    seed,
    customItems,
    settings: {
      mode: mode ? 'custom' : 'classic',
      size: SIZES[size],
      autoCall: Boolean(auto),
      speed: SPEEDS[speed],
      interactiveDaub: Boolean(daub),
      skill: SKILLS[skill],
      presetId,
    },
  };
}

/** Small, fast seeded random numbers (same seed → same sequence on every device). */
export function seededRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashText(text) {
  let h = 2166136261;
  for (const ch of String(text)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
