// An original round cat-like buddy drawn in SVG (placeholder for the original's artwork).

const BODY = '#2fd3e6';
const BODY_DARK = '#16a9c4';
const INK = '#1b1240';

/**
 * @param {{ size?: number, prop?: 'card'|'none'|'star'|'pencil'|'mic'|'brush'|'controller'|'book', tint?: string, className?: string, title?: string }} props
 */
export default function Mascot({ size = 46, prop = 'card', tint = BODY, className = '', title }) {
  const shade = tint === BODY ? BODY_DARK : 'rgba(0,0,0,.18)';
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <ellipse cx="60" cy="110" rx="30" ry="5" fill="rgba(5,2,14,.35)" />
      {/* ears */}
      <path d="M30 40 L28 12 L52 30 Z" fill={tint} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M90 40 L94 12 L68 30 Z" fill={tint} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M33 33 L32 19 L45 29 Z" fill="#ff8fb8" />
      <path d="M87 33 L90 19 L75 29 Z" fill="#ff8fb8" />
      {/* body */}
      <path
        d="M60 24 C88 24 100 44 100 68 C100 94 84 106 60 106 C36 106 20 94 20 68 C20 44 32 24 60 24 Z"
        fill={tint}
        stroke={INK}
        strokeWidth="3"
      />
      <path d="M32 92 C42 102 78 102 88 92 C82 101 72 105 60 105 C48 105 38 101 32 92 Z" fill={shade} />
      {/* face */}
      <ellipse cx="45" cy="58" rx="9" ry="10" fill={INK} />
      <ellipse cx="75" cy="58" rx="9" ry="10" fill={INK} />
      <circle cx="48" cy="54" r="3.4" fill="#fff" />
      <circle cx="78" cy="54" r="3.4" fill="#fff" />
      <circle cx="42" cy="62" r="1.6" fill="#fff" />
      <circle cx="72" cy="62" r="1.6" fill="#fff" />
      <ellipse cx="34" cy="72" rx="7" ry="4" fill="#ff7fb0" opacity=".75" />
      <ellipse cx="86" cy="72" rx="7" ry="4" fill="#ff7fb0" opacity=".75" />
      <path d="M53 70 Q56.5 74 60 70 Q63.5 74 67 70" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      <MascotProp prop={prop} />
    </svg>
  );
}

function MascotProp({ prop }) {
  if (prop === 'card') {
    return (
      <g transform="translate(80 54) rotate(12)">
        <rect x="0" y="0" width="30" height="34" rx="3" fill="#fff7e8" stroke={INK} strokeWidth="2.5" />
        <rect x="0" y="0" width="30" height="8" rx="3" fill="#fd79a8" stroke={INK} strokeWidth="2.5" />
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect
              key={`${r}${c}`}
              x={3.5 + c * 6.2}
              y={11 + r * 5.6}
              width="4.6"
              height="4.2"
              fill={(r + c) % 3 === 0 ? '#fd79a8' : '#c9c0ea'}
            />
          )),
        )}
      </g>
    );
  }
  if (prop === 'star') return <path d="M98 40 l4 9 10 1 -8 6 3 10 -9 -6 -9 6 3 -10 -8 -6 10 -1z" fill="#ffd166" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />;
  if (prop === 'pencil') return <g transform="translate(86 52) rotate(30)"><rect width="9" height="34" rx="2" fill="#ffd166" stroke={INK} strokeWidth="2.4" /><path d="M0 34 L4.5 44 L9 34Z" fill="#f4c9a0" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" /></g>;
  if (prop === 'mic') return <g transform="translate(88 56)"><rect x="4" y="12" width="6" height="22" rx="3" fill="#4b3f8f" stroke={INK} strokeWidth="2.4" /><circle cx="7" cy="9" r="9" fill="#a29bfe" stroke={INK} strokeWidth="2.4" /></g>;
  if (prop === 'brush') return <g transform="translate(84 46) rotate(25)"><rect x="3" y="12" width="6" height="30" rx="3" fill="#e17055" stroke={INK} strokeWidth="2.4" /><path d="M1 14 Q6 -4 11 14Z" fill="#fd79a8" stroke={INK} strokeWidth="2.4" /></g>;
  if (prop === 'controller') return <g transform="translate(78 74)"><rect width="34" height="20" rx="9" fill="#6c5ce7" stroke={INK} strokeWidth="2.4" /><circle cx="25" cy="9" r="2.6" fill="#55efc4" /><path d="M7 10h8M11 6v8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></g>;
  if (prop === 'book') return <g transform="translate(80 66)"><path d="M0 4 Q15 -2 17 6 Q19 -2 34 4 V30 Q19 24 17 32 Q15 24 0 30Z" fill="#55efc4" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" /></g>;
  return null;
}
