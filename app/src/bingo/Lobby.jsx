import { useState } from 'react';
import Mascot from '../shared/Mascot.jsx';
import { IconEye, IconPlus, IconMinus, IconCrown, IconTv, IconDoor, IconPlay } from '../shared/icons.jsx';
import { useLang } from '../shared/i18n.js';
import { itemsNeeded } from './engine.js';
import { settingsProblem, poolFor } from './gameState.js';
import { PRESETS, presetText, MAX_BUDDIES } from './presets.js';

/**
 * @param {{ room: object, onChange: (patch: object) => void, onSettings: (patch: object) => void,
 *   onAddBuddy: () => void, onRemoveBuddy: (id: string) => void, onStart: () => void, onLeave: () => void }} props
 */
export default function Lobby({ room, onSettings, onAddBuddy, onRemoveBuddy, onStart, onLeave }) {
  const { t } = useLang();
  const [showCode, setShowCode] = useState(!room.streamer);
  const s = room.settings;
  const problem = settingsProblem(s);
  const hostWins = room.wins.you ?? 0;

  return (
    <div className="lobby">
      <div className="lobby-head">
        <div>
          <span className="phase-chip">{t('lobby')}</span>
          <h1 className="lobby-title">Bingo<span> Friends</span></h1>
        </div>
        <div className="room-code" aria-live="polite">
          <span className="room-code-label">{t('roomCode')}</span>
          <span className="room-code-value">{showCode ? room.code : '••••••'}</span>
          <button type="button" className="mini-key" onClick={() => setShowCode((v) => !v)} aria-label="Show or hide room code">
            <IconEye size={16} />
          </button>
        </div>
      </div>

      <div className="lobby-grid">
        <section className="panel" aria-labelledby="players-h">
          <h2 id="players-h" className="panel-title">{t('playersTitle')} <span className="count">{room.buddies.length + 1}</span></h2>
          <ul className="player-list">
            <li className="player-row is-host">
              <Mascot size={40} tint="#ff9bc0" prop="none" />
              <span className="player-name">{room.hostName} <em>({t('you')})</em></span>
              {room.bigScreen && <span className="tag"><IconTv size={14} /> TV</span>}
              <span className="tag tag-gold"><IconCrown size={14} /> {t('host')}</span>
              <span className="wins">{hostWins} {t('wins')}</span>
            </li>
            {room.buddies.map((b) => (
              <li key={b.id} className="player-row">
                <Mascot size={40} tint={b.color} prop="none" />
                <span className="player-name">{b.name}</span>
                <span className="wins">{room.wins[b.id] ?? 0} {t('wins')}</span>
                <button type="button" className="mini-key" onClick={() => onRemoveBuddy(b.id)} aria-label={`Remove ${b.name}`}>
                  <IconMinus size={16} />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="ghost-btn" onClick={onAddBuddy} disabled={room.buddies.length >= MAX_BUDDIES}>
            <IconPlus size={18} /> {t('addBuddy')}
          </button>
          <p className="hint">Buddies are computer players that daub and shout BINGO on their own.</p>
        </section>

        <section className="panel" aria-labelledby="settings-h">
          <h2 id="settings-h" className="panel-title">{t('hostSettings')}</h2>
          <Setting label={t('mode')}>
            <Segmented value={s.mode} onChange={(mode) => onSettings({ mode })}
              options={[{ value: 'classic', label: t('modeClassic') }, { value: 'custom', label: t('modeCustom') }]} />
          </Setting>
          <Setting label={t('cardSize')}>
            <Segmented value={s.size} onChange={(size) => onSettings({ size })}
              options={[3, 4, 5].map((n) => ({ value: n, label: `${n}×${n}`, sub: n === 5 ? t('full') : t('quick') }))} />
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
              {problem && <p className="warn">Add at least {problem.need - problem.have} more item(s) — one per line.</p>}
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
              options={[{ value: 'relaxed', label: 'Relaxed' }, { value: 'normal', label: 'Normal' }, { value: 'speedy', label: 'Speedy' }]} />
          </Setting>
          <Setting label={t('winPattern')}>
            <span className="setting-static">{t('anyLine')}</span>
          </Setting>
        </section>
      </div>

      <div className="lobby-actions">
        <button type="button" className="ghost-btn" onClick={onLeave}><IconDoor size={18} /> {t('leave')}</button>
        <button type="button" className="home-btn lobby-start" onClick={onStart} disabled={Boolean(problem) || room.buddies.length === 0 && room.bigScreen}>
          <IconPlay size={22} /> {t('startGame')}
        </button>
      </div>
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
