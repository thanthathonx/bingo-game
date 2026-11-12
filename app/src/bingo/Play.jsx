import { useState } from 'react';
import Mascot from '../shared/Mascot.jsx';
import { IconPause, IconPlay, IconShuffle, IconDoor } from '../shared/icons.jsx';
import { useLang } from '../shared/i18n.js';
import Card, { callText, letterColor } from './Card.jsx';
import { squaresAway, maxNumber, range, sameValue, FREE, patternOf, winTargets } from './engine.js';
import { YOU, ROUNDS_PER_GAME, CLAIM_WINDOW_MS } from './gameState.js';

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
        <span className="phase-chip">{t('buildingChip')}</span>
        <h1 className="play-title">{t('buildCard')}</h1>
        <p className="hint">{t('buildHint')}</p>
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
// Seconds left in the claim window. Read the clock here: the screen's 'now' can be a little stale
// on the first frame, which once showed a guest '99s'.
function claimSecondsLeft(until) {
  const left = Math.ceil((until - Date.now()) / 1000);
  return Math.min(CLAIM_WINDOW_MS / 1000, Math.max(0, left));
}

export function PlayView({
  game, dispatch, bigScreen, now, onLeave, onClaim, isGuest = false, waitingFor = 0, board = null, stage = 1, claimWindow = null,
}) {
  const { t } = useLang();
  const { settings } = game;
  const me = game.players.find((p) => p.id === YOU);
  const last = game.called[game.called.length - 1];
  const isText = settings.mode === 'custom';
  const locked = now < game.lockedUntil;
  const others = game.players.filter((p) => p.id !== YOU);
  const myAway = me ? squaresAway(me.marks, settings.size, patternOf(settings)) : null;

  return (
    <div className={`play${bigScreen ? ' is-tv' : ''}`}>
      <section className="panel caller" aria-live="polite">
        <span className="phase-chip">{roundLabel(t, stage, patternOf(settings))}</span>
        {claimWindow && (
          <p className="claim-banner" role="status">
            {t('claimWindow')
              .replace('{n}', claimWindow.count)
              .replace('{s}', claimSecondsLeft(claimWindow.until))}
          </p>
        )}
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
              {game.paused ? <><IconPlay size={18} /> {t('resume')}</> : <><IconPause size={18} /> {t('pause')}</>}
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
            {patternOf(settings) !== 'line' && <span className="tag pattern-tag">{t('patternGoal')}: {t(`pattern_${patternOf(settings)}`)}</span>}
            {myAway === 1 && <span className="flag-near">{t('oneAway')}</span>}
          </div>
          <Card cells={me.cells} marks={me.marks} size={settings.size} isText={isText}
            target={['line', 'blackout'].includes(patternOf(settings)) ? [] : winTargets(settings.size, patternOf(settings))[0]}
            onCell={(index) => dispatch({ type: 'DAUB', index, now: Date.now() })} />
          <button type="button" className={`bingo-btn${myAway === 0 ? ' is-ready' : ''}`} disabled={locked}
            onClick={onClaim ?? (() => dispatch({ type: 'CLAIM', id: YOU, now: Date.now() }))}>
            {locked ? `${Math.ceil((game.lockedUntil - now) / 1000)}…` : t('bingo')}
          </button>
          {game.claimPending && <p className="notice" role="status">{t('checkingBingo')}</p>}
          {game.notice && <p className="notice" role="status">{game.notice.kind === 'notCalled' ? t('notCalled') : t('falseBingo')}</p>}
          {!settings.interactiveDaub && <p className="hint">{t('autoDaubOn')}</p>}
        </section>
      )}

      {board ? <Leaderboard board={board} /> : (
      <section className="panel wall" aria-label={t('bingoWall')}>
        <h2 className="panel-title">{t('playersTitle')}</h2>
        <div className="wall-grid">
          {others.map((p) => {
            const away = squaresAway(p.marks, settings.size, patternOf(settings));
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
          {others.length === 0 && <p className="hint">{t('soloHint')}</p>}
        </div>
      </section>
      )}
    </div>
  );
}

/** Online rooms: the players closest to BINGO (the host shares the top 10). */
function Leaderboard({ board }) {
  const { t } = useLang();
  return (
    <section className="panel wall" aria-label={t('leaderboard')}>
      <h2 className="panel-title">{t('leaderboard')} <span className="count">{board.count}</span></h2>
      {board.entries.length === 0 && <p className="hint">{t('connecting')}</p>}
      <ol className="board-list">
        {board.entries.map((e, i) => (
          <li key={e.id} className={`board-row${e.id === YOU ? ' is-me' : ''}`}>
            <span className="board-rank">{i + 1}</span>
            <span className="board-name">{e.name}{e.id === YOU && <em> ({t('you')})</em>}</span>
            {e.away === 0 && <span className="flag-bingo">{t('bingo')}</span>}
            {e.away === 1 && <span className="flag-near">{t('oneAway')}</span>}
            {e.away > 1 && <span className="wall-daubs">{e.daubs} ✓</span>}
          </li>
        ))}
      </ol>
    </section>
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

const MEDALS = ['🥇', '🥈', '🥉'];

/** "Round 2/3 · Heart" */
function roundLabel(t, stage, pattern) {
  return `${t('roundOf').replace('{n}', stage)} · ${t(`pattern_${pattern}`)}`;
}

/** End of a round: up to three winners in BINGO order; after round 3, the whole game. */
export function Results({ game, stage = 1, history = [], onNext, onLobby }) {
  const { t } = useLang();
  const [shown, setShown] = useState(0);
  const winners = (game.winners ?? [])
    .map((w) => ({ ...w, player: game.players.find((p) => p.id === w.id) }))
    .filter((w) => w.player);
  const youWon = winners.some((w) => w.id === YOU);
  const lastRound = stage >= ROUNDS_PER_GAME;
  const pick = winners[Math.min(shown, winners.length - 1)];
  return (
    <div className="results" role="dialog" aria-modal="true" aria-label={t('roundOver')}>
      {youWon && <Confetti />}
      <div className="results-card">
        <span className="phase-chip">{roundLabel(t, stage, patternOf(game.settings))}</span>
        {pick ? (
          <>
            <h2 className="results-title">{youWon ? t('youWin') : t('bingo')}</h2>
            {!youWon && game.youClaimed && <p className="late-bingo" role="status">{t('lateBingo')}</p>}
            <ol className="winner-list">
              {winners.map((w, i) => (
                <li key={w.id}>
                  <button type="button" className={`winner-row${w === pick ? ' is-on' : ''}`} onClick={() => setShown(i)}>
                    <span className="winner-medal">{MEDALS[i]}</span>
                    <span className="winner-name">{w.player.name}{w.id === YOU && <em> ({t('you')})</em>}</span>
                  </button>
                </li>
              ))}
            </ol>
            <Card cells={pick.player.cells} marks={pick.player.marks} size={game.settings.size} winLine={pick.line} isText={game.settings.mode === 'custom'} />
          </>
        ) : (
          <>
            <Mascot size={80} prop="card" />
            <h2 className="results-title">{t('nobodyWon')}</h2>
          </>
        )}
        {lastRound && history.length > 0 && (
          <section className="game-summary" aria-label={t('gameSummary')}>
            <h3>{t('gameSummary')}</h3>
            {history.map((h) => (
              <div key={h.stage} className="summary-row">
                <span className="summary-round">{roundLabel(t, h.stage, h.pattern)}</span>
                <span className="summary-winners">
                  {h.winners.length ? h.winners.map((w, i) => `${MEDALS[i]} ${w.name}${w.id === YOU ? ` (${t('you')})` : ''}`).join('  ') : '—'}
                </span>
              </div>
            ))}
          </section>
        )}
        <div className="results-actions">
          <button type="button" className="ghost-btn" onClick={onLobby}>{t('backToLobby')}</button>
          {onNext
            ? <button type="button" className="home-btn small" onClick={onNext}>{lastRound ? t('newGame') : t('nextRound').replace('{n}', stage + 1)}</button>
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
