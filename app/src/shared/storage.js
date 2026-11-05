// Small, safe wrapper around localStorage (private mode or full storage must not crash the game).

const PREFIX = 'bingoFriends:';

export function load(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function clamp(n, lo, hi) {
  const v = Number(n);
  if (Number.isNaN(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}
