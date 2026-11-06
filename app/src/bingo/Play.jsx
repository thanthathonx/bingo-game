import Mascot from '../shared/Mascot.jsx';
import { IconPause, IconPlay, IconShuffle, IconDoor } from '../shared/icons.jsx';
import { useLang } from '../shared/i18n.js';
import Card, { callText, letterColor } from './Card.jsx';
import { squaresAway, maxNumber, range, sameValue, FREE } from './engine.js';
import { YOU } from './gameState.js';

/**
 * Card-building phase for event cards.
 */
export function BuildView({ game, dispatch, onLeave }) {
  const { t } = useLang();
  const me = game.players.find((p) => p.id === YOU);
  const used = me.cells.filter((c) => c !== null && c !== FREE);
  const full = !me.cells.includes(null);
  return (
    <div className="play play-build">
      <div className="play-top">
        <span className="phase-chip">BUILDING CARDS</span>
        <h1 className="play-title">{t('buildCard')}</h1>
        <p className="hint">Tap items to place them on your card. Tap a square to take it off again.</p>
      </div>
      <div className="build-grid">
        <section className="panel">
          <Card cells={me.cells} size={game.settings.size} isText building onCell={(index) => dispatch({ type: 'REMOVE_CELL', index })} />
          <div className="build-actions">
            <button type="button" className="ghost-btn" onClick={() => dispatch({ type: 'FILL_CARD' })}><IconShuffle size={18} /> {t('shuffle')}</button>
            <button type="button" className="ghost-btn" onClick={() => dispatch({ type: 'CLEAR_CARD' })}>{t('clear')}</button>
            <button type="button" className="home-btn small" disabled={!full} onClick={() => dispatch({ type: 'READY' })}>{t('ready')}</button>
          </div>
        </section>
        <section className="panel">
          <h2 className="panel-title">{t('items')}</h2>
          <div className="item-pool">
            {game.pool.map((item) => {
              const isUsed = used.some((u) => sameValue(u, item));
              return (
                <button key={item} type="button" className={`chip${isUsed ? ' is-used' : ''}`} disabled={isUsed || full}
                  onClick={() => dispatch({ type: 'PLACE_ITEM', item })}>{item}</button>
              );
            })}
          </div>
        </section>
      </div>
      <div className="lobby-actions"><button type="button" className="ghost-btn" onClick={onLeave}><IconDoor size={18} /> {t('backToLobby')}</button></div>
    </div>
  );
}

/**
 * Main playing screen: caller, your card (unless Big Screen), and the bingo wall.
 */
export function PlayView({ game, dispatch, bigScreen, now, onLeave, onClaim, isGuest = false, waitingFor = 0 }) {
  const { t } = useLang();
  const { settings } = game;
  const me = game.players.find((p) => p.id === YOU);
  const last = game.called[game.called.length - 1];
  const isText = settings.mode === 'custom';
  const locked = now < game.lockedUntil;
  const others = game.players.filter((p) => p.id !== YOU);
  const myAway = me ? squaresAway(me.marks, settings.size) : null;

  return (
    <div className={`play${bigScreen ? ' is-tv' : ''}`}>
      <section className="panel caller" aria-live="polite">
        <span className="phase-chip">CALLING</span>
        <div className="ball-wrap">
          {last === undefined ? (
            <div className="ball is-idle"><span>?</span></div>
          ) : (
            <div key={game.called.length} className={`ball${isText ? ' is-text' : ''}`} style={{ '--ball': letterColor(last, settings.size) }}>
              <span>{callText(last, settings.size)}</span>
            </div>
          )}
        </div>
        {waitingFor > 0 && <p className="hint" role="status">{t('waitingCards')} ({waitingFor})</p>}
        <div className="caller-meta">{t('called')}:{game.called.length}/{game.called.length + game.order.length}</div>
        <div className="recent">
          {game.called.slice(-6, -1).reverse().map((v) => (
            <span key={String(v)} className="recent-ball" style={{ '--ball': letterColor(v, settings.size) }}>{callText(v, settings.size)}</span>
          ))}
        </div>
        <div className="caller-actions">
          {isGuest ? (
            game.paused && <span className="hint">{t('hostPaused')}</span>
          ) : settings.autoCall ? (
            <button type="button" className="ghost-btn" onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}>
              {game.paused ? <><IconPlay size={18} /> Resume</> : <><IconPause size={18} /> Pause</>}
            </button>
          ) : (
            <button type="button" className="home-btn small" onClick={() => dispatch({ type: 'CALL' })} disabled={game.order.length === 0}>
              {t('callNext')}
            </button>
          )}
          <button type="button" className="ghost-btn" onClick={onLeave}><IconDoor size={18} /> {t('backToLobby')}</button>
        </div>
        {!isGuest && !settings.autoCall && isText && <ManualItems game={game} dispatch={dispatch} />}
        {bigScreen && <CalledBoard game={game} />}
      </section>

      {me && (
        <section className="panel my-card">
          <div className="my-card-head">
            <span className="player-name">{me.name}</span>
            {myAway === 1 && <span className="flag-near">{t('oneAway')}</span>}
          </div>
          <Card cells={me.cells} marks={me.marks} size={settings.size} isText={isText}
            onCell={(index) => dispatch({ type: 'DAUB', index, now: Date.now() })} />
          <button type="button" className={`bingo-btn${myAway === 0 ? ' is-ready' : ''}`} disabled={locked}
            onClick={onClaim ?? (() => dispatch({ type: 'CLAIM', id: YOU, now: Date.now() }))}>
            {locked ? `${Math.ceil((game.lockedUntil - now) / 1000)}…` : t('bingo')}
          </button>
          {game.claimPending && <p className="notice" role="status">{t('checkingBingo')}</p>}
          {game.notice && <p className="notice" role="status">{game.notice.kind === 'notCalled' ? t('notCalled') : t('falseBingo')}</p>}
          {!settings.interactiveDaub && <p className="hint">Auto-daub is on — just shout BINGO when a line is full.</p>}
        </section>
      )}

      <section className="panel wall" aria-label="Bingo wall">
        <h2 className="panel-title">{t('playersTitle')}</h2>
        <div className="wall-grid">
          {others.map((p) => {
            const away = squaresAway(p.marks, settings.size);
            const daubs = p.marks.filter((m, i) => m && p.cells[i] !== FREE).length;
            return (
              <div key={p.id} className="wall-card">
                <div className="wall-head">
                  <Mascot size={28} tint={p.color} prop="none" />
                  <span className="wall-name">{p.name}</span>
                  {away === 0 && <span className="flag-bingo">{t('bingo')}</span>}
                  {away === 1 && <span className="flag-near">{t('oneAway')}</span>}
                  {away > 1 && <span className="wall-daubs">{daubs}</span>}
                </div>
                <Card cells={p.cells} marks={p.marks} size={settings.size} mini />
              </div>
            );
          })}
          {others.length === 0 && <p className="hint">Playing solo — add buddies in the lobby for some competition.</p>}
        </div>
      </section>
    </div>
  );
}

function ManualItems({ game, dispatch }) {
  return (
    <div className="item-pool manual">
      {game.order.map((item) => (
        <button key={item} type="button" className="chip" onClick={() => dispatch({ type: 'CALL', value: item })}>{item}</button>
      ))}
    </div>
  );
}

function CalledBoard({ game }) {
  const { settings } = game;
  if (settings.mode === 'custom') {
    return (
      <ul className="called-list">
        {game.called.map((v) => <li key={String(v)}>{v}</li>)}
      </ul>
    );
  }
  const max = maxNumber(settings.size);
  return (
    <div className="called-board" style={{ '--cols': settings.size === 5 ? 15 : 10 }}>
      {range(1, max).map((n) => {
        const hit = game.called.includes(n);
        return <span key={n} className={hit ? 'is-hit' : ''} style={hit ? { '--ball': letterColor(n, settings.size) } : undefined}>{n}</span>;
      })}
    </div>
  );
}

/** Winner overlay. */
export function Results({ game, onAgain, onLobby }) {
  const { t } = useLang();
  const winner = game.players.find((p) => p.id === game.winner?.id);
  const youWon = winner?.id === YOU;
  return (
    <div className="results" role="dialog" aria-modal="true" aria-label="Round over">
      {youWon && <Confetti />}
      <div className="results-card">
        <span className="phase-chip">GAME OVER</span>
        {winner ? (
          <>
            <Mascot size={96} tint={winner.isBot ? winner.color : undefined} prop={youWon ? 'star' : 'card'} />
            <h2 className="results-title">{youWon ? t('youWin') : `${winner.name} — ${t('bingo')}`}</h2>
            <Card cells={winner.cells} marks={winner.marks} size={game.settings.size} winLine={game.winner.line} isText={game.settings.mode === 'custom'} />
          </>
        ) : (
          <h2 className="results-title">Nobody got a line this time!</h2>
        )}
        <div className="results-actions">
          <button type="button" className="ghost-btn" onClick={onLobby}>{t('backToLobby')}</button>
          {onAgain
            ? <button type="button" className="home-btn small" onClick={onAgain}>{t('playAgain')}</button>
            : <span className="hint">{t('waitingHost')}</span>}
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ['#fd79a8', '#a29bfe', '#00d9ff', '#55efc4', '#ffd166'];
  return (
    <div className="confetti" aria-hidden="true">
      {range(1, 40).map((i) => (
        <span key={i} style={{
          left: `${(i * 37) % 100}%`,
          background: colors[i % colors.length],
          animationDelay: `${(i % 10) * 0.12}s`,
          animationDuration: `${2.2 + (i % 5) * 0.3}s`,
        }} />
      ))}
    </div>
  );
}
