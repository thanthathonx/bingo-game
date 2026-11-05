// Synthesised music and sound effects (Web Audio), plus spoken calls.
// Browsers only allow sound after the first tap, so everything starts lazily.

import { load, save, clamp } from './storage.js';

const defaults = { music: 30, sfx: 50, muted: false, speak: true };
let settings = { ...defaults, ...load('audio', {}) };
let ctx = null;
let musicGain = null;
let sfxGain = null;
let musicTimer = null;
let step = 0;
const listeners = new Set();

export function getAudioSettings() {
  return settings;
}

export function onAudioChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setAudioSettings(patch) {
  settings = {
    ...settings,
    ...patch,
    music: clamp(patch.music ?? settings.music, 0, 100),
    sfx: clamp(patch.sfx ?? settings.sfx, 0, 100),
  };
  save('audio', settings);
  applyVolumes();
  listeners.forEach((fn) => fn(settings));
}

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  musicGain = ctx.createGain();
  sfxGain = ctx.createGain();
  musicGain.connect(ctx.destination);
  sfxGain.connect(ctx.destination);
  applyVolumes();
  return ctx;
}

function applyVolumes() {
  if (!ctx) return;
  const m = settings.muted ? 0 : (settings.music / 100) * 0.16;
  const s = settings.muted ? 0 : (settings.sfx / 100) * 0.5;
  musicGain.gain.setTargetAtTime(m, ctx.currentTime, 0.05);
  sfxGain.gain.setTargetAtTime(s, ctx.currentTime, 0.02);
}

/** Call from any user gesture: unlocks audio and starts the background music. */
export function unlockAudio() {
  const c = ensureContext();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  if (!musicTimer) startMusic();
}

function tone(freq, start, dur, { type = 'sine', gain = 0.6, dest = sfxGain, slide = 0 } = {}) {
  if (!ctx || !dest) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

const CHORDS = [
  [261.63, 329.63, 392.0],
  [220.0, 261.63, 329.63],
  [174.61, 220.0, 261.63],
  [196.0, 246.94, 293.66],
];

function startMusic() {
  const beat = 0.32;
  musicTimer = window.setInterval(() => {
    if (!ctx || settings.muted || settings.music === 0) return;
    const t = ctx.currentTime + 0.05;
    const chord = CHORDS[Math.floor(step / 8) % CHORDS.length];
    const note = chord[step % 3] * (step % 8 >= 4 ? 2 : 1);
    tone(note, t, beat * 1.4, { type: 'triangle', gain: 0.35, dest: musicGain });
    if (step % 8 === 0) tone(chord[0] / 2, t, beat * 7, { type: 'sine', gain: 0.5, dest: musicGain });
    step += 1;
  }, 320);
}

const SFX = {
  click: () => tone(660, ctx.currentTime, 0.08, { type: 'square', gain: 0.15 }),
  call: () => {
    const t = ctx.currentTime;
    tone(523.25, t, 0.16, { type: 'triangle' });
    tone(783.99, t + 0.1, 0.22, { type: 'triangle' });
  },
  daub: () => tone(420, ctx.currentTime, 0.12, { type: 'sine', gain: 0.7, slide: 0.6 }),
  error: () => tone(160, ctx.currentTime, 0.25, { type: 'sawtooth', gain: 0.25 }),
  near: () => tone(880, ctx.currentTime, 0.12, { type: 'triangle', gain: 0.35 }),
  bingo: () => {
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, t + i * 0.11, 0.35, { type: 'triangle' }));
  },
  lose: () => {
    const t = ctx.currentTime;
    [392, 349.23, 311.13].forEach((f, i) => tone(f, t + i * 0.16, 0.3, { type: 'triangle', gain: 0.4 }));
  },
};

export function playSfx(name) {
  if (!ensureContext() || settings.muted || settings.sfx === 0) return;
  const fn = SFX[name];
  if (fn) fn();
}

/** Read a call out loud (e.g. "B 12") using the browser's speech voice. */
export function speak(text, lang = 'en') {
  if (settings.muted || !settings.speak || settings.sfx === 0) return;
  const synth = window.speechSynthesis;
  if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') return;
  try {
    synth.cancel();
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.volume = settings.sfx / 100;
    u.rate = 1.05;
    synth.speak(u);
  } catch {
    // speech is optional; ignore failures
  }
}
