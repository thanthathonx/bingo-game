// Galaxy background: nebula glows, star field, a little constellation and floating sparkles.

const SPARKS = [
  { cls: 's-pink', left: '16%', bottom: '6%', size: '1.5rem', dur: '18s', delay: '0s', ch: '✦' },
  { cls: 's-mint', left: '33%', bottom: '16%', size: '1.1rem', dur: '24s', delay: '-7s', ch: '✧' },
  { cls: 's-lav', left: '54%', bottom: '4%', size: '1.7rem', dur: '21s', delay: '-12s', ch: '✦' },
  { cls: 's-gold', left: '71%', bottom: '22%', size: '1.2rem', dur: '26s', delay: '-4s', ch: '✶' },
  { cls: 's-pink', left: '87%', bottom: '11%', size: '1.3rem', dur: '20s', delay: '-15s', ch: '✧' },
];

export default function Backdrop() {
  return (
    <div className="gb-backdrop" aria-hidden="true">
      <div className="gb-stars" />
      <div className="gb-neb n1" />
      <div className="gb-neb n2" />
      <div className="gb-neb n3" />
      <svg className="gb-dots" width="220" height="150" viewBox="0 0 220 150">
        <circle cx="165" cy="30" r="3" fill="#ffd166" opacity=".8" />
        <circle cx="70" cy="60" r="3" fill="#55efc4" opacity=".7" />
        <circle cx="205" cy="70" r="3.4" fill="#a29bfe" />
        <circle cx="120" cy="92" r="3.6" fill="#efeaff" />
        <circle cx="12" cy="96" r="2.6" fill="#fd79a8" opacity=".5" />
      </svg>
      {SPARKS.map((s) => (
        <span key={`${s.left}${s.bottom}`} className={`gb-spark ${s.cls}`}
          style={{ left: s.left, bottom: s.bottom, fontSize: s.size, animationDuration: s.dur, animationDelay: s.delay }}>
          {s.ch}
        </span>
      ))}
    </div>
  );
}
