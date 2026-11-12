import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Header from './Header.jsx';
import Home from './Home.jsx';
import Lobby from './Lobby.jsx';
import { BuildView, PlayView, Results } from './Play.jsx';
import Modals from './Modals.jsx';
import Backdrop from './Backdrop.jsx';
import {
  reducer, newRound, withCard, SPEEDS, SKILLS, YOU, ROUNDS_PER_GAME, nextStage, patternForStage,
} from './gameState.js';
import { loadSession, saveSession, clearSession, hostRoomSnapshot } from '../online/session.js';
import { cellIndexOf, squaresAway, validateClaim, patternOf } from './engine.js';
import { randomSeed, decodeRoom } from './roomCode.js';
import { onlineEnabled } from '../online/client.js';
import { MSG, makeOnlineCode, makeClientId, wirePlayer, wireState, leaderboard } from '../online/protocol.js';
import { useOnlineRoom } from '../online/useOnlineRoom.js';
import { useOnlineGame, boardEntries } from '../online/useOnlineGame.js';
import { callText } from './Card.jsx';
import { BUDDY_NAMES, BUDDY_COLORS, MAX_BUDDIES, presetText } from './presets.js';
import { LangContext, translator, speechLang, useLang } from '../shared/i18n.js';
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

/** A new buddy with the first name not already in the room (each name has its own colour). */
function makeBuddy(existing) {
  const used = new Set(existing.map((b) => b.name));
  const free = BUDDY_NAMES.findIndex((n) => !used.has(n));
  const i = free < 0 ? existing.length : free;
  const id = `bot-${i}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
  return { id, name: BUDDY_NAMES[i % BUDDY_NAMES.length], color: BUDDY_COLORS[i % BUDDY_COLORS.length] };
}

/** This tab's player id. Kept for the tab's lifetime, so a guest who reloads and rejoins keeps their wins. */
function clientIdForTab() {
  const KEY = 'bingo-friends-client-id';
  try {
    const saved = window.sessionStorage.getItem(KEY);
    if (saved && /^p-[a-z0-9]{1,12}$/.test(saved)) return saved;
    const id = makeClientId();
    window.sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    return makeClientId(); // private mode / storage blocked: a fresh id per load is fine
  }
}

/** Online event cards: how long the host waits for friends still building their cards. */
const BUILD_WAIT_MS = 45000;

/** A guest's room while it waits for the host's lobby message (which fills in the rest). */
function guestRoom(code, name, settings) {
  return {
    online: { code, isHost: false },
    connecting: true,
    seed: randomSeed(),
    roundNo: 0,
    hostName: '',
    selfName: name,
    streamer: false,
    bigScreen: false,
    buddies: [],
    settings,
    wins: {},
    inGame: false,
  };
}

const startingBuddies = (n) => Array.from({ length: n }).reduce((list) => [...list, makeBuddy(list)], []);

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
  // r.roundNo is the round being started; the room then counts on to the next one.
  // r.resumeCard: a guest back after a reload gets their saved card instead of a new one.
  const startRound = useCallback((r) => {
    const { resumeCard, ...nextRoom } = r;
    clearTimers();
    const fresh = newRound(nextRoom);
    setInitialGame(resumeCard ? withCard(fresh, resumeCard) : fresh);
    setRoom({ ...nextRoom, roundNo: (nextRoom.roundNo ?? 0) + 1, inGame: true });
    setRound((n) => n + 1);
    setScreen('game');
  }, [clearTimers]);

  // ----- Online session: survive a reload (see online/session.js) -----
  const sessionRef = useRef({});
  const resumeRef = useRef(null);
  const persist = (patch) => {
    sessionRef.current = { ...sessionRef.current, ...patch };
    saveSession(sessionRef.current);
  };

  const [joinError, setJoinError] = useState('');
  const myId = useMemo(clientIdForTab, []);
  const leaveRoom = useCallback((reason) => {
    clearTimers();
    setRoom(null);
    setScreen('home');
    setJoinError(reason ?? '');
    sessionRef.current = {};
    resumeRef.current = null;
    clearSession();
  }, [clearTimers]);
  const online = useOnlineRoom({ room, setRoom, name, myId, startRound, leaveRoom, resumeRef });

  // Back after a reload: the host reopens its room (and round); a guest rejoins and, if its
  // round is still running, gets its card back when the host's lobby message arrives.
  useEffect(() => {
    const s = onlineEnabled ? loadSession() : null;
    if (!s) return;
    setName(s.name);
    if (s.role === 'host') {
      sessionRef.current = { role: 'host', code: s.code, name: s.name, room: s.room, game: s.game };
      const restored = { ...s.room, online: { code: s.code, isHost: true }, connecting: false };
      if (s.game && s.room.inGame) {
        setInitialGame({ winners: [], claimUntil: 0, aborted: false, ...s.game });
        setRound((n) => n + 1);
        setRoom(restored);
        setScreen('game');
      } else {
        setRoom({ ...restored, inGame: false });
        setScreen('lobby');
      }
      return;
    }
    sessionRef.current = { role: 'guest', code: s.code, name: s.name, ...(s.resume ?? {}) };
    resumeRef.current = s.resume;
    setRoom(guestRoom(s.code, s.name, { ...DEFAULT_SETTINGS }));
    setScreen('lobby');
  }, []);

  // Keep the session up to date as the room changes.
  useEffect(() => {
    if (!room?.online) return;
    const isHost = room.online.isHost;
    persist({
      role: isHost ? 'host' : 'guest',
      code: room.online.code,
      name: room.selfName ?? name,
      ...(isHost ? { room: hostRoomSnapshot(room) } : {}),
    });
  }, [room]);

  // ----- Address bar and Back button -----
  // In an online room the address shows the invite link, so copying it invites a friend.
  // (Not in streamer mode: the code must stay off screen.)
  const inRoom = Boolean(room) && screen !== 'home';
  useEffect(() => {
    const code = room?.online?.code;
    const url = code && inRoom && !room.streamer ? `/?room=${code}` : '/';
    if (window.location.pathname + window.location.search !== url) window.history.replaceState(window.history.state, '', url);
  }, [room?.online?.code, room?.streamer, inRoom]);

  // A swipe back / Back key inside a room would drop the player out of the round (or, for the
  // host, end it for everyone), so it does nothing there and says how to leave instead.
  const [backHint, setBackHint] = useState(false);
  useEffect(() => {
    if (!inRoom) return undefined;
    window.history.pushState({ bingoGuard: true }, '', window.location.href);
    const onPop = () => {
      window.history.pushState({ bingoGuard: true }, '', window.location.href);
      setBackHint(true);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [inRoom]);
  useEffect(() => {
    if (!backHint) return undefined;
    const id = window.setTimeout(() => setBackHint(false), 3500);
    return () => window.clearTimeout(id);
  }, [backHint]);

  /** Leave the current room (if any) and put the cursor in the "friend's code" box. */
  const goToJoinForm = () => {
    if (room?.online) online.leave();
    else leaveRoom();
    clearTimers();
    setScreen('home');
    window.setTimeout(() => document.getElementById('friend-code')?.focus(), 60);
  };

  /** The round on screen changed: the host keeps the whole game, a guest just its own card. */
  const persistGame = (game, roundUsed) => {
    if (!room?.online) return;
    if (room.online.isHost) {
      persist({ game });
      return;
    }
    const me = game.players.find((p) => p.id === YOU);
    if (me) persist({ round: roundUsed, seed: room.seed, card: { cells: me.cells, marks: me.marks, ready: me.ready !== false } });
  };

  // The host starts round 1, 2 or 3 of a game (after round 3 a new game starts at round 1).
  // The card is always 5×5 and the round decides the win pattern.
  const hostStartRound = (r) => {
    const history = (r.history ?? []).length >= ROUNDS_PER_GAME ? [] : (r.history ?? []);
    const stage = nextStage(history);
    const next = { ...r, history, stage, settings: { ...r.settings, size: 5, pattern: patternForStage(stage) } };
    if (next.online?.isHost) online.hostStart(next, next.roundNo ?? 0);
    startRound(next);
  };

  const openRoom = ({ name: n, streamer, bigScreen, code }) => {
    unlockAudio();
    setName(n);
    save('name', n);
    setJoinError('');
    const saved = load('room', null);
    // A game is three rounds on 5×5 cards (round 2 is a 5×5 shape), whatever was saved before.
    const base = { ...DEFAULT_SETTINGS, ...(saved?.settings ?? {}), size: 5, pattern: 'line' };
    if (onlineEnabled) {
      sessionRef.current = {};
      resumeRef.current = null;
      setRoom(code ? guestRoom(code, n, base) : {
        online: { code: makeOnlineCode(), isHost: true },
        connecting: false,
        seed: randomSeed(),
        roundNo: 0,
        hostName: n,
        selfName: n,
        streamer,
        bigScreen,
        buddies: [], // online, friends join for real; the host can still add buddies
        settings: base,
        wins: {},
        inGame: false,
      });
      setScreen('lobby');
      return;
    }
    const joined = code ? decodeRoom(code) : null;
    const settings = joined
      ? { ...base, ...joined.settings, itemsText: presetText(joined.settings.presetId) }
      : base;
    setRoom({
      seed: joined ? joined.seed : randomSeed(),
      roundNo: 0,
      joinedCode: joined ? code : null,
      friendCustomItems: Boolean(joined?.customItems),
      hostName: n,
      streamer,
      bigScreen,
      buddies: startingBuddies(3),
      settings,
      wins: {},
    });
    setScreen('lobby');
  };

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
        onCreate={openRoom}
        onStart={hostStartRound}
        setScreen={setScreen}
        lang={lang}
        joinError={joinError}
        online={online.ctx && room ? { ...online.ctx, round: (room.roundNo ?? 0) - 1 } : null}
        peers={online.players}
        onlineStatus={online.status}
        onLeaveRoom={online.leave}
        hostMissing={online.hostMissing}
        reconnecting={online.reconnecting}
        backHint={backHint}
        onPersistGame={persistGame}
        onAction={(action) => {
          if (action !== 'join') {
            setModal(action);
            return;
          }
          // Joining another room means leaving this one: ask first.
          if (inRoom) {
            setModal('confirmLeave');
            return;
          }
          goToJoinForm();
        }}
      />
      <Modals open={modal} onClose={() => setModal(null)} prefs={prefs}
        isHost={Boolean(room?.online?.isHost)}
        onConfirmLeave={() => { setModal(null); goToJoinForm(); }}
        onPrefs={(p) => { const next = { ...prefs, ...p }; setPrefs(next); save('prefs', next); }}
        name={name} onName={(n) => {
          setName(n);
          save('name', n);
          if (room) setRoom({ ...room, selfName: n, hostName: room.online && !room.online.isHost ? room.hostName : n });
        }} />
    </LangContext.Provider>
  );
}

/** Everything below the header that depends on the current round. Re-mounted per round via key. */
function GameScreens({
  initial, screen, room, setRoom, name, prefs, now, setNow, later, clearTimers, claimed, onCreate, onStart, setScreen, lang,
  onAction, joinError, online, peers, onlineStatus, onLeaveRoom, hostMissing, reconnecting, onPersistGame, backHint,
}) {
  const { t } = useLang();
  const [game, dispatch] = useReducer(reducer, initial);
  const lastCallCount = useRef(0);
  const isGuest = Boolean(online && !online.isHost);
  useOnlineGame({ online, active: screen === 'game', game, dispatch });

  // A new name from the menu shows on your card (and, online, the leaderboard) straight away.
  useEffect(() => {
    if (game && name) dispatch({ type: 'RENAME', name });
  }, [name]);

  // Remember the round (host: whole game, guest: own card) so a reload can pick it up again.
  useEffect(() => {
    if (online && game && screen === 'game') onPersistGame(game, online.round);
  }, [game, screen]);

  const settings = game?.settings;
  const playing = screen === 'game' && game?.phase === 'playing';

  // Online event cards: friends still building their card. The host waits for them before the
  // first call (up to BUILD_WAIT_MS after the host is ready), so nobody misses the start.
  // Set during render (not in an effect) so the caller below already sees it on the first pass.
  const playingSince = useRef(0);
  if (playing && !playingSince.current) playingSince.current = Date.now();
  // Guests report "card ready" to the host's roster (not React state), so while waiting the host
  // re-checks once a second.
  const stillBuilding = online && !isGuest && game
    ? [...online.rosterRef.current.values()].filter((g) => g.progress?.round === online.round && !g.progress.ready).length
    : 0;
  const waitForBuilders = stillBuilding > 0 && game?.called.length === 0;
  const waitLeft = waitForBuilders ? Math.max(0, playingSince.current + BUILD_WAIT_MS - now) : 0;
  useEffect(() => {
    if (!playing || isGuest || !online || game.called.length > 0 || (stillBuilding === 0 && playingSince.current && now - playingSince.current > 5000)) return undefined;
    const id = window.setTimeout(() => setNow(Date.now()), 1000);
    return () => window.clearTimeout(id);
  }, [playing, now, game?.called.length]);

  // Automatic caller. Online, only the host calls.
  useEffect(() => {
    if (!playing || !settings.autoCall || game.paused || isGuest) return undefined;
    const delay = Math.max(waitForBuilders ? waitLeft : 0, game.called.length === 0 ? FIRST_CALL_MS : SPEEDS[settings.speed]);
    const id = window.setTimeout(() => dispatch({ type: 'CALL' }), delay);
    return () => window.clearTimeout(id);
  }, [playing, settings?.autoCall, settings?.speed, game?.paused, game?.called.length, waitForBuilders]);

  // Manual mode in number bingo: first call happens straight away for a friendlier start.
  useEffect(() => {
    if (playing && !isGuest && !settings.autoCall && game.called.length === 0 && settings.mode === 'classic') {
      dispatch({ type: 'CALL' });
    }
  }, [playing, settings?.autoCall, settings?.mode, game?.called.length]);

  // Buddies this device runs (online guests only watch the host's buddies).
  const ownBot = (p) => p.isBot && !p.isRemote;

  // React to each new call: sound, voice, buddies daubing.
  useEffect(() => {
    if (!game || game.called.length === lastCallCount.current) return;
    lastCallCount.current = game.called.length;
    const value = game.called[game.called.length - 1];
    playSfx('call');
    speak(callText(value, settings.size), speechLang(lang));
    const skill = SKILLS[settings.skill] ?? SKILLS.normal;
    game.players.filter(ownBot).forEach((bot) => {
      const index = cellIndexOf(bot.cells, value);
      if (index < 0 || Math.random() < skill.miss) return;
      later(() => dispatch({ type: 'BOT_MARK', id: bot.id, index }), between(skill.daub));
    });
  }, [game?.called.length]);

  // Buddies shout BINGO a moment after completing a line — but not while the game is paused:
  // pausing forgets the pending shouts (the reducer ignores any that still fire) and resuming
  // schedules them again.
  useEffect(() => {
    if (!playing) return;
    if (game.paused) {
      claimed.current = new Set();
      return;
    }
    const skill = SKILLS[settings.skill] ?? SKILLS.normal;
    game.players.forEach((p) => {
      if (!ownBot(p) || claimed.current.has(p.id)) return;
      if (squaresAway(p.marks, settings.size, patternOf(settings)) === 0) {
        claimed.current.add(p.id);
        later(() => dispatch({ type: 'CLAIM', id: p.id, now: Date.now() }), between(skill.claim));
      }
    });
  }, [game?.players, playing, game?.paused]);

  // Near-win chime for you.
  const myAway = game?.players.find((p) => p.id === YOU) ? squaresAway(game.players.find((p) => p.id === YOU).marks, settings.size, patternOf(settings)) : null;
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

  // Round finished: sound, scoreboard and this round's line in the game history.
  useEffect(() => {
    if (game?.phase !== 'finished') return;
    clearTimers();
    const ids = (game.winners ?? []).map((w) => w.id);
    playSfx(ids.includes(YOU) ? 'bingo' : 'lose');
    // Online, the host keeps the score and the history and shares them with the room.
    if (isGuest || game.aborted) return;
    setRoom((r) => {
      const wins = { ...r.wins };
      ids.forEach((id) => { wins[id] = (wins[id] ?? 0) + 1; });
      const entry = {
        stage: r.stage ?? 1,
        pattern: patternOf(game.settings),
        winners: ids.map((id) => ({ id, name: game.players.find((p) => p.id === id)?.name ?? '?' })),
      };
      return { ...r, wins, history: [...(r.history ?? []).filter((h) => h.stage !== entry.stage), entry] };
    });
  }, [game?.phase]);

  // After the first good BINGO, others have CLAIM_WINDOW_MS to claim too; then the round ends.
  useEffect(() => {
    if (!game?.claimUntil || game.phase !== 'playing' || isGuest) return undefined;
    const id = window.setTimeout(() => dispatch({ type: 'CLOSE_WINDOW' }), Math.max(0, game.claimUntil - Date.now()));
    return () => window.clearTimeout(id);
  }, [game?.claimUntil, game?.phase]);
  const claimWindow = isGuest
    ? (online?.board?.round === online?.round ? online.board?.claim : null)
    : (game?.phase === 'playing' && game.claimUntil ? { until: game.claimUntil, count: game.winners.length } : null);
  useEffect(() => {
    if (!claimWindow || game?.phase !== 'playing') return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [claimWindow?.until, game?.phase]);

  // Host: guests' reports land in the roster (not React state), so redraw the board every 2 s
  // even when nothing else changes (e.g. while paused).
  const hostInGame = Boolean(online && !isGuest && screen === 'game' && game && game.phase !== 'finished');
  useEffect(() => {
    if (!hostInGame) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 2000);
    return () => window.clearInterval(id);
  }, [hostInGame]);

  // Online, the wall is a leaderboard (top 10) instead of every card: guests get it from the
  // host, the host builds it from its own players and the guests' reports.
  let board = null;
  if (online && game && isGuest) {
    board = online.board?.round === online.round ? online.board : { entries: [], count: 0 };
  } else if (online && game) {
    const { entries, count } = boardEntries(game, online.round, online.rosterRef.current, online.myId);
    board = { entries: leaderboard(entries).map((e) => ({ ...e, id: e.id === online.myId ? YOU : e.id })), count };
  }

  // BINGO! Online guests ask the host to confirm a good line instead of deciding it themselves.
  const claim = () => {
    const at = Date.now();
    const me = game.players.find((p) => p.id === YOU);
    const good = me && validateClaim(me.cells, me.marks, settings.size, game.called, patternOf(settings));
    if (isGuest && good && at >= game.lockedUntil) {
      online.toHost(MSG.CLAIM, { round: online.round, player: wirePlayer(me, online.myId) });
      dispatch({ type: 'CLAIM', id: YOU, now: at, deferWin: true });
      return;
    }
    dispatch({ type: 'CLAIM', id: YOU, now: at });
  };

  const patchSettings = (patch) => {
    setRoom((r) => {
      const next = { ...r, settings: { ...r.settings, ...patch } };
      save('room', { settings: next.settings });
      return next;
    });
  };

  const toLobby = () => {
    clearTimers();
    // Host leaving a round that is still going: end it for everyone, with no winner.
    if (online?.isHost && game && game.phase !== 'finished') {
      dispatch({ type: 'FINISH', winners: [], players: [], aborted: true });
      online.broadcast(MSG.STATE, wireState({
        round: online.round, called: game.called, paused: false, board: [], count: 0, finish: { winners: [], aborted: true },
      }));
    }
    if (!isGuest) setRoom((r) => (r ? { ...r, inGame: false } : r));
    setScreen('lobby');
  };

  return (
    <div className={`app-root${prefs.reduceMotion ? ' reduce-motion' : ''}`}>
      <Backdrop />
      <div className={`home-page screen-${screen}`}>
        <Header onAction={onAction} name={name} />
        {(hostMissing || reconnecting) && (
          <div className="net-banner" role="status">{t(hostMissing ? 'hostReconnecting' : 'reconnecting')}</div>
        )}
        {backHint && !hostMissing && !reconnecting && <div className="net-banner" role="status">{t('backHint')}</div>}
        <main className="stage-main">
          {screen === 'home' && <Home initialName={name} onCreate={onCreate} error={joinError} />}
          {screen === 'lobby' && room && (
            <Lobby room={room} onSettings={patchSettings}
              online={online} peers={peers} onlineStatus={onlineStatus}
              onAddBuddy={() => setRoom((r) => (r.buddies.length >= MAX_BUDDIES ? r : { ...r, buddies: [...r.buddies, makeBuddy(r.buddies)] }))}
              onRemoveBuddy={(id) => setRoom((r) => ({ ...r, buddies: r.buddies.filter((b) => b.id !== id) }))}
              onStart={() => onStart(room)}
              onLeave={online ? onLeaveRoom : () => setScreen('home')} />
          )}
          {screen === 'game' && game?.phase === 'build' && <BuildView game={game} dispatch={dispatch} onLeave={toLobby} />}
          {screen === 'game' && game && game.phase !== 'build' && (
            <PlayView game={game} dispatch={dispatch} bigScreen={room.bigScreen} now={now} onLeave={toLobby}
              onClaim={claim} isGuest={isGuest} waitingFor={waitForBuilders ? stillBuilding : 0} board={board}
              stage={room.stage ?? 1} claimWindow={claimWindow} />
          )}
          {screen === 'game' && game?.phase === 'finished' && (
            <Results game={game} stage={room.stage ?? 1} history={room.history ?? []}
              onNext={isGuest ? null : () => onStart(room)} onLobby={toLobby} />
          )}
        </main>
      </div>
    </div>
  );
}
