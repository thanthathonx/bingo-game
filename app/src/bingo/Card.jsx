import { LETTERS, FREE, letterFor, squaresAway } from './engine.js';
import { useLang } from '../shared/i18n.js';

const LETTER_COLORS = ['var(--bingo-b)', 'var(--bingo-i)', 'var(--bingo-n)', 'var(--bingo-g)', 'var(--bingo-o)'];

export function letterColor(value, size) {
  if (typeof value !== 'number') return 'var(--gb-cyan)';
  const l = letterFor(value, size);
  const i = LETTERS.indexOf(l);
  return LETTER_COLORS[i] ?? 'var(--gb-cyan)';
}

/** Text shown for a call: "B 12" on 5x5 cards, plain numbers or item text otherwise. */
export function callText(value, size) {
  if (typeof value !== 'number') return String(value);
  return size === 5 ? `${letterFor(value, size)} ${value}` : String(value);
}

/**
 * The player's bingo card.
 * @param {{ cells: Array, marks?: boolean[], size: number, winLine?: number[], lastCalled?: unknown,
 *   onCell?: (i: number) => void, mini?: boolean, building?: boolean, isText?: boolean }} props
 */
// target: squares that make up the win shape (Square / Heart), outlined so players know where to aim
export default function Card({ cells, marks = [], size, winLine = [], target = [], onCell, mini = false, building = false, isText = false }) {
  const { t } = useLang();
  const showLetters = size === 5 && !isText && !mini;
  return (
    <div className={`bcard${mini ? ' is-mini' : ''}${isText ? ' is-text' : ''}`} style={{ '--n': size }}>
      {showLetters && (
        <div className="bcard-head" aria-hidden="true">
          {LETTERS.map((l, i) => <span key={l} style={{ color: LETTER_COLORS[i] }}>{l}</span>)}
        </div>
      )}
      <div className="bcard-grid" role={mini ? undefined : 'grid'}>
        {cells.map((v, i) => {
          const isFree = v === FREE;
          const cls = [
            'bcell',
            isFree ? 'is-free' : '',
            marks[i] && !isFree ? 'is-daubed' : '',
            winLine.includes(i) ? 'is-win' : '',
            target.includes(i) ? 'is-target' : '',
            v === null ? 'is-empty' : '',
          ].filter(Boolean).join(' ');
          const label = isFree ? 'FREE' : v ?? '';
          if (mini || !onCell) {
            return <span key={i} className={cls}>{mini ? '' : <CellText value={label} free={isFree} />}</span>;
          }
          return (
            <button key={i} type="button" className={cls} onClick={() => onCell(i)}
              aria-pressed={building ? undefined : Boolean(marks[i])} aria-label={building && v === null ? t('emptySquare') : String(label)}>
              <CellText value={label} free={isFree} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CellText({ value, free }) {
  const { t } = useLang();
  if (free) return <span className="bcell-free">★<small>{t('free')}</small></span>;
  return <span className="bcell-text">{value}</span>;
}

export function awayLabel(marks, size) {
  return squaresAway(marks, size);
}
