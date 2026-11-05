import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Header from './Header.jsx';
import Home from './Home.jsx';
import Lobby from './Lobby.jsx';
import { BuildView, PlayView, Results } from './Play.jsx';
import Modals from './Modals.jsx';
import Backdrop from './Backdrop.jsx';
import LegalFooter from './LegalFooter.jsx';
import { reducer, newRound, SPEEDS, SKILLS, YOU } from './gameState.js';
import { cellIndexOf, squaresAway, makeRoomCode } from './engine.js';
import { callText } from './Card.jsx';
import { BUDDY_NAMES, BUDDY_COLORS, MAX_BUDDIES, presetText } from './presets.js';
import { LangContext, translator, speechLang } from '../shared/i18n.js';
import { unlockAudio, playSfx, speak } from '../shared/audio.js';
import { load, save } from '../shared/storage.js';

const FIRST_CALL_MS = 1600;

const DEFAULT_SETTINGS = {
  mode: 'classic',
  size: 5,
  autoCall: true,
  speed: 'normal',
  interactiveDaub: true,
  skill: 'normal',
  presetId: 'party',
  itemsText: presetText('party'),
};

const between = ([lo, hi]) => lo + Math.random() * (hi - lo);

function makeBuddy(index) {
  return { id: `bot-${index}-${Date.now().toString(36)}`, name: BUDDY_NAMES[index % BUDDY_NAMES.length], color: BUDDY_COLORS[index % BUDDY_COLORS.length] };
}

export default function BingoApp() {
  const [lang, setLangState] = useState(() => load('lang', 'en'));
  const [name, setName] = useState(() => load('name', ''));
  const [prefs, setPrefs] = useState(() => ({ reduceMotion: false, ...load('prefs', {}) }));
  const [screen, setScreen] = useState('home');
  const [room, setRoom] = useState(null);
  const [modal, setModal] = useState(null);
  const [initialGame, setInitialGame] = useState(null);
  const [round, setRound] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const timers = useRef([]);
  const claimed = useRef(new Set());

  const langValue = useMemo(() => ({
    lang,
    t: translator(lang),
    setLang: (code) => { setLangState(code); save('lang', code); },
  }), [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Audio may only start after a user gesture.
  useEffect(() => {
    const unlock = () => unlockAudio();
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    claimed.current = new Set();
  }, []);
  const later = (fn, ms) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => clearTimers, [clearTimers]);

  // A new round re-mounts GameScreens (via key) with a fresh reducer state.
  const startRound = useCallback((r) => {
    clearTimers();
    setInitialGame(newRound(r));
    setRound((n) => n + 1);
    setScreen('game');
  }, [clearTimers]);

  return (
    <LangContext.Provider value={langValue}>
      <GameScreens
        key={round}
        initial={initialGame}
        screen={screen}
        room={room}
        setRoom={setRoom}
        name={name}
        prefs={prefs}
        now={now}
        setNow={setNow}
        timers={timers}
        claimed={claimed}
        later={later}
        clearTimers={clearTimers}
        onCreate={({ name: n, streamer, bigScreen }) => {
          unlockAudio();
          setName(n);
          save('name', n);
          const saved = load('room', null);
          const buddies = [0, 1, 2].map(makeBuddy);
          setRoom({
            code: makeRoomCode(),
            hostName: n,
            streamer,
            bigScreen,
            buddies,
            settings: { ...DEFAULT_SETTINGS, ...(saved?.settings ?? {}) },
            wins: {},
          });
          setScreen('lobby');
        }}
        onStart={(r) => startRound(r)}
        setScreen={setScreen}
        lang={lang}
        onAction={setModal}
      />
      <Modals open={modal} onClose={() => setModal(null)} prefs={prefs}
        onPrefs={(p) => { const next = { ...prefs, ...p }; setPrefs(next); save('prefs', next); }}
        name={name} onName={(n) => { setName(n); save('name', n); if (room) setRoom({ ...room, hostName: n }); }} />
    </LangContext.Provider>
  );
}

/** Everything below the header that depends on the current round. Re-mounted per round via key. */
function GameScreens({ initial, screen, room, setRoom, name, prefs, now, setNow, later, clearTimers, claimed, onCreate, onStart, setScreen, lang, onAction }) {
  const [game, dispatch] = useReducer(reducer, initial);
  const lastCallCount = useRef(0);

  const settings = game?.settings;
  const playing = screen === 'game' && game?.phase === 'playing';

  // Automatic caller.
  useEffect(() => {
    if (!playing || !settings.autoCall || game.paused) return undefined;
    const delay = game.called.length === 0 ? FIRST_CALL_MS : SPEEDS[settings.speed];
    const id = window.setTimeout(() => dispatch({ type: 'CALL' }), delay);
    return () => window.clearTimeout(id);
  }, [playing, settings?.autoCall, settings?.speed, game?.paused, game?.called.length]);

  // Manual mode in number bingo: first call happens straight away for a friendlier start.
  useEffect(() => {
    if (playing && !settings.autoCall && game.called.length === 0 && settings.mode === 'classic') {
      dispatch({ type: 'CALL' });
    }
  }, [playing, settings?.autoCall, settings?.mode, game?.called.length]);

  // React to each new call: sound, voice, buddies daubing.
  useEffect(() => {
    if (!game || game.called.length === lastCallCount.current) return;
    lastCallCount.current = game.called.length;
    const value = game.called[game.called.length - 1];
    playSfx('call');
    speak(callText(value, settings.size), speechLang(lang));
    const skill = SKILLS[settings.skill] ?? SKILLS.normal;
    game.players.filter((p) => p.isBot).forEach((bot) => {
      const index = cellIndexOf(bot.cells, value);
      if (index < 0 || Math.random() < skill.miss) return;
      later(() => dispatch({ type: 'BOT_MARK', id: bot.id, index }), between(skill.daub));
    });
  }, [game?.called.length]);

  // Buddies shout BINGO a moment after completing a line.
  useEffect(() => {
    if (!playing) return;
    const skill = SKILLS[settings.skill] ?? SKILLS.normal;
    game.players.forEach((p) => {
      if (!p.isBot || claimed.current.has(p.id)) return;
      if (squaresAway(p.marks, settings.size) === 0) {
        claimed.current.add(p.id);
        later(() => dispatch({ type: 'CLAIM', id: p.id, now: Date.now() }), between(skill.claim));
      }
    });
  }, [game?.players, playing]);

  // Near-win chime for you.
  const myAway = game?.players.find((p) => p.id === YOU) ? squaresAway(game.players.find((p) => p.id === YOU).marks, settings.size) : null;
  useEffect(() => {
    if (playing && myAway === 1) playSfx('near');
  }, [myAway, playing]);

  // Notices and the false-bingo countdown.
  useEffect(() => {
    if (!game?.notice) return undefined;
    playSfx('error');
    const id = window.setTimeout(() => dispatch({ type: 'CLEAR_NOTICE' }), 2200);
    return () => window.clearTimeout(id);
  }, [game?.notice]);
  useEffect(() => {
    if (!game || Date.now() >= game.lockedUntil) return undefined;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [game?.lockedUntil]);

  // Round finished: sound + scoreboard.
  useEffect(() => {
    if (game?.phase !== 'finished') return;
    clearTimers();
    const winnerId = game.winner?.id;
    playSfx(winnerId === YOU ? 'bingo' : 'lose');
    if (winnerId) setRoom((r) => ({ ...r, wins: { ...r.wins, [winnerId]: (r.wins[winnerId] ?? 0) + 1 } }));
  }, [game?.phase]);

  const patchSettings = (patch) => {
    setRoom((r) => {
      const next = { ...r, settings: { ...r.settings, ...patch } };
      save('room', { settings: next.settings });
      return next;
    });
  };

  const toLobby = () => {
    clearTimers();
    setScreen('lobby');
  };

  return (
    <div className={`app-root${prefs.reduceMotion ? ' reduce-motion' : ''}`}>
      <Backdrop />
      <div className={`home-page screen-${screen}`}>
        <Header onAction={onAction} />
        <main className="stage-main">
          {screen === 'home' && <Home initialName={name} onCreate={onCreate} />}
          {screen === 'lobby' && room && (
            <Lobby room={room} onSettings={patchSettings}
              onAddBuddy={() => setRoom((r) => (r.buddies.length >= MAX_BUDDIES ? r : { ...r, buddies: [...r.buddies, makeBuddy(r.buddies.length)] }))}
              onRemoveBuddy={(id) => setRoom((r) => ({ ...r, buddies: r.buddies.filter((b) => b.id !== id) }))}
              onStart={() => onStart(room)}
              onLeave={() => setScreen('home')} />
          )}
          {screen === 'game' && game?.phase === 'build' && <BuildView game={game} dispatch={dispatch} onLeave={toLobby} />}
          {screen === 'game' && game && game.phase !== 'build' && (
            <PlayView game={game} dispatch={dispatch} bigScreen={room.bigScreen} now={now} onLeave={toLobby} />
          )}
          {screen === 'game' && game?.phase === 'finished' && (
            <Results game={game} onAgain={() => onStart(room)} onLobby={toLobby} />
          )}
        </main>
        <LegalFooter />
      </div>
    </div>
  );
}
