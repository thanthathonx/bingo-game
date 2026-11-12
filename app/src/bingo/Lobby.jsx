import { useState } from 'react';
import Mascot from '../shared/Mascot.jsx';
import { IconEye, IconPlus, IconMinus, IconCrown, IconTv, IconDoor, IconPlay, IconCopy } from '../shared/icons.jsx';
import { encodeRoom } from './roomCode.js';
import { useLang } from '../shared/i18n.js';
import { itemsNeeded, winTargets } from './engine.js';
import { settingsProblem, poolFor, nextStage } from './gameState.js';
import { PRESETS, presetText, MAX_BUDDIES } from './presets.js';
import InviteCard from '../online/InviteCard.jsx';

/**
 * @param {{ room: object, onChange: (patch: object) => void, onSettings: (patch: object) => void,
 *   onAddBuddy: () => void, onRemoveBuddy: (id: string) => void, onStart: () => void, onLeave: () => void }} props
 */
export default function Lobby({ room, onSettings, onAddBuddy, onRemoveBuddy, onStart, onLeave, online = null, peers = [], onlineStatus = 'idle' }) {
  const { t } = useLang();
  const [showCode, setShowCode] = useState(!room.streamer);
  const s = room.settings;
  const problem = settingsProblem(s);
  const hostWins = room.wins.you ?? 0;
  const isGuest = Boolean(online && !online.isHost);
  const code = room.online ? room.online.code : encodeRoom(s, room.seed);
  const friends = online ? peers.filter((p) => p.id !== online.myId) : [];
  const winsLabel = (n) => `${n} ${t(n === 1 ? 'win' : 'wins')}`;
  const winsOf = (id) => room.wins[id === online?.myId ? 'you' : id] ?? 0;
  const nobodyToPlay = room.bigScreen && room.buddies.length === 0 && friends.length === 0;
  const [copied, setCopied] = useState(false);

  if (room.connecting) {
    return (
      <div className="lobby">
        <div className="panel lobby-wait" role="status">
          <span className="phase-chip">{t('lobby')}</span>
          <h1 className="lobby-title">{code}</h1>
          <p className="hint">{t('connecting')}</p>
          <button type="button" className="ghost-btn" onClick={onLeave}><IconDoor size={18} /> {t('leave')}</button>
        </div>
      </div>
    );
  }
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setShowCode(true);
    }
  };

  return (
    <div className="lobby">
      <div className="lobby-head">
        <div>
          <span className="phase-chip">{t('lobby')}</span>
          <h1 className="lobby-title">Bingo<span> Friends</span></h1>
        </div>
        <div className="room-code-box">
          <div className="room-code" aria-live="polite">
            <span className="room-code-label">{t('roomCode')}</span>
            <span className="room-code-value">{showCode ? code : '••••••'}</span>
            <button type="button" className="mini-key" onClick={() => setShowCode((v) => !v)} aria-label={t('showHideCode')}>
              <IconEye size={16} />
            </button>
            <button type="button" className="mini-key" onClick={copyCode} aria-label={t('copyCode')}>
              <IconCopy size={16} />
            </button>
          </div>
          <p className="hint room-code-hint" role="status">{copied ? `✓ ${t('copied')}` : t(room.online ? 'shareCodeOnline' : 'shareCode')}</p>
        </div>
      </div>
      {room.joinedCode && (
        <p className="join-note">
          {t('joinedWith')} {t('pressTogether')}
          {room.friendCustomItems && s.mode === 'custom' && <> {t('friendItems')}</>}
        </p>
      )}
      {isGuest && room.inGame && <p className="join-note">{t('inProgress')}</p>}
      {online && !isGuest && (
        <InviteCard code={room.online.code} hidden={room.streamer && !showCode} big={room.bigScreen} count={Math.max(0, peers.length - 1)} />
      )}

      <div className="lobby-grid">
        <section className="panel" aria-labelledby="players-h">
          <h2 id="players-h" className="panel-title">
            {t('playersTitle')} <span className="count">{(online ? peers.length : 1) + room.buddies.length}</span>
          </h2>
          <ul className="player-list">
            {online ? peers.map((p) => (
              <li key={p.id} className={`player-row${p.isHost ? ' is-host' : ''}`}>
                <Mascot size={40} tint={p.id === online.myId ? '#ff9bc0' : undefined} prop="none" />
                <span className="player-name">{p.name} {p.id === online.myId && <em>({t('you')})</em>}</span>
                {p.isHost && (room.bigScreen || room.hostBigScreen) && <span className="tag"><IconTv size={14} /> TV</span>}
                {p.isHost && <span className="tag tag-gold"><IconCrown size={14} /> {t('host')}</span>}
                <span className="wins">{winsLabel(winsOf(p.id))}</span>
              </li>
            )) : (
              <li className="player-row is-host">
                <Mascot size={40} tint="#ff9bc0" prop="none" />
                <span className="player-name">{room.hostName} <em>({t('you')})</em></span>
                {room.bigScreen && <span className="tag"><IconTv size={14} /> TV</span>}
                <span className="tag tag-gold"><IconCrown size={14} /> {t('host')}</span>
                <span className="wins">{winsLabel(hostWins)}</span>
              </li>
            )}
            {room.buddies.map((b) => (
              <li key={b.id} className="player-row">
                <Mascot size={40} tint={b.color} prop="none" />
                <span className="player-name">{b.name}</span>
                <span className="wins">{winsLabel(room.wins[b.id] ?? 0)}</span>
                {!isGuest && (
                  <button type="button" className="mini-key" onClick={() => onRemoveBuddy(b.id)} aria-label={`Remove ${b.name}`}>
                    <IconMinus size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {!isGuest && (
            <button type="button" className="ghost-btn" onClick={onAddBuddy} disabled={room.buddies.length >= MAX_BUDDIES}>
              <IconPlus size={18} /> {t('addBuddy')}
            </button>
          )}
          <p className="hint">{online && !isGuest ? t('inviteHint') : t('buddiesHint')}</p>
        </section>

        <section className="panel" aria-labelledby="settings-h">
          <h2 id="settings-h" className="panel-title">{t('hostSettings')}</h2>
          {isGuest && <p className="hint">{t('guestSettings')}</p>}
          <fieldset className="settings-fieldset" disabled={isGuest}>
          <Setting label={t('mode')}>
            <Segmented value={s.mode} onChange={(mode) => onSettings({ mode })}
              options={[{ value: 'classic', label: t('modeClassic') }, { value: 'custom', label: t('modeCustom') }]} />
          </Setting>
          {s.mode === 'custom' && (
            <Setting label={`${t('items')} (${poolFor(s).length}/${itemsNeeded(s.size)}+)`}>
              <div className="preset-row">
                {PRESETS.map((p) => (
                  <button key={p.id} type="button" className={`chip${s.presetId === p.id ? ' is-on' : ''}`}
                    onClick={() => onSettings({ presetId: p.id, itemsText: presetText(p.id) })}>{p.label}</button>
                ))}
              </div>
              <textarea className="items-box" rows={6} value={s.itemsText} aria-label={t('items')}
                onChange={(e) => onSettings({ itemsText: e.target.value.slice(0, 4000), presetId: null })} />
              {problem && <p className="warn">{t('moreItems').replace('{n}', problem.need - problem.have)}</p>}
            </Setting>
          )}
          <Setting label={t('autoCall')}>
            <Toggle on={s.autoCall} onChange={(autoCall) => onSettings({ autoCall })} t={t} />
          </Setting>
          {s.autoCall && (
            <Setting label={t('callSpeed')}>
              <Segmented value={s.speed} onChange={(speed) => onSettings({ speed })}
                options={[{ value: 'slow', label: '7s' }, { value: 'normal', label: '5s' }, { value: 'fast', label: '3s' }]} />
            </Setting>
          )}
          <Setting label={t('interactiveDaub')}>
            <Toggle on={s.interactiveDaub} onChange={(interactiveDaub) => onSettings({ interactiveDaub })} t={t} />
          </Setting>
          <Setting label={t('buddySkill')}>
            <Segmented value={s.skill} onChange={(skill) => onSettings({ skill })}
              options={[{ value: 'relaxed', label: t('skillRelaxed') }, { value: 'normal', label: t('skillNormal') }, { value: 'speedy', label: t('skillSpeedy') }]} />
          </Setting>
          <Setting label={t('gamePlan')}>
            <ol className="round-plan">
              <li><PatternPreview pattern="line" /> <span>{t('roundOf').replace('{n}', 1)} · {t('pattern_line')}</span></li>
              <li><PatternPreview pattern="random" /> <span>{t('roundOf').replace('{n}', 2)} · {t('randomShape')}</span></li>
              <li><PatternPreview pattern="blackout" /> <span>{t('roundOf').replace('{n}', 3)} · {t('pattern_blackout')}</span></li>
            </ol>
            <p className="hint">{t('winnersRule')}</p>
          </Setting>
          </fieldset>
        </section>
      </div>

      <div className="lobby-actions">
        <button type="button" className="ghost-btn" onClick={onLeave}><IconDoor size={18} /> {t('leave')}</button>
        {isGuest ? (
          <p className="hint" role="status">{t('waitingHost')}</p>
        ) : (
          <button type="button" className="home-btn lobby-start" onClick={onStart} disabled={Boolean(problem) || nobodyToPlay}>
            <IconPlay size={22} /> {t('startRound').replace('{n}', nextStage(room.history))}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * A thumbnail of the squares a pattern needs ('line' shows the middle row as an example,
 * 'random' a question mark-ish shape for the round whose shape is drawn at random).
 */
function PatternPreview({ pattern, size = 5 }) {
  const middleRow = Array.from({ length: size }, (_, c) => Math.floor(size / 2) * size + c);
  const QUESTION = [1, 2, 3, 8, 12, 17, 22];
  let cells;
  if (pattern === 'line') cells = middleRow;
  else if (pattern === 'random') cells = QUESTION;
  else cells = winTargets(size, pattern)[0];
  const on = new Set(cells);
  return (
    <div className="pattern-preview" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${size}, 9px)` }}>
      {Array.from({ length: size * size }, (_, i) => <span key={i} className={on.has(i) ? 'is-on' : ''} />)}
    </div>
  );
}

function Setting({ label, children }) {
  return (
    <div className="setting">
      <div className="setting-label">{label}</div>
      <div className="setting-body">{children}</div>
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={value === o.value}
          className={value === o.value ? 'is-on' : ''} onClick={() => onChange(o.value)}>
          {o.label}{o.sub && <small>{o.sub}</small>}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onChange, t }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={`switch${on ? ' is-on' : ''}`} onClick={() => onChange(!on)}>
      <span className="switch-knob" />
      <span className="switch-text">{on ? t('on') : t('off')}</span>
    </button>
  );
}
